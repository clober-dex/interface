import { Transaction } from '@clober/v2-sdk'

import { Aggregator } from './index'

export type Quote = {
  amountIn: bigint
  amountOut: bigint
  gasLimit: bigint
  aggregator: Aggregator
  transaction: Transaction | undefined
  gasUsd: number
  netAmountOutUsd: number
  executionMilliseconds: number
}
