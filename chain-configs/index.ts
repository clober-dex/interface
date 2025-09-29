import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { http, zeroAddress } from 'viem'
import {
  getContractAddresses,
  getNativeCurrency,
  getReferenceCurrency,
} from '@clober/v2-sdk'
import colors from 'tailwindcss/colors'
import { createConfig, injected } from 'wagmi'
import {
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'

import { socialAccountWallet } from '../utils/web3auth'

import { ChainConfig } from './type'
import { WHITELISTED_CURRENCIES } from './currency'
import { WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES } from './pool'
import { giwaSepolia } from './giwa-sepolia'

const CHAIN = {
  ...giwaSepolia,
  icon: '/chain-logo-images/giwa-sepolia.jpg',
}
export const CHAIN_CONFIG: ChainConfig = {
  CHAIN,
  TITLE: 'Fully On-chain Order Book',
  DEX_NAME: 'GiwaDex',
  COLOR: colors.rose,
  URL: 'https://giwadex.io',
  LANDING_PAGE_URL: 'https://giwadex.io',
  TWITTER_HANDLE: '@',
  GITHIB_URL: 'https://github.com/Giwa-DEX/',
  ASSETS_GITHUB_REPO: null,
  DISCORD_URL: 'https://discord.gg/',
  DOCS_URL: 'https://docs.giwadex.io/',
  HIDE_ORDERBOOK: false,
  USE_MEV_PROTECTION: false,
  WEB3_AUTH_CLIENT_ID:
    'BH8RNo9NNVaFUjXjf0x96jiVLuYpFhTJkotoNF9sVLnVYu5kV4yADw4bjH7ngElE0EXG_eDD1YOa0yhu4YbEg6I',
  WALLET_CONNECT_PROJECT_ID: '14e09398dd595b0d1dccabf414ac4531',
  GOOGLE_ANALYTICS_TRACKING_ID: 'G-WEYBD66JRZ',
  IS_SWAP_DEFAULT: true,
  RPC_URL: 'https://giwa-sepolia.nodit.io/M94yyNJXVqR2Y9d9ztC5y27EdPeDjikn',
  PYTH_HERMES_ENDPOINT: 'https://hermes-beta.pyth.network',
  ANALYTICS_VOLUME_BLACKLIST: [],
  MAX_SWAP_FEE: 0.1,
  SWAP_FEE_PERCENT: 30,
  EXTERNAL_CONTRACT_ADDRESSES: {
    FuturesMarket: zeroAddress,
    PythOracle: zeroAddress,
    TradingCompetitionRegistration: zeroAddress,
    AggregatorRouterGateway: getContractAddresses({ chainId: CHAIN.id })!
      .Controller,
  },
  BLACKLISTED_USERS: [],
  ROUTER_MAP: {},
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
    address: '0x0Cd2C356be90864F4a5e0551E79dd039b246FaCA',
    name: 'GiwaDex USD',
    symbol: 'USDG',
    decimals: 6,
    icon: '/asset-icon/USD.svg',
  },
  DEFAULT_STABLE_COIN_CURRENCY: {
    address: '0x0Cd2C356be90864F4a5e0551E79dd039b246FaCA',
    name: 'GiwaDex USD',
    symbol: 'USDG',
    decimals: 6,
    icon: '/asset-icon/USD.svg',
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
            wallets: [socialAccountWallet, coinbaseWallet, walletConnectWallet],
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
