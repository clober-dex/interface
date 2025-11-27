import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'
import { toUnitString } from '../../utils/bigint'

import { Aggregator } from './index'

export class MonorailAggregator implements Aggregator {
  public readonly name = 'Monorail'
  public readonly baseUrl = 'https://pathfinder.monorail.xyz'
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0.01 // 0.01% slippage
  public readonly maximumSlippage = 50 // 50% slippage
  public readonly supportsPriceCalculation = false
  public readonly chain: Chain
  private readonly TIMEOUT = 4000
  private readonly nativeTokenAddress = zeroAddress
  private currenciesCache: Currency[] | null = null

  constructor(contract: `0x${string}`, chain: Chain) {
    this.contract = contract
    this.chain = chain
  }

  public async currencies(): Promise<Currency[]> {
    if (this.currenciesCache) {
      return this.currenciesCache
    }

    const result = await fetchApi<
      {
        address: `0x${string}`
        name: string
        symbol: string
        decimals: number
        image_uri: string
      }[]
    >('https://api.monorail.xyz', `v2/tokens/category/verified`, {
      method: 'GET',
      headers: {
        accept: '*/*',
      },
    })
    const currencies = result.reduce((acc, curr) => {
      acc.push({
        address: getAddress(curr.address),
        name: curr.name,
        symbol: curr.symbol,
        decimals: Number(curr.decimals),
        icon: curr.image_uri ?? undefined,
      })
      return acc
    }, [] as Currency[])
    if (currencies.length > 0) {
      this.currenciesCache = currencies
    }
    return currencies
  }

  public async prices(): Promise<Prices> {
    const result = await fetchApi<
      {
        address: `0x${string}`
        usd_per_token: string
      }[]
    >('https://api.monorail.xyz', `v2/tokens/category/verified`, {
      method: 'GET',
      headers: {
        accept: '*/*',
      },
    })

    const nativePrice = parseFloat(
      result.find((r) => isAddressEqual(r.address, this.nativeTokenAddress))
        ?.usd_per_token ?? '0',
    )
    if (nativePrice <= 0) {
      return {} as Prices
    }

    return result.reduce(
      (acc, curr) => {
        if (!isAddressEqual(curr.address, this.nativeTokenAddress)) {
          const price = parseFloat(curr.usd_per_token ?? '0')
          if (price > 0) {
            acc[getAddress(curr.address)] = price
            acc[curr.address.toLowerCase() as `0x${string}`] = price
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
      source: 4322176390363441,
      amount: toUnitString(amountIn, inputCurrency.decimals),
      from: isAddressEqual(inputCurrency.address, this.nativeTokenAddress)
        ? this.nativeTokenAddress
        : getAddress(inputCurrency.address),
      to: isAddressEqual(outputCurrency.address, this.nativeTokenAddress)
        ? this.nativeTokenAddress
        : getAddress(outputCurrency.address),
      slippage: (slippageLimitPercent * 100).toString(),
    } as any
    if (userAddress) {
      params = {
        ...params,
        sender: userAddress,
      }
    }

    const { output, transaction, gas_estimate } = await fetchApi<{
      output: string
      gas_estimate: string
      transaction: {
        to: string
        data: string
        value: string
      }
    }>(this.baseUrl, `v4/quote`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      timeout: timeout ?? this.TIMEOUT,
      params,
    })
    if (!userAddress) {
      return {
        amountOut: BigInt(output),
        gasLimit: BigInt(gas_estimate),
        aggregator: this,
        transaction: undefined,
        executionMilliseconds: performance.now() - start,
      }
    }

    return {
      amountOut: BigInt(output),
      gasLimit: BigInt(gas_estimate),
      aggregator: this,
      transaction: {
        data: transaction.data as `0x${string}`,
        gas: BigInt(gas_estimate),
        value: BigInt(transaction.value),
        to: getAddress(transaction.to),
        gasPrice: gasPrice,
        from: userAddress,
      },
      executionMilliseconds: performance.now() - start,
    }
  }
}
