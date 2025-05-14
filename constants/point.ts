import { CHAIN_IDS } from '@clober/v2-sdk'

export const LIQUIDITY_VAULT_POINT_START_AT: {
  [chainId in CHAIN_IDS]:
    | {
        [key in string]: number
      }
    | undefined
} = {
  [CHAIN_IDS.MONAD_TESTNET]: {
    ['0xad46920833ad7a1ba8e74cc241faf9ae4fd3dc4616ad9648b13160f8453e444f']: 1743465600,
  },
  [CHAIN_IDS.RISE_SEPOLIA]: {},
}

export const LIQUIDITY_VAULT_POINT_PER_SECOND: {
  [chainId in CHAIN_IDS]:
    | {
        [key in string]: number
      }
    | undefined
} = {
  [CHAIN_IDS.MONAD_TESTNET]: {
    ['0xad46920833ad7a1ba8e74cc241faf9ae4fd3dc4616ad9648b13160f8453e444f']: 0.000001,
  },
  [CHAIN_IDS.RISE_SEPOLIA]: {},
}
