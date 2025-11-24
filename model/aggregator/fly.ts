import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'

import { Aggregator } from './index'

export class FlyAggregator implements Aggregator {
  public readonly name = 'Fly'
  public readonly baseUrl = 'https://api.fly.trade'
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0.01 // 0.01% slippage
  public readonly maximumSlippage = 50 // 50% slippage
  public readonly supportsPriceCalculation = true
  public readonly chain: Chain
  private readonly TIMEOUT = 4000
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

    const response = await fetchApi<{
      id: string
      amountOut: string
      fees: {
        type: string
        value: string
      }[]
      resourceEstimate: { gasLimit: string }
    }>(this.baseUrl, 'aggregator/quote', {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      timeout: this.TIMEOUT,
      params: {
        network: this.chain.name.toLowerCase(),
        fromTokenAddress: isAddressEqual(
          inputCurrency.address,
          this.nativeTokenAddress,
        )
          ? this.nativeTokenAddress
          : getAddress(inputCurrency.address),
        toTokenAddress: isAddressEqual(
          outputCurrency.address,
          this.nativeTokenAddress,
        )
          ? this.nativeTokenAddress
          : getAddress(outputCurrency.address),
        sellAmount: amountIn.toString(),
        slippage: slippageLimitPercent / 100,
        fromAddress: userAddress,
        toAddress: userAddress,
        gasless: false,
        // affiliateAddress: '0x0000000000000000000000000000000000000000',
        // affiliateFeeInPercentage: 0.01, // 1%
      },
    })

    const estimatedGas = response.fees.find((fee) => fee.type === 'gas')?.value
    if (!estimatedGas) {
      throw new Error('Estimated gas not found')
    }
    if (!userAddress) {
      return {
        amountOut: BigInt(response.amountOut),
        gasLimit: BigInt(response.resourceEstimate.gasLimit),
        aggregator: this,
        transaction: undefined,
        executionMilliseconds: performance.now() - start,
      }
    }

    const { data, gasLimit, value, to } = await fetchApi<{
      data: string
      gasLimit: string
      value: string
      to: string
    }>(this.baseUrl, 'aggregator/transaction', {
      method: 'GET',
      params: {
        quoteId: response.id,
        estimateGas: false, // if true, result will be 404 when the user balance is not enough
      },
      headers: {
        accept: 'application/json',
      },
      timeout: this.TIMEOUT,
    })

    return {
      amountOut: BigInt(response.amountOut),
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
