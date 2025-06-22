import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'

import { Aggregator } from './index'

export class EisenFinanceAggregator implements Aggregator {
  public readonly name = 'EisenFinance'
  public readonly baseUrl = 'https://hiker.hetz-01.eisenfinance.com'
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0.1 // 0.01% slippage
  public readonly maximumSlippage = 50 // 50% slippage
  public readonly supportsPriceCalculation = false
  public readonly chain: Chain
  private readonly TIMEOUT = 30 * 1000
  private readonly nativeTokenAddress =
    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

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

  public async quote(
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    slippageLimitPercent: number,
    gasPrice: bigint,
    userAddress?: `0x${string}`,
  ): Promise<{
    amountOut: bigint
    gasLimit: bigint
    aggregator: Aggregator
    transaction: Transaction | undefined
    executionMilliseconds: number
  }> {
    const start = performance.now()
    slippageLimitPercent = this.calculateSlippage(slippageLimitPercent)
    let params = {
      fromChain: this.chain.id.toString(),
      toChain: this.chain.id.toString(),
      fromAmount: amountIn.toString(),
      fromToken: isAddressEqual(inputCurrency.address, zeroAddress)
        ? this.nativeTokenAddress
        : getAddress(inputCurrency.address),
      toToken: isAddressEqual(outputCurrency.address, zeroAddress)
        ? this.nativeTokenAddress
        : getAddress(outputCurrency.address),
      slippage: (slippageLimitPercent / 100).toString(),
    } as any
    if (userAddress) {
      params = {
        ...params,
        fromAddress: userAddress as `0x${string}`,
      }
    }

    const {
      result: {
        estimate: { toAmount },
        transactionRequest: { value, to, data, gasLimit },
      },
    } = await fetchApi<{
      result: {
        estimate: { toAmount: string }
        transactionRequest: {
          value: string
          to: string
          data: string
          gasLimit: string
        }
      }
    }>(this.baseUrl, `public/v1/quote`, {
      method: 'GET',
      headers: {
        'X-EISEN-KEY':
          'ZWlzZW5fZTVjOTY4NGEtNTUzYi00MWRjLWE3ZTEtN2Y1Y2EzNTU2MzFm',
        accept: '*/*',
      },
      timeout: this.TIMEOUT,
      params,
    })

    return {
      amountOut: BigInt(toAmount),
      gasLimit: BigInt(gasLimit),
      aggregator: this,
      transaction: {
        data: data as `0x${string}`,
        gas: BigInt(gasLimit),
        value: BigInt(value),
        to: getAddress(to),
        gasPrice: gasPrice,
        from: userAddress,
      },
      executionMilliseconds: performance.now() - start,
    }
  }
}
