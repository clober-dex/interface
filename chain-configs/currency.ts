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
    address: '0x0Cd2C356be90864F4a5e0551E79dd039b246FaCA',
    name: 'GiwaDex USD',
    symbol: 'USDG',
    decimals: 6,
    icon: '/asset-icon/USD.svg',
  },
  {
    address: '0xD031A3C56eD35EFE5F7e5269B088F8C3a2c9d463',
    name: 'GiwaDex KRW',
    symbol: 'KRWG',
    decimals: 6,
    icon: '/asset-icon/KRW.svg',
  },
]
