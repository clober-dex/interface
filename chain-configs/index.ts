import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { http } from 'viem'
import {
  getContractAddresses,
  getNativeCurrency,
  getReferenceCurrency,
} from '@clober/v2-sdk'
import colors from 'tailwindcss/colors'
import { createConfig, injected } from 'wagmi'
import {
  bitgetWallet,
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'

import { socialAccountWallet } from '../utils/web3auth'

import { ChainConfig } from './type'
import { WHITELISTED_CURRENCIES } from './currency'
import { WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES } from './pool'
import { monad } from './monad-mainnet'

const CHAIN = {
  ...monad,
  icon: '/chain-logo-images/monad.png',
}
export const CHAIN_CONFIG: ChainConfig = {
  CHAIN,
  TITLE: 'Fully On-chain Order Book',
  DEX_NAME: 'Clober',
  COLOR: colors.blue,
  URL: 'https://alpha.clober.io',
  LANDING_PAGE_URL: 'https://clober.io',
  TWITTER_HANDLE: '@CloberDEX',
  GITHIB_URL: 'https://github.com/clober-dex/',
  ASSETS_GITHUB_REPO: null,
  DISCORD_URL: 'https://discord.gg/clober-dex',
  DOCS_URL: 'https://docs.clober.io/',
  HIDE_ORDERBOOK: false,
  USE_MEV_PROTECTION: false,
  WEB3_AUTH_CLIENT_ID: null,
  WALLET_CONNECT_PROJECT_ID: '14e09398dd595b0d1dccabf414ac4531',
  GOOGLE_ANALYTICS_TRACKING_ID: 'G-TE8CSB6JP2',
  IS_SWAP_DEFAULT: true,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL!,
  PYTH_HERMES_ENDPOINT: 'https://hermes.pyth.network',
  ANALYTICS_VOLUME_BLACKLIST: [],
  MAX_SWAP_FEE: 0.1,
  SWAP_FEE_PERCENT: 30,
  EXTERNAL_CONTRACT_ADDRESSES: {
    FuturesMarket: '0x0000000000000000000000000000000000000000',
    PythOracle: '0x0000000000000000000000000000000000000000',
    TradingCompetitionRegistration:
      '0x0000000000000000000000000000000000000000',
    AggregatorRouterGateway: '0x0000000000000000000000000000000000000000',
  },
  BLACKLISTED_USERS: [],
  ROUTER_MAP: {
    [getReferenceCurrency({ chainId: CHAIN.id }).address]:
      `W${CHAIN.nativeCurrency.symbol.toUpperCase()}`,
    [getContractAddresses({ chainId: CHAIN.id }).Controller]: 'Clober',
  },
  EXTERNAL_SUBGRAPH_ENDPOINTS: {
    FUTURES_MARKET: 'https://',
    TRADING_COMPETITION_SEASON1: 'https://',
    TRADING_COMPETITION_SEASON2: 'https://',
    LIQUIDITY_VAULT_POINT: 'https://',
  },
  WHITELISTED_POOL_KEYS: WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES.map(
    ({ poolKey }) => poolKey,
  ),
  REFERENCE_CURRENCY: getReferenceCurrency({ chainId: CHAIN.id }),
  DEFAULT_INPUT_CURRENCY: getNativeCurrency({ chainId: CHAIN.id }),
  DEFAULT_OUTPUT_CURRENCY: {
    address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    icon: '/asset-icon/USDC.webp',
  },
  DEFAULT_STABLE_COIN_CURRENCY: {
    address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    icon: '/asset-icon/USDC.webp',
  },
  WHITELISTED_CURRENCIES: [
    ...WHITELISTED_CURRENCIES,
    ...WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES.filter(
      ({ wrappedLpCurrency }) => wrappedLpCurrency,
    ).map(({ wrappedLpCurrency }) => wrappedLpCurrency!),
  ],
}

let config: any | null = null
export const getClientConfig = () => {
  if (typeof window === 'undefined') {
    return null
  }
  if (config) {
    return config
  }

  config = createConfig({
    chains: [CHAIN],
    transports: {
      [CHAIN.id]: http(CHAIN_CONFIG.RPC_URL),
    },
    ssr: false,
    connectors: [
      injected({ shimDisconnect: true }),
      ...connectorsForWallets(
        [
          {
            groupName: 'Recommended',
            wallets: CHAIN_CONFIG.WEB3_AUTH_CLIENT_ID
              ? [
                  socialAccountWallet,
                  bitgetWallet,
                  coinbaseWallet,
                  walletConnectWallet,
                ]
              : [bitgetWallet, coinbaseWallet, walletConnectWallet],
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
