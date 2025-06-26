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
          // function swap(address inToken, address outToken, uint256 amountIn, uint256 minAmountOut, address router, bytes calldata data)
          {
            inputs: [
              { internalType: 'address', name: 'inToken', type: 'address' },
              { internalType: 'address', name: 'outToken', type: 'address' },
              { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
              {
                internalType: 'uint256',
                name: 'minAmountOut',
                type: 'uint256',
              },
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
          applyPercent(amountOut, 95),
          transaction.to,
          transaction.data,
        ],
      })

      const tx: Transaction = {
        data,
        gas: transaction.gas + 500_000n,
        value: isAddressEqual(inputCurrency.address, zeroAddress)
          ? amountIn
          : 0n,
        to: this.contract,
        from: transaction.from,
        gasPrice: transaction.gasPrice,
      }
      let gasEstimate = 2_000_000n // Default gas estimate if no transaction is provided
      if (transaction.from) {
        try {
          gasEstimate = await this.publicClient.estimateGas({
            to: getAddress(tx.to),
            data: tx.data as `0x${string}`,
            value: BigInt(tx.value),
            account: getAddress(transaction.from as `0x${string}`),
          })
        } catch (error) {
          throw new Error(
            `[${this.aggregator.name}] Failed to estimate gas for transaction: ${error}`,
          )
        }
      }
      return {
        amountOut,
        gasLimit: (transaction?.gas ?? 0n) + 500_000n,
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
