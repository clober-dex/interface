import { getAddress } from 'viem'

import { Currency } from '../model/currency'

export const WHITELISTED_POOL_KEYS: `0x${string}`[] = [
  '0xad46920833ad7a1ba8e74cc241faf9ae4fd3dc4616ad9648b13160f8453e444f', // MON-USDC
  '0xf3c347e880b6a775f4f69f6db22860636351a70f18857fab2c56dc32835a1627', // muBOND-USDC
  '0xebadcf03683413b3fc72a0d16a0a02902db04ee7a3b439de5033e825c1d79380', // aprMON-MON
  '0x2b4a8f6c598547dede3868e214f4f1e972deff1508ad7667d7556264662a5796', // HIVE-USDC
  '0xb93510cb90a836b00a33a7452fde41230b3a53fbb804e64737c7cd7533ea14f8', // gMON-MON
  '0x5913968b69d49b992c13c017d99f982eaa0764b6f6c8d6709e6061f7cdbe1d8c', // sMON-MON
  '0xd1e33fe9673f7b2957cf31bea350b7f99795ee9cfea2392e9a92be6ba32e9a32', // shMON-MON
  // futures
  '0xd2853e69b50a0e58bfcc62e54e5e206a2e994e7671ff606829dc0d33b783dd19', // US30Y
  '0x058038cd3b5d6ceedf3ee5f81d42338fd8a26831130abcabd1077b473cdd5650', // EUR
  '0x3a9ef5c24df6829cba45c34c8f59fafaf525dbba114f5d1f2cd0d48763315721', // S&P500
  '0x045ea7b6fb91e7bf32ca5d8bc34325a2fd70e33b6174229c05ab209221195f15', // XAU
  '0xf4c7b58425fdcdc201391c1ef4b7042b05586da10c5b59497cb5805f7ee3106e', // ETHBTC
  '0x8889f39dd8e24149e60682eec0b1e2b4185f2530d8f6b8b974018c225b9d1682', // BTC
  '0xd16f03f88b950ba9dbd0de0d71ed998a48db96fcca8ffb3e0a262ad098c8999b', // USOIL
]

export const WHITELISTED_WRAPPED_LP_CURRENCIES: Currency[] = [
  {
    address: getAddress('0xcaCc9c1efD10Ce2Fd5a80306e4afB4892F012B9E'),
    name: 'Wrapped USDC-MON LP Token',
    symbol: 'wUSDC-MON',
    decimals: 18,
  },
  {
    address: getAddress('0xf99e8ACF8740185407a67E09b51e6e574aCE3F6c'),
    name: 'Wrapped USDC-muBOND LP Token',
    symbol: 'wUSDC-muBOND',
    decimals: 18,
  },
  {
    address: getAddress('0x2e9fc807bBd818CA03947ce5327A27622112340A'),
    name: 'Wrapped MON-aprMON LP Token',
    symbol: 'wMON-aprMON',
    decimals: 18,
  },
  {
    address: getAddress('0xbbf6e450f631C327746284a317bc81A4Bc2134cf'),
    name: 'Wrapped USDC-HIVE LP Token',
    symbol: 'wUSDC-HIVE',
    decimals: 18,
  },
  {
    address: getAddress('0xE5Eef813563DFBCc3CaBc979d889f6E08D1Bc6c9'),
    name: 'Wrapped MON-gMON LP Token',
    symbol: 'wMON-gMON',
    decimals: 18,
  },
  {
    address: getAddress('0x65783be7E6658d9c7c8Fe2aAD252BCB9A298Ecff'),
    name: 'Wrapped MON-sMON LP Token',
    symbol: 'wMON-sMON',
    decimals: 18,
  },
  {
    address: getAddress('0x059a5c00045eEf9AaA50ED7661224a8828858cd8'),
    name: 'Wrapped MON-shMON LP Token',
    symbol: 'wMON-shMON',
    decimals: 18,
  },
  // futures
  {
    address: getAddress('0x928a975C307F856Ef5b5B03b0Fe1666fbE919551'),
    name: 'Wrapped USDC-US30Y-30x-250901 LP Token',
    symbol: 'wUSDC-US30Y-30x-250901',
    decimals: 18,
  },
  {
    address: getAddress('0x73bA02601a268f2cbDe46D4451A8b377BB891Bc9'),
    name: 'Wrapped USDC-EUR-20x-250901 LP Token',
    symbol: 'wUSDC-EUR-20x-250901',
    decimals: 18,
  },
  {
    address: getAddress('0xB9d3799F5Ce8a73385bA94fAaD3E253a132311b6'),
    name: 'Wrapped USDC-S&P500-10x-250901 LP Token',
    symbol: 'wUSDC-S&P500-10x-250901',
    decimals: 18,
  },
  {
    address: getAddress('0x2097e7D7c0f7e100af103248FCB89383C183eC7F'),
    name: 'Wrapped USDC-XAU-10x-250901 LP Token',
    symbol: 'wUSDC-XAU-10x-250901',
    decimals: 18,
  },
  {
    address: getAddress('0xE5E6f505654f8B2342B0732Eb71A1ED4fFe1cbBb'),
    name: 'Wrapped USDC-ETHBTC-5x-250901 LP Token',
    symbol: 'wUSDC-ETHBTC-5x-250901',
    decimals: 18,
  },
  {
    address: getAddress('0xAEA825CA224796006C44Fd2291C53275E55B9EE9'),
    name: 'Wrapped USDC-BTC-3x-250901 LP Token',
    symbol: 'wUSDC-BTC-3x-250901',
    decimals: 18,
  },
  {
    address: getAddress('0x7A3142ab51947e985F7A98e4804980f7dB2278ce'),
    name: 'Wrapped USDC-USOIL-5x-250901 LP Token',
    symbol: 'wUSDC-USOIL-5x-250901',
    decimals: 18,
  },
]
