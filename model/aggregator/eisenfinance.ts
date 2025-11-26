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
    const { result } = await fetchApi<{
      result: {
        tokenAddress: `0x${string}`
        price: string
        quoteToken: string
      }[]
    }>(
      'https://api.hetz-01.eisenfinance.com',
      `v1/chains/${this.chain.id}/v2/prices?quoteToken=USD`,
      {
        method: 'GET',
        headers: {
          accept: '*/*',
        },
      },
    )
    const nativePrice = parseFloat(
      result.find((r) =>
        isAddressEqual(r.tokenAddress, this.nativeTokenAddress),
      )?.price ?? '0',
    )
    if (nativePrice <= 0) {
      return {} as Prices
    }

    return result.reduce(
      (acc, curr) => {
        if (!isAddressEqual(curr.tokenAddress, this.nativeTokenAddress)) {
          const price = parseFloat(curr.price ?? '0')
          if (price > 0) {
            acc[getAddress(curr.tokenAddress)] = price
            acc[curr.tokenAddress.toLowerCase() as `0x${string}`] = price
          }
        }
        return acc
      },
      {
        [zeroAddress]: nativePrice,
      } as Prices,
    )
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
        fromAddress: userAddress,
      }
    } else {
      params = {
        ...params,
        fromAddress: zeroAddress,
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
      timeout: timeout ?? this.TIMEOUT,
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
