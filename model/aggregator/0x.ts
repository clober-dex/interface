import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'

import { Aggregator } from './index'

export class ZeroXAggregator implements Aggregator {
  public readonly name = '0x'
  public readonly baseUrl = 'https://matcha.xyz'
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0.01 // 0.01% slippage
  public readonly maximumSlippage = 50 // 50% slippage
  public readonly supportsPriceCalculation = true
  public readonly chain: Chain
  private readonly TIMEOUT = 4000
  private readonly nativeTokenAddress =
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

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

    if (userAddress) {
      const response = await fetchApi<{
        buyAmount: string
        transaction: {
          data: string
          gas: string
          gasPrice: string
          to: string
          value: string
        }
      }>(this.baseUrl, 'api/swap/quote', {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
        timeout: this.TIMEOUT,
        params: {
          chainId: this.chain.id,
          sellToken: isAddressEqual(inputCurrency.address, zeroAddress)
            ? this.nativeTokenAddress
            : getAddress(inputCurrency.address),
          buyToken: isAddressEqual(outputCurrency.address, zeroAddress)
            ? this.nativeTokenAddress
            : getAddress(outputCurrency.address),
          sellAmount: amountIn.toString(),
          slippageBps: Math.floor(slippageLimitPercent * 100),
          taker: userAddress,
        },
      })

      return {
        amountOut: BigInt(response.buyAmount),
        gasLimit: BigInt(response.transaction.gas),
        aggregator: this,
        transaction: {
          data: response.transaction.data as `0x${string}`,
          gas: BigInt(response.transaction.gas),
          value: BigInt(response.transaction.value),
          to: getAddress(response.transaction.to),
          gasPrice: gasPrice,
          from: userAddress,
        },
        executionMilliseconds: performance.now() - start,
      }
    } else {
      const response = await fetchApi<{
        buyAmount: string
        gas: string
      }>(this.baseUrl, 'api/swap/price', {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
        timeout: this.TIMEOUT,
        params: {
          chainId: this.chain.id,
          sellToken: isAddressEqual(inputCurrency.address, zeroAddress)
            ? this.nativeTokenAddress
            : getAddress(inputCurrency.address),
          buyToken: isAddressEqual(outputCurrency.address, zeroAddress)
            ? this.nativeTokenAddress
            : getAddress(outputCurrency.address),
          sellAmount: amountIn.toString(),
          slippageBps: Math.floor(slippageLimitPercent * 100),
        },
      })

      return {
        amountOut: BigInt(response.buyAmount),
        gasLimit: BigInt(response.gas),
        aggregator: this,
        transaction: undefined,
        executionMilliseconds: performance.now() - start,
      }
    }
  }
}
