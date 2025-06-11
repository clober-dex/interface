import {
  createPublicClient,
  http,
  TransactionReceipt,
  WalletClient,
} from 'viem'

import { Currency } from '../model/currency'
import { ERC20_PERMIT_ABI } from '../abis/@openzeppelin/erc20-permit-abi'
import { Chain } from '../model/chain'
import { CHAIN_CONFIG } from '../chain-configs'

import { buildTransaction, sendTransaction } from './transaction'

export const maxApprove = async (
  chain: Chain,
  walletClient: WalletClient,
  currency: Currency,
  spender: `0x${string}`,
  disconnectAsync: () => Promise<void>,
  onUserSigned: (hash: `0x${string}`) => void,
  onTxConfirmation: (receipt: TransactionReceipt) => void,
): Promise<TransactionReceipt | undefined> => {
  if (!walletClient) {
    return
  }
  const publicClient = createPublicClient({
    chain,
    transport: http(CHAIN_CONFIG.RPC_URL),
  })
  const transaction = await buildTransaction(publicClient, {
    address: currency.address,
    abi: ERC20_PERMIT_ABI,
    functionName: 'approve',
    args: [spender, 2n ** 256n - 1n],
    account: walletClient.account!,
    chain,
  })
  return sendTransaction(
    chain,
    walletClient,
    transaction,
    disconnectAsync,
    onUserSigned,
    onTxConfirmation,
  )
}
