import { defineChain } from 'viem'

export const monad = /*#__PURE__*/ defineChain({
  id: 143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad Token',
    symbol: 'MON',
  },
  rpcUrls: {
    // TODO: Update RPC URL when available
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL!],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockvision',
      url: 'https://mainnet-beta.monvision.io',
    },
  },
  testnet: true,
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 9248132,
    },
  },
})
