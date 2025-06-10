import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'
import { Currency } from '../currency'
import { Prices } from '../prices'

export interface Aggregator {
  name: string
  baseUrl: string
  contract: `0x${string}`
  chain: Chain
  minimumSlippage: number
  maximumSlippage: number
  supportsPriceCalculation: boolean
  currencies(): Promise<Currency[]>
  prices(): Promise<Prices>

  quote(
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    ...args: any[]
  ): Promise<{
    amountOut: bigint
    gasLimit: bigint
    aggregator: Aggregator
    transaction: Transaction | undefined
  }>
}
