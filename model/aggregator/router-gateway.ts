import {
  PublicClient,
  encodeFunctionData,
  isAddressEqual,
  zeroAddress,
  createPublicClient,
  http,
  getAddress,
} from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { Prices } from '../prices'
import { CHAIN_CONFIG } from '../../chain-configs'
import { applyPercent } from '../../utils/bigint'
import { ROUTER_GATEWAY_ABI } from '../../constants/router-gateway-abi'

import { Aggregator } from './index'

export class AggregatorRouterGateway implements Aggregator {
  public readonly name: string
  public readonly baseUrl: string = ''
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0 // 0% slippage
  public readonly maximumSlippage = 50 // 50% slippage
  public readonly supportsPriceCalculation: boolean
  public readonly chain: Chain
  private readonly aggregator: Aggregator
  private publicClient: PublicClient

  constructor(contract: `0x${string}`, chain: Chain, aggregator: Aggregator) {
    this.contract = contract
    this.chain = chain
    this.aggregator = aggregator
    this.name = aggregator.name
    this.supportsPriceCalculation = aggregator.supportsPriceCalculation
    this.publicClient = createPublicClient({
      chain,
      transport: http(CHAIN_CONFIG.RPC_URL),
    })
  }

  public async currencies(): Promise<Currency[]> {
    return this.aggregator.currencies()
  }

  public async prices(): Promise<Prices> {
    return this.aggregator.prices()
  }

  public quote = async (
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    slippageLimitPercent: number,
    gasPrice: bigint,
    userAddress?: `0x${string}`,
    timeout?: number,
    estimateGas = true,
  ): Promise<{
    amountOut: bigint
    gasLimit: bigint
    aggregator: Aggregator
    transaction: Transaction | undefined
    executionMilliseconds: number
  }> => {
    const start = performance.now()
    const { amountOut, transaction } = await this.aggregator.quote(
      inputCurrency,
      amountIn,
      outputCurrency,
      slippageLimitPercent,
      gasPrice,
      userAddress ? this.contract : undefined,
      timeout,
    )

    if (transaction) {
      if (transaction.data.trim() === '0x') {
        return {
          amountOut,
          gasLimit: 0n,
          aggregator: this,
          transaction: undefined,
          executionMilliseconds: performance.now() - start,
        }
      }
      const data = encodeFunctionData({
        abi: ROUTER_GATEWAY_ABI,
        functionName: 'swap',
        args: [
          inputCurrency.address,
          outputCurrency.address,
          amountIn,
          applyPercent(amountOut, 100 - slippageLimitPercent),
          transaction.to,
          transaction.data,
          0n,
        ],
      })

      const tx: Transaction = {
        data,
        gas: transaction.gas + 500_000n,
        value: isAddressEqual(inputCurrency.address, zeroAddress)
          ? amountIn
          : 0n,
        to: this.contract,
        from: userAddress,
        gasPrice: transaction.gasPrice,
      }
      let gasEstimate = transaction.gas ?? 5_000_000n // Default gas estimate if no transaction is provided
      if (userAddress && estimateGas) {
        try {
          gasEstimate = await this.publicClient.estimateGas({
            to: getAddress(tx.to),
            data: tx.data as `0x${string}`,
            value: BigInt(tx.value),
            account: getAddress(userAddress as `0x${string}`),
          })
        } catch (error) {
          throw new Error(
            `[${this.aggregator.name}] Failed to estimate gas for transaction: ${error}`,
          )
        }
      }
      gasEstimate = gasEstimate + 200_000n // Add buffer for gas limit
      return {
        amountOut,
        gasLimit: gasEstimate,
        aggregator: this,
        transaction: {
          ...tx,
          gas: gasEstimate,
        },
        executionMilliseconds: performance.now() - start,
      }
    }
    return {
      amountOut,
      gasLimit: 0n,
      aggregator: this,
      transaction: undefined,
      executionMilliseconds: performance.now() - start,
    }
  }
}
