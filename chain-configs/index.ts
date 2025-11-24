import { getAddress, zeroAddress } from 'viem'
import {
  getContractAddresses,
  getNativeCurrency,
  getReferenceCurrency,
} from '@clober/v2-sdk'
import colors from 'tailwindcss/colors'
import { monad } from 'viem/chains'

import { ChainConfig } from './type'
import { WHITELISTED_CURRENCIES } from './currency'
import { WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES } from './pool'

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
  URL: 'https://app.clober.io',
  LANDING_PAGE_URL: 'https://clober.io',
  TWITTER_HANDLE: '@CloberDEX',
  GITHIB_URL: 'https://github.com/clober-dex/',
  ASSETS_GITHUB_REPO: 'monad-crypto/token-list',
  DISCORD_URL: 'https://discord.gg/clober-dex',
  DOCS_URL: 'https://docs.clober.io/',
  HIDE_ORDERBOOK: false,
  USE_MEV_PROTECTION: false,
  WEB3_AUTH_CLIENT_ID: null,
  WALLET_CONNECT_PROJECT_ID: '14e09398dd595b0d1dccabf414ac4531',
  GOOGLE_ANALYTICS_TRACKING_ID: 'G-TE8CSB6JP2',
  IS_SWAP_DEFAULT: true,
  ENABLE_REMOTE_CHAIN_BALANCES: false,
  RPC_URL:
    'https://rpc-mainnet.monadinfra.com/rpc/9O0pQDN9n3ORB3tgy759FHQdt9Esjutd',
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
    ['0x6017684Bea9Cb6e9874fC6DBA4438271eBF9F5DA']: 'MadHouse',
    [getReferenceCurrency({ chainId: CHAIN.id }).address]:
      `W${CHAIN.nativeCurrency.symbol.toUpperCase()}`,
    // ['0x6352a56caadC4F1E25CD6c75970Fa768A3304e64']: 'OpenOcean',
    ['0xA68A7F0601effDc65C64d9C47cA1b18D96B4352c']: 'Monorail',
    ['0xECE5E77f9A9846C4D69555Eb44E0CFF8B5F03F1e']: 'EisenFinance',
    ['0x6131B5fae19EA4f9D964eAc0408E4408b66337b5']: 'KyberSwap',
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
