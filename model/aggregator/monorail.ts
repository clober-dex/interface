import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'
import { formatUnits } from '../../utils/bigint'

import { Aggregator } from './index'

export class MonorailAggregator implements Aggregator {
  public readonly name = 'Monorail'
  public readonly baseUrl = 'https://testnet-pathfinder-v2.monorail.xyz'
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0.01 // 0.01% slippage
  public readonly maximumSlippage = 50 // 50% slippage
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
      amount: formatUnits(amountIn, inputCurrency.decimals),
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
        sender: userAddress as `0x${string}`,
      }
    }

    const { output, transaction } = await fetchApi<{
      output: string
      transaction: {
        to: string
        data: string
        value: string
      }
    }>(this.baseUrl, `v3/quote`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      timeout: this.TIMEOUT,
      params,
    })

    // TOOD: estimatedGas
    const estimatedGas = 1_000_000n
    return {
      amountOut: BigInt(output),
      gasLimit: BigInt(estimatedGas),
      aggregator: this,
      transaction: {
        data: transaction.data as `0x${string}`,
        gas: BigInt(estimatedGas),
        value: BigInt(transaction.value),
        to: getAddress(transaction.to),
        gasPrice: gasPrice,
        from: userAddress,
      },
    }
  }
}
