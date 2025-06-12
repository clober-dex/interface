import {
  PublicClient,
  getAddress,
  isAddressEqual,
  zeroAddress,
  createPublicClient,
  http,
} from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { fetchApi } from '../../apis/utils'
import { Prices } from '../prices'
import { CHAIN_CONFIG } from '../../chain-configs'

import { Aggregator } from './index'

export class MadhouseAggregator implements Aggregator {
  public readonly name = 'Madhouse'
  public readonly baseUrl = 'https://api.madhouse.ag'
  public readonly contract: `0x${string}`
  public readonly minimumSlippage = 0.01 // 0.01% slippage
  public readonly maximumSlippage = 50 // 50% slippage
  public readonly supportsPriceCalculation = true
  public readonly chain: Chain
  private readonly TIMEOUT = 6000
  private readonly nativeTokenAddress = zeroAddress
  private publicClient: PublicClient

  constructor(contract: `0x${string}`, chain: Chain) {
    this.contract = contract
    this.chain = chain
    this.publicClient = createPublicClient({
      chain,
      transport: http(CHAIN_CONFIG.RPC_URL),
    })
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
    const params = {
      amountIn: amountIn.toString(),
      tokenIn: isAddressEqual(inputCurrency.address, this.nativeTokenAddress)
        ? this.nativeTokenAddress
        : getAddress(inputCurrency.address),
      tokenOut: isAddressEqual(outputCurrency.address, this.nativeTokenAddress)
        ? this.nativeTokenAddress
        : getAddress(outputCurrency.address),
      tokenInDecimals: inputCurrency.decimals.toString(),
      tokenOutDecimals: outputCurrency.decimals.toString(),
      slippage: (slippageLimitPercent / 100).toString(),
      protocols:
        'native-wrapper,uniswap-v2,uniswap-v3,pancakeswap-v2,pancakeswap-v3,atlantis-v2,apriori-liquid-staking,magma-liquid-staking,shmonad,kintsu,octoswap-v1',
      includePoolInfo: true,
    } as any

    const { amountOut, tx } = await fetchApi<{
      amountOut: string
      tx: {
        to: string
        data: string
        value: string
      }
    }>(this.baseUrl, `stage-a/swap/v1/quote?chain=${this.chain.id}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      timeout: this.TIMEOUT,
      params,
    })

    let gasEstimate = 1_000_000n
    if (userAddress) {
      gasEstimate = await this.publicClient.estimateGas({
        to: getAddress(tx.to),
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value),
        account: userAddress,
      })
    }

    return {
      amountOut: BigInt(amountOut),
      gasLimit: gasEstimate,
      aggregator: this,
      transaction: {
        data: tx.data as `0x${string}`,
        gas: gasEstimate,
        value: BigInt(tx.value),
        to: getAddress(tx.to),
        gasPrice: gasPrice,
        from: userAddress,
      },
      executionMilliseconds: performance.now() - start,
    }
  }
}
