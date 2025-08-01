import { Transaction } from '@clober/v2-sdk'

import { Aggregator } from './index'

export type Quote = {
  timestamp: number
  amountIn: bigint
  amountOut: bigint
  fee: bigint
  gasLimit: bigint
  aggregator: Aggregator
  transaction: Transaction | undefined
  gasUsd: number
  netAmountOutUsd: number
  executionMilliseconds: number
}
