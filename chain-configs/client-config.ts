import { createConfig, injected } from 'wagmi'
import { http } from 'viem'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { backpackWallet, bitgetWallet } from '@rainbow-me/rainbowkit/wallets'

import { socialAccountWallet } from '../utils/custom-wallets/web3auth'
import { hahaWallet } from '../utils/custom-wallets/haha-wallet'

import { CHAIN_CONFIG } from './index'

let config: any | null = null
export const getClientConfig = () => {
  if (typeof window === 'undefined') {
    return null
  }
  if (config) {
    return config
  }

  config = createConfig({
    chains: [CHAIN_CONFIG.CHAIN],
    transports: {
      [CHAIN_CONFIG.CHAIN.id]: http(CHAIN_CONFIG.RPC_URL),
    },
    ssr: false,
    connectors: [
      injected({ shimDisconnect: true }),
      ...connectorsForWallets(
        [
          {
            groupName: 'Recommended',
            wallets: CHAIN_CONFIG.WEB3_AUTH_CLIENT_ID
              ? [socialAccountWallet, bitgetWallet, backpackWallet, hahaWallet]
              : [bitgetWallet, backpackWallet, hahaWallet],
          },
        ],
        {
          appName: CHAIN_CONFIG.DEX_NAME,
          projectId: CHAIN_CONFIG.WALLET_CONNECT_PROJECT_ID,
        },
      ),
    ],
  })

  return config
}
