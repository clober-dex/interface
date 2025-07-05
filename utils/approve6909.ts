import {
  createPublicClient,
  http,
  TransactionReceipt,
  WalletClient,
} from 'viem'

import { Currency } from '../model/currency'
import { Chain } from '../model/chain'
import { CHAIN_CONFIG } from '../chain-configs'

import { buildTransaction, sendTransaction } from './transaction'

export const getAllowance = async (
  chain: Chain,
  userAddress: `0x${string}`,
  currency: Currency,
  spender: `0x${string}`,
  id: `0x${string}`,
): Promise<bigint> => {
  const publicClient = createPublicClient({
    chain,
    transport: http(CHAIN_CONFIG.RPC_URL),
  })
  return publicClient.readContract({
    address: currency.address,
    abi: [
      {
        inputs: [
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'address', name: 'spender', type: 'address' },
          { internalType: 'uint256', name: 'id', type: 'uint256' },
        ],
        name: 'allowance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'allowance',
    args: [userAddress, spender, BigInt(id)],
  })
}

export const maxApprove = async (
  chain: Chain,
  walletClient: WalletClient,
  currency: Currency,
  spender: `0x${string}`,
  id: `0x${string}`,
  disconnectAsync: () => Promise<void>,
  onUserSigned: (hash: `0x${string}`) => void,
  onTxConfirmation: (receipt: TransactionReceipt) => void,
  executorName: string | null,
): Promise<TransactionReceipt | undefined> => {
  if (!walletClient) {
    return
  }
  const publicClient = createPublicClient({
    chain,
    transport: http(CHAIN_CONFIG.RPC_URL),
  })
  const transaction = await buildTransaction(publicClient, {
    account: walletClient.account!,
    chain: walletClient.chain!,
    address: currency.address,
    abi: [
      {
        inputs: [
          { internalType: 'address', name: 'spender', type: 'address' },
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
        name: 'approve',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      },
    ] as const,
    functionName: 'approve',
    args: [
      spender,
      BigInt(id),
      2n ** 256n - 1n, // Approve max amount
    ],
  })
  return sendTransaction(
    chain,
    walletClient,
    transaction,
    disconnectAsync,
    onUserSigned,
    onTxConfirmation,
    transaction.gasPrice,
    executorName,
  )
}
