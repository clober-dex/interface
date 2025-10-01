import React from 'react'
import '../../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'

import { MarketInfoCard } from './market-info-card'

export default {
  title: 'Card/MarketInfoCard',
  component: MarketInfoCard,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex w-[740px]">
      <MarketInfoCard {...args} />
    </div>
  ),
} as Meta<typeof MarketInfoCard>

type Story = StoryObj<typeof MarketInfoCard>

export const Default: Story = {
  args: {
    chain: mainnet,
    baseCurrency: {
      symbol: 'Bitcoin',
      name: 'Bitcoin',
      address: zeroAddress,
      decimals: 18,
    },
    quoteCurrency: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: zeroAddress,
      decimals: 18,
    },
    dollarValue: 100000,
    price: 100000,
    fdv: 100000,
    marketCap: 100000,
    liquidityUsd: 100000,
    dailyVolume: 100000,
    websiteUrl: '',
    twitterUrl: '',
    telegramUrl: '',
    isFetchingMarketSnapshot: false,
    setShowMarketSelect: (market: any) => {
      console.log('Selected market:', market)
    },
  },
}

export const Social: Story = {
  args: {
    chain: mainnet,
    baseCurrency: {
      symbol: 'Bitcoin',
      name: 'Bitcoin',
      address: zeroAddress,
      decimals: 18,
    },
    quoteCurrency: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: zeroAddress,
      decimals: 18,
    },
    dollarValue: 100000,
    price: 100000,
    fdv: 100000,
    marketCap: 100000,
    liquidityUsd: 100000,
    dailyVolume: 100000,
    websiteUrl: 'https://www.google.com',
    twitterUrl: 'https://www.google.com',
    telegramUrl: 'https://www.google.com',
    isFetchingMarketSnapshot: false,
    setShowMarketSelect: (market: any) => {
      console.log('Selected market:', market)
    },
  },
}

export const Loading: Story = {
  args: {
    chain: mainnet,
    baseCurrency: {
      symbol: 'Bitcoin',
      name: 'Bitcoin',
      address: zeroAddress,
      decimals: 18,
    },
    quoteCurrency: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: zeroAddress,
      decimals: 18,
    },
    dollarValue: 0,
    price: 0,
    fdv: 0,
    marketCap: 0,
    liquidityUsd: 0,
    dailyVolume: 0,
    websiteUrl: '',
    twitterUrl: '',
    telegramUrl: '',
    isFetchingMarketSnapshot: true,
    setShowMarketSelect: (market: any) => {
      console.log('Selected market:', market)
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
