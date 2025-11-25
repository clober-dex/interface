import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'

import { Aggregator } from './index'

export class ZeroXAggregator implements Aggregator {
  public readonly name = '0x'
  public readonly baseUrl = '/api/proxy'
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0.01 // 0.01% slippage
  public readonly maximumSlippage = 50 // 50% slippage
  public readonly supportsPriceCalculation = true
  public readonly chain: Chain
  private readonly TIMEOUT = 20 * 1000
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
    const slippageBps = Math.floor(slippageLimitPercent * 100)

    const sellToken = isAddressEqual(inputCurrency.address, zeroAddress)
      ? this.nativeTokenAddress
      : getAddress(inputCurrency.address)
    const buyToken = isAddressEqual(outputCurrency.address, zeroAddress)
      ? this.nativeTokenAddress
      : getAddress(outputCurrency.address)

    if (userAddress) {
      const qs = new URLSearchParams({
        chainId: this.chain.id.toString(),
        sellToken,
        buyToken,
        sellAmount: amountIn.toString(),
        slippageBps: slippageBps.toString(),
        taker: getAddress(userAddress),
      })

      const response = await fetchApi<{
        buyAmount: string
        transaction: {
          data: string
          gas: string
          gasPrice: string
          to: string
          value: string
        }
      }>(this.baseUrl, '', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          '0x-api-key': '',
          '0x-version': 'v2',
        },
        timeout: this.TIMEOUT,
        params: {
          url: `https://api.0x.org/swap/allowance-holder/quote?${qs.toString()}`,
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
      const qs = new URLSearchParams({
        chainId: this.chain.id.toString(),
        sellToken,
        buyToken,
        sellAmount: amountIn.toString(),
        slippageBps: slippageBps.toString(),
      })

      const response = await fetchApi<{
        buyAmount: string
        gas: string
      }>(this.baseUrl, '', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          '0x-api-key': '',
          '0x-version': 'v2',
        },
        timeout: this.TIMEOUT,
        params: {
          url: `https://api.0x.org/swap/allowance-holder/price?${qs.toString()}`,
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
