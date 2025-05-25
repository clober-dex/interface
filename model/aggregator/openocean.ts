import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'

import { Aggregator } from './index'

export class OpenOceanAggregator implements Aggregator {
  public readonly name = 'OpenOcean'
  public readonly baseUrl = 'https://ethapi.openocean.finance'
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0.01 // 0.01% slippage
  public readonly maximumSlippage = 50 // 50% slippage
  public readonly chain: Chain
  private readonly TIMEOUT = 4000
  private readonly nativeTokenAddress = zeroAddress
  private readonly referrer: `0x${string}` =
    '0x331fa4a4f7b906491f37bdc8b042b894234e101f'

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
  }> {
    slippageLimitPercent = this.calculateSlippage(slippageLimitPercent)
    let params = {
      quoteType: 'swap',
      inTokenAddress: isAddressEqual(
        inputCurrency.address,
        this.nativeTokenAddress,
      )
        ? this.nativeTokenAddress
        : getAddress(inputCurrency.address),
      outTokenAddress: isAddressEqual(
        outputCurrency.address,
        this.nativeTokenAddress,
      )
        ? this.nativeTokenAddress
        : getAddress(outputCurrency.address),
      amount: amountIn.toString(),
      gasPrice: gasPrice.toString(),
      slippage: (slippageLimitPercent * 100).toString(),
      referrer: this.referrer,
    } as any
    if (userAddress) {
      params = {
        ...params,
        account: userAddress as `0x${string}`,
      }
    }

    const { estimatedGas, outAmount, data, value, to } = await fetchApi<{
      estimatedGas: string
      outAmount: string
      data: string
      value: string
      to: string
    }>(this.baseUrl, `v2/${this.chain.id}/swap`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      timeout: this.TIMEOUT,
      params,
    })

    return {
      amountOut: BigInt(outAmount),
      gasLimit: BigInt(estimatedGas),
      aggregator: this,
      transaction: {
        data: data as `0x${string}`,
        gas: BigInt(estimatedGas),
        value: BigInt(value),
        to: getAddress(to),
        gasPrice: gasPrice,
        from: userAddress,
      },
    }
  }
}
