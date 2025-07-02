import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../chain'

export interface Executor {
  name: string
  chain: Chain

  sendTransaction(transaction: Transaction, timeout?: number): Promise<void>
}
