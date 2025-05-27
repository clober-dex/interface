import { Chain } from '../model/chain'
import { Currency } from '../model/currency'

type EXTERNAL_CONTRACT =
  | 'FuturesMarket'
  | 'PythOracle'
  | 'TradingCompetitionRegistration'

type EXTERNAL_SUBGRAPH =
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
  DISCORD_URL: string | null
  DOCS_URL: string | null
  RAINBOW_KIT_PROJECT_ID: string
  GOOGLE_ANALYTICS_TRACKING_ID: string
  IS_SWAP_DEFAULT: boolean
  RPC_URL: string
  PYTH_HERMES_ENDPOINT: string
  ANALYTICS_VOLUME_BLACKLIST: {
    timestamp: number
    address: `0x${string}`
  }[]
  BLACKLISTED_USERS: `0x${string}`[]
  EXTERNAL_CONTRACT_ADDRESSES: Record<EXTERNAL_CONTRACT, `0x${string}`>
  EXTERNAL_SUBGRAPH_ENDPOINTS: Record<EXTERNAL_SUBGRAPH, `https://${string}`>
  WHITELISTED_POOL_KEYS: `0x${string}`[]
  REFERENCE_CURRENCY: Currency
  DEFAULT_INPUT_CURRENCY: Currency
  DEFAULT_OUTPUT_CURRENCY: Currency
  WHITELISTED_CURRENCIES: Currency[]
}
