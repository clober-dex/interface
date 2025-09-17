import { zeroAddress } from 'viem'

import { Currency } from '../model/currency'

export const WHITELISTED_CURRENCIES: Currency[] = [
  {
    address: zeroAddress,
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    icon: '/asset-icon/ETH.webp',
  },
  {
    address: '0x4200000000000000000000000000000000000006',
    name: 'Wrapped ETH',
    symbol: 'WETH',
    decimals: 18,
    icon: '/asset-icon/weth.jpg',
  },
  {
    address: '0x5C91A02B8B5D10597fc6cA23faF56F9718D1feD0',
    name: 'GiwaDex USD',
    symbol: 'GUSD',
    decimals: 6,
    icon: '/asset-icon/USDC.webp',
  },
]
