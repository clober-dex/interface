import { Transaction } from '@clober/v2-sdk'
import { WalletClient } from 'viem'

import { Chain } from '../chain'

export interface Executor {
  name: string
  chain: Chain
  contract: `0x${string}`

  sendTransaction(
    transaction: Transaction,
    walletClient: WalletClient,
    timeout?: number,
  ): Promise<`0x${string}`>
}
