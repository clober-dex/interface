import { Wallet, WalletDetailsParams } from '@rainbow-me/rainbowkit'
import { createConnector } from 'wagmi'

import Web3AuthConnectorInstance from './connector'

export const googleWallet = (): Wallet => ({
  id: 'google_wallet',
  name: 'Google',
  iconUrl: async () =>
    'https://raw.githubusercontent.com/edent/SuperTinyIcons/refs/heads/master/images/svg/google.svg',
  iconBackground: '#fff',
  installed: true,
  createConnector: (walletDetails: WalletDetailsParams) =>
    createConnector(
      (config) =>
        ({
          ...Web3AuthConnectorInstance({ socialType: 'google' })(config),
          ...walletDetails,
        }) as any,
    ),
})

export const xWallet = (): Wallet => ({
  id: 'x_wallet',
  name: 'X',
  iconUrl: async () =>
    'https://raw.githubusercontent.com/edent/SuperTinyIcons/745841c3f62bdd0d1cf81d9a2ee4f9195729b459/images/svg/x.svg',
  iconBackground: '#fff',
  installed: true,
  createConnector: (walletDetails: WalletDetailsParams) =>
    createConnector(
      (config) =>
        ({
          ...Web3AuthConnectorInstance({ socialType: 'twitter' })(config),
          ...walletDetails,
        }) as any,
    ),
})

export const discordWallet = (): Wallet => ({
  id: 'discord_wallet',
  name: 'Discord',
  iconUrl: async () =>
    'https://raw.githubusercontent.com/edent/SuperTinyIcons/745841c3f62bdd0d1cf81d9a2ee4f9195729b459/images/svg/discord.svg',
  iconBackground: '#fff',
  installed: true,
  createConnector: (walletDetails: WalletDetailsParams) =>
    createConnector(
      (config) =>
        ({
          ...Web3AuthConnectorInstance({ socialType: 'discord' })(config),
          ...walletDetails,
        }) as any,
    ),
})

export const appleWallet = (): Wallet => ({
  id: 'apple_wallet',
  name: 'Apple',
  iconUrl: async () =>
    'https://raw.githubusercontent.com/edent/SuperTinyIcons/745841c3f62bdd0d1cf81d9a2ee4f9195729b459/images/svg/apple.svg',
  iconBackground: '#fff',
  installed: true,
  createConnector: (walletDetails: WalletDetailsParams) =>
    createConnector(
      (config) =>
        ({
          ...Web3AuthConnectorInstance({ socialType: 'apple' })(config),
          ...walletDetails,
        }) as any,
    ),
})

export const emailWallet = (): Wallet => ({
  id: 'email_wallet',
  name: 'Email',
  iconUrl: async () =>
    'https://raw.githubusercontent.com/edent/SuperTinyIcons/745841c3f62bdd0d1cf81d9a2ee4f9195729b459/images/svg/email.svg',
  iconBackground: '#fff',
  installed: true,
  createConnector: (walletDetails: WalletDetailsParams) =>
    createConnector(
      (config) =>
        ({
          ...Web3AuthConnectorInstance({ socialType: 'email_passwordless' })(
            config,
          ),
          ...walletDetails,
        }) as any,
    ),
})
