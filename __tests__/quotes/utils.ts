import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  http,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { CHAIN_CONFIG } from '../../chain-configs'

export const publicClient = createPublicClient({
  chain: CHAIN_CONFIG.CHAIN,
  transport: http(CHAIN_CONFIG.RPC_URL),
})
export const walletClient = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
  chain: CHAIN_CONFIG.CHAIN,
  transport: http(CHAIN_CONFIG.RPC_URL),
})
export const TIMEOUT = 5000000000

export const getTokenBalance = async ({
  tokenAddress,
  userAddress,
}: {
  tokenAddress: `0x${string}`
  userAddress: `0x${string}`
}) => {
  return isAddressEqual(tokenAddress, zeroAddress)
    ? publicClient.getBalance({
        address: userAddress,
      })
    : publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [userAddress],
      })
}
