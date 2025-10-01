import { MarketSnapshot } from '@clober/v2-sdk'
import { zeroAddress } from 'viem'

export const dummyMarkets = [
  {
    chainId: 1,
    marketId: '1',
    base: {
      symbol: 'BTC',
      name: 'BTC',
      address: zeroAddress,
      decimals: 18,
    },
    quote: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: zeroAddress,
      decimals: 18,
    },
    price: 100000,
    priceUSD: 123.12,
    volume24hUSD: 100000,
    totalValueLockedUSD: 1000000,
    priceChange24h: 0.2,
    createdAtTimestamp: 1744005461,
    bidBookUpdatedAt: 1744005461,
    askBookUpdatedAt: 1744005461,
    fdv: 1000000000,
  },
  {
    chainId: 1,
    marketId: '2',
    base: {
      symbol: 'ETH',
      name: 'ETH',
      address: zeroAddress,
      decimals: 18,
    },
    quote: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: zeroAddress,
      decimals: 18,
    },
    price: 100000,
    priceUSD: 123.12,
    volume24hUSD: 100000,
    totalValueLockedUSD: 1000000,
    priceChange24h: 0.2,
    createdAtTimestamp: 1744005461,
    bidBookUpdatedAt: 1744005461,
    askBookUpdatedAt: 1744005461,
    fdv: 1000000000,
  },
] as MarketSnapshot[]