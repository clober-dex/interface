import { getAddress } from 'viem'

import { Currency } from '../model/currency'

export const WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES: {
  poolKey: `0x${string}`
  wrappedLpCurrency?: Currency
}[] = [
  {
    poolKey:
      '0xbe1bdd34a1c3fdc238c581aa52ffd5f5ebb61e229ee65197f00679df7d51beea',
    wrappedLpCurrency: {
      address: getAddress('0x3207Ff3Fe78E1F44d90CE5D3496F45AF7F92BbbA'),
      name: 'Wrapped USDC-WETH LP Token',
      symbol: 'wUSDC-WETH',
      decimals: 18,
      icon: '/asset-icon/usdc-weth-lp.png',
    },
  },
  {
    poolKey:
      '0x6cfff26d468c939f54a469dbb0c49ed2e9ffc00a050812c6dfdc02d20ceb2b3a',
    wrappedLpCurrency: {
      address: getAddress('0xDd2DF2beB91880f272E01ce8474060f11DD75040'),
      name: 'Wrapped USDC-MON LP Token',
      symbol: 'wUSDC-MON',
      decimals: 18,
      icon: '/asset-icon/usdc-mon-lp.png',
    },
  },
]
