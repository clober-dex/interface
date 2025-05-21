import { Chain } from '../model/chain'
import { Currency } from '../model/currency'

type EXTERNAL_CONTRACT =
  | 'FuturesMarket'
  | 'PythOracle'
  | 'TradingCompetitionRegistration'

type EXTERNAL_SUBGRAPH = 'FUTURES' | 'LIQUIDITY_VAULT_POINT'

export type ChainConfig = {
  TITLE: string
  DEX_NAME: string
  URL: string
  LANDING_PAGE_URL: string
  CHAIN: Chain
  TWITTER_HANDLE: string
  GITHIB_URL: string
  DISCORD_URL: string
  DOCS_URL: string
  RAINBOW_KIT_PROJECT_ID: string
  GOOGLE_ANALYTICS_TRACKING_ID: string
  RPC_URL: string
  PYTH_HERMES_ENDPOINT: string
  EXTERNAL_CONTRACT_ADDRESSES: Record<EXTERNAL_CONTRACT, `0x${string}`>
  EXTERNAL_SUBGRAPH_ENDPOINTS: Record<EXTERNAL_SUBGRAPH, `https://${string}`>
  WHITELISTED_POOL_KEYS: `0x${string}`[]
  REFERENCE_CURRENCY: Currency
  DEFAULT_INPUT_CURRENCY: Currency
  WHITELISTED_CURRENCIES: Currency[]
}
