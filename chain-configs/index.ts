import { getAddress, zeroAddress } from 'viem'
import { getNativeCurrency } from '@clober/v2-sdk'
import colors from 'tailwindcss/colors'

import { ChainConfig } from './type'
import { WHITELISTED_CURRENCIES } from './currency'
import { WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES } from './pool'
import { monad } from './monad-mainnet'

const CHAIN = {
  ...monad,
  icon: '/chain-logo-images/monad.png',
}

export const CANONICAL_USDC = {
  address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603' as `0x${string}`,
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  icon: '/asset-icon/USDC.webp',
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
  ENABLE_REMOTE_CHAIN_BALANCES: false,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL!,
  PYTH_HERMES_ENDPOINT: 'https://hermes.pyth.network',
  ANALYTICS_VOLUME_BLACKLIST: [],
  MAX_SWAP_FEE: 0.1,
  SWAP_FEE_PERCENT: 30,
  EXTERNAL_CONTRACT_ADDRESSES: {
    FuturesMarket: zeroAddress,
    PythOracle: zeroAddress,
    TradingCompetitionRegistration: zeroAddress,
    AggregatorRouterGateway: getAddress(
      '0x7B58A24C5628881a141D630f101Db433D419B372',
    ),
    ReferralManager: getAddress('0xD08e387542121f8305Bb976e222cbB7c1a56dD77'),
  },
  BLACKLISTED_USERS: [],
  ROUTER_MAP: {
    // ['0x1e538356D3Cfe7fA04696A92515adD4A895ECB65']: 'MadHouse',
    // ['0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701']: `W${CHAIN.nativeCurrency.symbol.toUpperCase()}`,
    // ['0x6352a56caadC4F1E25CD6c75970Fa768A3304e64']: 'OpenOcean',
    // ['0x11133460F102c5dE431F7749c8Bc2b7c172568E1']: 'Monorail',
    // ['0x0f3Cfe8869d6fFdA410Ae6a7B78e7168780e22C3']: 'EisenFinance',
    // ['0x08feDaACe14EB141E51282441b05182519D853D1']: 'Clober',
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
  SLIPPAGE_PERCENT: {
    DEFAULT: 0.15,
    LOW: 0.15,
    MEDIUM: 0.5,
    WARNING: 3,
    UNLIMITED: 50.0,
  },
  DEFAULT_INPUT_CURRENCY: getNativeCurrency({ chainId: CHAIN.id }),
  DEFAULT_OUTPUT_CURRENCY: CANONICAL_USDC,
  DEFAULT_STABLE_COIN_CURRENCY: CANONICAL_USDC,
  WHITELISTED_CURRENCIES: [
    ...WHITELISTED_CURRENCIES,
    ...WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES.filter(
      ({ wrappedLpCurrency }) => wrappedLpCurrency,
    ).map(({ wrappedLpCurrency }) => wrappedLpCurrency!),
  ],
}
