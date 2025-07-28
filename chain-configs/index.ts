import { monadTestnet } from 'viem/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { getAddress, http, zeroAddress } from 'viem'
import { getNativeCurrency, getReferenceCurrency } from '@clober/v2-sdk'
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

const CHAIN = {
  ...monadTestnet,
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
  ASSETS_GITHUB_REPO: 'clober-dex/assets',
  DISCORD_URL: 'https://discord.gg/clober-dex',
  DOCS_URL: 'https://docs.clober.io/',
  WEB3_AUTH_CLIENT_ID:
    'BH8RNo9NNVaFUjXjf0x96jiVLuYpFhTJkotoNF9sVLnVYu5kV4yADw4bjH7ngElE0EXG_eDD1YOa0yhu4YbEg6I',
  WALLET_CONNECT_PROJECT_ID: '14e09398dd595b0d1dccabf414ac4531',
  GOOGLE_ANALYTICS_TRACKING_ID: 'G-TE8CSB6JP2',
  IS_SWAP_DEFAULT: true,
  RPC_URL:
    'https://proud-tiniest-flower.monad-testnet.quiknode.pro/a4ebe00fca2e7bf01201f3b0f7fe2f0077c52a36',
  PYTH_HERMES_ENDPOINT: 'https://hermes-beta.pyth.network',
  ANALYTICS_VOLUME_BLACKLIST: [
    { timestamp: 1743638400, address: zeroAddress },
    {
      timestamp: 1743638400,
      address: getAddress('0xb2f82D0f38dc453D596Ad40A37799446Cc89274A'),
    },
  ],
  MAX_SWAP_FEE: 0.1,
  SWAP_FEE_PERCENT: 30,
  EXTERNAL_CONTRACT_ADDRESSES: {
    FuturesMarket: getAddress('0x56b88CFe40d592Ec4d4234043e039d7CA807f110'),
    PythOracle: getAddress('0xad2B52D2af1a9bD5c561894Cdd84f7505e1CD0B5'),
    TradingCompetitionRegistration: getAddress(
      '0xfE5771C5b651dfa9f8db95140efcC75d59CE0c88',
    ),
    AggregatorRouterGateway: getAddress(
      '0xfD845859628946B317A78A9250DA251114FbD846',
    ),
  },
  BLACKLISTED_USERS: [
    '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    '0xCcd0964F534c4583C35e07E47AbE8984A6bB1534',
  ],
  ROUTER_MAP: {
    ['0x1e538356D3Cfe7fA04696A92515adD4A895ECB65']: 'MadHouse',
    ['0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701']: `W${monadTestnet.nativeCurrency.symbol.toUpperCase()}`,
    ['0x6352a56caadC4F1E25CD6c75970Fa768A3304e64']: 'OpenOcean',
    ['0x11133460F102c5dE431F7749c8Bc2b7c172568E1']: 'Monorail',
    ['0xfC985A550f7c29EC5266E6591b029FE2509E1D0d']: 'EisenFinance',
    ['0x08feDaACe14EB141E51282441b05182519D853D1']: 'Clober',
  },
  EXTERNAL_SUBGRAPH_ENDPOINTS: {
    FUTURES_MARKET:
      'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/clober-futures-subgraph-monad-testnet/latest/gn',
    TRADING_COMPETITION_SEASON1:
      'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/clober-futures-subgraph-monad-testnet/api',
    TRADING_COMPETITION_SEASON2:
      'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/clober-futures-subgraph-monad-testnet/latest/gn',
    LIQUIDITY_VAULT_POINT:
      'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/liquidity-vault-point-monad-testnet/latest/gn',
  },
  WHITELISTED_POOL_KEYS: WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES.map(
    ({ poolKey }) => poolKey,
  ),
  REFERENCE_CURRENCY: getReferenceCurrency({ chainId: CHAIN.id }),
  DEFAULT_INPUT_CURRENCY: getNativeCurrency({ chainId: CHAIN.id }),
  DEFAULT_OUTPUT_CURRENCY: {
    address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
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
