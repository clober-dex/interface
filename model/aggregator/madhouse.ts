import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'

import { Aggregator } from './index'

export class MadhouseAggregator implements Aggregator {
  public readonly name = 'Madhouse'
  public readonly baseUrl = 'https://api.madhouse.ag'
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0.01 // 0.01% slippage
  public readonly maximumSlippage = 50 // 50% slippage
  public readonly supportsPriceCalculation = false
  public readonly chain: Chain
  private readonly TIMEOUT = 15 * 1000
  private readonly nativeTokenAddress = zeroAddress

  constructor(contract: `0x${string}`, chain: Chain) {
    this.contract = contract
    this.chain = chain
  }

  public async currencies(): Promise<Currency[]> {
    return [] as Currency[]
  }

  public async prices(): Promise<Prices> {
    return {} as Prices
  }

  private calculateSlippage(slippageLimitPercent: number) {
    slippageLimitPercent = Math.max(slippageLimitPercent, this.minimumSlippage)
    slippageLimitPercent = Math.min(slippageLimitPercent, this.maximumSlippage)
    return slippageLimitPercent
  }

  public quote = async (
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    slippageLimitPercent: number,
    gasPrice: bigint,
    userAddress?: `0x${string}`,
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
    slippageLimitPercent = this.calculateSlippage(slippageLimitPercent)
    const params = {
      amountIn: amountIn.toString(),
      tokenIn: isAddressEqual(inputCurrency.address, this.nativeTokenAddress)
        ? this.nativeTokenAddress
        : getAddress(inputCurrency.address),
      tokenOut: isAddressEqual(outputCurrency.address, this.nativeTokenAddress)
        ? this.nativeTokenAddress
        : getAddress(outputCurrency.address),
      tokenInDecimals: inputCurrency.decimals.toString(),
      tokenOutDecimals: outputCurrency.decimals.toString(),
      slippage: (slippageLimitPercent / 100).toString(),
      protocols:
        'native-wrapper,uniswap-v2,uniswap-v3,pancakeswap-v2,pancakeswap-v3,atlantis-v2,apriori-liquid-staking,magma-liquid-staking,shmonad,kintsu,octoswap-v1',
      includePoolInfo: true,
    } as any

    const { amountOut, tx } = await fetchApi<{
      amountOut: string
      tx: {
        to: string
        data: string
        value: string
      }
    }>(this.baseUrl, `stage-a/swap/v1/quote?chain=${this.chain.id}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      timeout: timeout ?? this.TIMEOUT,
      params,
    })

    const gasEstimate = 2_000_000n

    return {
      amountOut: BigInt(amountOut),
      gasLimit: gasEstimate,
      aggregator: this,
      transaction: {
        data: tx.data as `0x${string}`,
        gas: gasEstimate,
        value: BigInt(tx.value),
        to: getAddress(tx.to),
        gasPrice: gasPrice,
        from: userAddress,
      },
      executionMilliseconds: performance.now() - start,
    }
  }
}
