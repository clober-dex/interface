import { Chain } from '../model/chain'
import { Currency } from '../model/currency'

type EXTERNAL_CONTRACT =
  | 'FuturesMarket'
  | 'PythOracle'
  | 'TradingCompetitionRegistration'
  | 'AggregatorRouterGateway'
  | 'ReferralManager'

type EXTERNAL_SUBGRAPH =
  | 'FUTURES_MARKET'
  | 'TRADING_COMPETITION_SEASON1'
  | 'TRADING_COMPETITION_SEASON2'
  | 'LIQUIDITY_VAULT_POINT'

export type ChainConfig = {
  TITLE: string
  DEX_NAME: string
  COLOR: any
  URL: string
  LANDING_PAGE_URL: string
  CHAIN: Chain
  TWITTER_HANDLE: string | null
  GITHIB_URL: string | null
  ASSETS_GITHUB_REPO: string | null
  DISCORD_URL: string | null
  DOCS_URL: string | null
  WEB3_AUTH_CLIENT_ID: string | null
  WALLET_CONNECT_PROJECT_ID: string
  GOOGLE_ANALYTICS_TRACKING_ID: string
  IS_SWAP_DEFAULT: boolean
  ENABLE_REMOTE_CHAIN_BALANCES: boolean
  RPC_URL: string
  PYTH_HERMES_ENDPOINT: string
  ANALYTICS_VOLUME_BLACKLIST: {
    timestamp: number
    address: `0x${string}`
  }[]
  MAX_SWAP_FEE: number
  SWAP_FEE_PERCENT: number
  BLACKLISTED_USERS: `0x${string}`[]
  ROUTER_MAP: Record<`0x${string}`, string>
  EXTERNAL_CONTRACT_ADDRESSES: Record<EXTERNAL_CONTRACT, `0x${string}`>
  EXTERNAL_SUBGRAPH_ENDPOINTS: Record<EXTERNAL_SUBGRAPH, `https://${string}`>
  WHITELISTED_POOL_KEYS: `0x${string}`[]
  SLIPPAGE_PERCENT: {
    DEFAULT: number
    LOW: number
    MEDIUM: number
    WARNING: number
    UNLIMITED: number
  }
  DEFAULT_INPUT_CURRENCY: Currency
  DEFAULT_OUTPUT_CURRENCY: Currency
  DEFAULT_STABLE_COIN_CURRENCY: Currency
  WHITELISTED_CURRENCIES: Currency[]
  HIDE_ORDERBOOK: boolean
  USE_MEV_PROTECTION: boolean
}
