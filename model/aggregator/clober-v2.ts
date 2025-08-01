import {
  encodeFunctionData,
  isAddressEqual,
  parseUnits,
  zeroAddress,
} from 'viem'
import {
  getCurrencies,
  getLatestPriceMap,
  marketOrder,
  Transaction,
} from '@clober/v2-sdk'

import { Currency } from '../currency'
import { Prices } from '../prices'
import { formatUnits } from '../../utils/bigint'
import { Chain } from '../chain'
import { CHAIN_CONFIG } from '../../chain-configs'
import { fetchLeverageIndexPrices } from '../../apis/futures/leverage-index-price'
import { WETH_ABI } from '../../abis/weth-abi'

import { Aggregator } from './index'

export class CloberV2Aggregator implements Aggregator {
  public readonly name = CHAIN_CONFIG.DEX_NAME
  public readonly baseUrl = ''
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0 // 0% slippage
  public readonly maximumSlippage = 100 // 100% slippage
  public readonly supportsPriceCalculation = true
  private readonly nativeTokenAddress = zeroAddress
  public readonly chain: Chain
  public readonly weth: `0x${string}`
  private marketOrderGasLimit = 300_000n
  private wrapOrUnWrapGasLimit = 60_000n

  constructor(contract: `0x${string}`, chain: Chain) {
    this.contract = contract
    this.chain = chain
    this.weth = CHAIN_CONFIG.REFERENCE_CURRENCY.address
  }

  public async currencies(): Promise<Currency[]> {
    return getCurrencies({ chainId: this.chain.id })
  }

  public async prices(): Promise<Prices> {
    const [prices, leverageIndexOraclePrices] = await Promise.allSettled([
      getLatestPriceMap({
        chainId: this.chain.id,
      }),
      fetchLeverageIndexPrices(),
    ])
    return {
      ...(prices.status === 'fulfilled' ? prices.value : {}),
      ...(leverageIndexOraclePrices.status === 'fulfilled'
        ? leverageIndexOraclePrices.value
        : {}),
    } as Prices
  }

  public quote = async (
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    slippageLimitPercent: number,
    gasPrice: bigint,
    userAddress?: `0x${string}`,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    timeout?: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    estimateGas = true,
  ): Promise<{
    amountOut: bigint
    gasLimit: bigint
    aggregator: Aggregator
    transaction: Transaction | undefined
    executionMilliseconds: number
  }> => {
    const start = performance.now()
    const { transaction, amountOut } = await this.buildCallData(
      inputCurrency,
      amountIn,
      outputCurrency,
      slippageLimitPercent,
      gasPrice,
      userAddress,
    )
    return {
      amountOut,
      gasLimit: transaction.gas,
      aggregator: this,
      transaction,
      executionMilliseconds: performance.now() - start,
    }
  }

  private async buildCallData(
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    slippageLimitPercent: number,
    gasPrice: bigint,
    userAddress?: `0x${string}`,
  ): Promise<{
    transaction: Transaction
    amountOut: bigint
  }> {
    if (
      isAddressEqual(inputCurrency.address, this.nativeTokenAddress) &&
      isAddressEqual(outputCurrency.address, this.weth)
    ) {
      return {
        transaction: {
          data: encodeFunctionData({
            abi: WETH_ABI,
            functionName: 'deposit',
          }),
          gas: this.wrapOrUnWrapGasLimit,
          value: amountIn,
          to: CHAIN_CONFIG.REFERENCE_CURRENCY.address,
          gasPrice,
          from: userAddress,
        },
        amountOut: amountIn,
      }
    } else if (
      isAddressEqual(inputCurrency.address, this.weth) &&
      isAddressEqual(outputCurrency.address, this.nativeTokenAddress)
    ) {
      return {
        transaction: {
          data: encodeFunctionData({
            abi: WETH_ABI,
            functionName: 'withdraw',
            args: [amountIn],
          }),
          gas: this.wrapOrUnWrapGasLimit,
          value: 0n,
          to: CHAIN_CONFIG.REFERENCE_CURRENCY.address,
          gasPrice,
          from: userAddress,
        },
        amountOut: amountIn,
      }
    }
    slippageLimitPercent = Math.max(slippageLimitPercent, this.minimumSlippage)
    slippageLimitPercent = Math.min(slippageLimitPercent, this.maximumSlippage)

    const {
      transaction,
      result: {
        taken: {
          amount,
          currency: { decimals },
          events,
        },
      },
    } = await marketOrder({
      chainId: this.chain.id,
      userAddress: userAddress!,
      inputToken: inputCurrency.address,
      outputToken: outputCurrency.address,
      amountIn: formatUnits(amountIn, inputCurrency.decimals),
      options: {
        rpcUrl: CHAIN_CONFIG.RPC_URL,
        useSubgraph: false,
        slippage: slippageLimitPercent,
        gasLimit: this.marketOrderGasLimit,
      },
    })
    return {
      transaction: {
        ...transaction,
        gasPrice,
        gas: this.marketOrderGasLimit * BigInt(events.length),
      },
      amountOut: parseUnits(amount, decimals),
    }
  }
}
