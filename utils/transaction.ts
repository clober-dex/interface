import {
  Account,
  createPublicClient,
  encodeFunctionData,
  Hash,
  http,
  PublicClient,
  SimulateContractParameters,
  TransactionReceipt,
  WalletClient,
  WriteContractParameters,
} from 'viem'
import { Transaction } from '@clober/v2-sdk'

import { Chain } from '../model/chain'
import { CHAIN_CONFIG } from '../chain-configs'

export async function waitTransaction(chain: Chain, hash: Hash): Promise<void> {
  const publicClient = createPublicClient({
    chain,
    transport: http(CHAIN_CONFIG.RPC_URL),
  })
  await publicClient.waitForTransactionReceipt({ hash })
}

export async function sendTransaction(
  chain: Chain,
  walletClient: WalletClient,
  transaction: Transaction,
  disconnectAsync: () => Promise<void>,
  onUserSigned: (hash: `0x${string}`) => void,
  onTxConfirmation: (receipt: TransactionReceipt) => void,
): Promise<TransactionReceipt | undefined> {
  if (!walletClient) {
    return
  }
  if (disconnectAsync && chain.id !== walletClient.chain!.id) {
    await disconnectAsync()
  }
  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(CHAIN_CONFIG.RPC_URL),
    })
    const hash = await walletClient.sendTransaction({
      data: transaction.data,
      to: transaction.to,
      value: transaction.value,
      gas: transaction.gas,
      account: walletClient.account!,
      chain,
    })
    onUserSigned(hash)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    onTxConfirmation(receipt)
    return receipt
  } catch (e) {
    console.error('Failed to send transaction', e)
    throw e
  }
}

export const buildTransaction = async (
  publicClient: PublicClient,
  args: WriteContractParameters | SimulateContractParameters,
  gasLimit?: bigint,
  gasPriceLimit?: bigint,
): Promise<Transaction> => {
  const data = encodeFunctionData(args)
  const [gas, gasPrice] = await Promise.all([
    gasLimit ??
      publicClient.estimateGas({
        account: args.account as `0x${string}` | Account | undefined,
        data,
        to: args.address,
        value: args.value || 0n,
      }),
    gasPriceLimit ?? publicClient.getGasPrice(),
  ])
  return {
    gas,
    gasPrice,
    data,
    value: args.value || 0n,
    to: args.address,
    from: args.account as `0x${string}` | Account | undefined,
  }
}
