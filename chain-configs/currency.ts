import { zeroAddress } from 'viem'

import { Currency } from '../model/currency'

export const WHITELISTED_CURRENCIES: Currency[] = [
  {
    address: zeroAddress,
    name: 'Monad Token',
    symbol: 'MON',
    decimals: 18,
    icon: '/asset-icon/MON.png',
  },
  {
    address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    icon: '/asset-icon/USDC.webp',
  },
  {
    address: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
    name: 'Wrapped Monad Token',
    symbol: 'WMON',
    decimals: 18,
    icon: '/asset-icon/wmonad.svg',
  },
]
