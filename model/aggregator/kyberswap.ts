import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'
import { currentTimestampInSeconds } from '../../utils/date'

import { Aggregator } from './index'

export class KyberswapAggregator implements Aggregator {
  public readonly name = 'KyberSwap'
  public readonly baseUrl = 'https://aggregator-api.kyberswap.com'
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
    const tokenIn = isAddressEqual(inputCurrency.address, zeroAddress)
      ? this.nativeTokenAddress
      : getAddress(inputCurrency.address)
    const tokenOut = isAddressEqual(outputCurrency.address, zeroAddress)
      ? this.nativeTokenAddress
      : getAddress(outputCurrency.address)
    const {
      data: { routeSummary },
    } = await fetchApi<{
      data: {
        routeSummary: any
      }
    }>(this.baseUrl, `${this.chain.name.toLowerCase()}/api/v1/routes`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      timeout: timeout ?? this.TIMEOUT,
      params: {
        tokenIn,
        tokenOut,
        amountIn: amountIn.toString(),
      },
    })

    let params = {
      routeSummary,
      slippageTolerance: slippageLimitPercent * 100,
    } as any
    if (userAddress) {
      params = {
        ...params,
        sender: userAddress,
        recipient: userAddress,
      }
    } else {
      return {
        amountOut: BigInt(routeSummary?.amountOut ?? 0n),
        gasLimit: BigInt(routeSummary?.gas ?? 0n),
        aggregator: this,
        transaction: undefined,
        executionMilliseconds: performance.now() - start,
      }
    }

    const {
      data: { amountOut, data, gas, routerAddress, transactionValue },
    } = await fetchApi<{
      data: {
        amountOut: string
        data: string
        gas: string
        routerAddress: string
        transactionValue: string
      }
    }>(this.baseUrl, `${this.chain.name.toLowerCase()}/api/v1/route/build`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      timeout: timeout ?? this.TIMEOUT,
      data: params,
    })

    return {
      amountOut: BigInt(amountOut),
      gasLimit: BigInt(gas),
      aggregator: this,
      transaction: {
        data: data as `0x${string}`,
        gas: BigInt(gas),
        value: BigInt(transactionValue),
        to: getAddress(routerAddress),
        gasPrice,
        from: userAddress,
      },
      executionMilliseconds: performance.now() - start,
    }
  }
}
