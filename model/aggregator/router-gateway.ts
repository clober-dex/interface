import { encodeFunctionData, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { Prices } from '../prices'

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

  constructor(contract: `0x${string}`, chain: Chain, aggregator: Aggregator) {
    this.contract = contract
    this.chain = chain
    this.aggregator = aggregator
    this.name = aggregator.name
    this.supportsPriceCalculation = aggregator.supportsPriceCalculation
  }

  public async currencies(): Promise<Currency[]> {
    return this.aggregator.currencies()
  }

  public async prices(): Promise<Prices> {
    return this.aggregator.prices()
  }

  async quote(
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    ...args: any[]
  ): Promise<{
    amountOut: bigint
    gasLimit: bigint
    aggregator: Aggregator
    transaction: Transaction | undefined
    executionMilliseconds: number
  }> {
    const start = performance.now()
    const { amountOut, transaction } = await this.aggregator.quote(
      inputCurrency,
      amountIn,
      outputCurrency,
      ...args,
    )

    if (transaction) {
      const data = encodeFunctionData({
        abi: [
          {
            inputs: [
              { internalType: 'address', name: 'inToken', type: 'address' },
              { internalType: 'address', name: 'outToken', type: 'address' },
              { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
              { internalType: 'address', name: 'router', type: 'address' },
              { internalType: 'bytes', name: 'data', type: 'bytes' },
            ],
            name: 'swap',
            outputs: [
              { internalType: 'uint256', name: 'amountOut', type: 'uint256' },
            ],
            stateMutability: 'payable',
            type: 'function',
          },
        ] as const,
        functionName: 'swap',
        args: [
          inputCurrency.address,
          outputCurrency.address,
          amountIn,
          this.aggregator.contract,
          transaction.data,
        ],
      })
      return {
        amountOut,
        gasLimit: transaction?.gas ?? 0n,
        aggregator: this,
        transaction: {
          data,
          gas: transaction.gas + 300_000n,
          value: isAddressEqual(inputCurrency.address, zeroAddress)
            ? amountIn
            : 0n,
          to: this.contract,
          from: transaction.from,
          gasPrice: transaction.gasPrice,
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
