import { Wallet, WalletDetailsParams } from '@rainbow-me/rainbowkit'
import { createConnector } from 'wagmi'

import Web3AuthConnectorInstance from './instance'

export const socialAccountWallet = (): Wallet => ({
  id: 'sns_wallet',
  name: 'Social Account',
  iconUrl: async () => './snsWallet.png',
  iconBackground: '#fff',
  installed: true,
  createConnector: (walletDetails: WalletDetailsParams) =>
    createConnector(
      (config) =>
        ({
          ...Web3AuthConnectorInstance()(config),
          ...walletDetails,
        }) as any,
    ),
})
