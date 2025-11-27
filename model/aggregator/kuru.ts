import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'
import { currentTimestampInSeconds } from '../../utils/date'

import { Aggregator } from './index'

export class KuruAggregator implements Aggregator {
  public readonly name = 'Kuru'
  public readonly baseUrl = 'https://ws.kuru.io'
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0.01 // 0.01% slippage
  public readonly maximumSlippage = 50 // 50% slippage
  public readonly supportsPriceCalculation = false
  public readonly chain: Chain
  private readonly TIMEOUT = 15 * 1000
  private readonly gasLimit = 2_000_000n // Set a fixed gas limit as Kuru API does not provide gas estimate
  private readonly nativeTokenAddress = zeroAddress
  private readonly referrer: `0x${string}` =
    '0xfb976Bae0b3Ef71843F1c6c63da7Df2e44B3836d'

  token: { value: string; expiration: number } | null = null

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

  private quoteWithRevert = async (
    params: any,
  ): Promise<{
    amountOut: bigint
    gasLimit: bigint
    aggregator: Aggregator
    transaction: Transaction | undefined
    executionMilliseconds: number
  }> => {
    const start = performance.now()

    const {
      data: {
        data: { output },
      },
    } = await fetchApi<{
      data: {
        data: {
          output: string
        }
      }
    }>('/api/proxy', '', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'text/plain;charset=UTF-8',
        host: 'rpc.kuru.io',
        origin: 'https://kuru.io',
      },
      timeout: this.TIMEOUT,
      params: {
        url: `https://rpc.kuru.io/swap`,
      },
      data: params,
    })

    return {
      amountOut: BigInt(output),
      gasLimit: this.gasLimit,
      aggregator: this,
      transaction: undefined,
      executionMilliseconds: performance.now() - start,
    }
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
      amount: amountIn.toString(),
      tokenIn: isAddressEqual(inputCurrency.address, this.nativeTokenAddress)
        ? this.nativeTokenAddress
        : getAddress(inputCurrency.address),
      tokenOut: isAddressEqual(outputCurrency.address, this.nativeTokenAddress)
        ? this.nativeTokenAddress
        : getAddress(outputCurrency.address),
      autoSlippage: false,
      slippageTolerance: slippageLimitPercent * 100,
    } as any

    if (userAddress) {
      const now = currentTimestampInSeconds()
      if (!this.token || (this.token && this.token.expiration <= now + 60)) {
        const { token, expires_at } = await fetchApi<{
          token: string
          expires_at: number
        }>(this.baseUrl, 'api/generate-token', {
          method: 'POST',
          headers: {
            accept: 'application/json',
          },
          timeout: timeout ?? this.TIMEOUT,
          data: { user_address: userAddress.toLowerCase() },
        })
        this.token = {
          value: token,
          expiration: expires_at,
        }
      }

      try {
        const { output, transaction } = await fetchApi<{
          output: string
          transaction: {
            calldata: string
            value: string
            to: string
          }
        }>(this.baseUrl, 'api/quote', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token.value}`,
            'Content-Type': 'application/json',
          },
          timeout: timeout ?? this.TIMEOUT,
          data: {
            ...params,
            userAddress,
            referrerAddress: this.referrer,
            referrerFeeBps: 0,
          },
        })
        return {
          amountOut: BigInt(output),
          gasLimit: this.gasLimit,
          aggregator: this,
          transaction: {
            data: `0x${transaction.calldata}`,
            gas: this.gasLimit,
            value: BigInt(transaction.value),
            to: getAddress(transaction.to),
            gasPrice: gasPrice,
            from: userAddress,
          },
          executionMilliseconds: performance.now() - start,
        }
      } catch {
        // Fallback to quote with revert
        return this.quoteWithRevert(params)
      }
    }

    return this.quoteWithRevert(params)
  }
}
