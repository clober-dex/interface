import React from 'react'
import '../../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'

import { MarketDailySnapshotCard } from './market-daily-snapshot-card'

export default {
  title: 'Card/MarketDailySnapshotCard',
  component: MarketDailySnapshotCard,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex w-[338px] lg:w-full">
      <MarketDailySnapshotCard {...args} />
    </div>
  ),
} as Meta<typeof MarketDailySnapshotCard>

type Story = StoryObj<typeof MarketDailySnapshotCard>

export const Default: Story = {
  args: {
    chain: mainnet,
    baseCurrency: {
      symbol: 'BTC',
      name: 'BTC',
      address: zeroAddress,
      decimals: 18,
    },
    quoteCurrency: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: zeroAddress,
      decimals: 18,
    },
    createAt: 1744005461,
    price: 100000,
    marketCap: 100000,
    dailyVolume: 100000,
    dailyChange: 0.2,
    verified: true,
    isBidTaken: false,
    isAskTaken: false,
  },
}

export const Minus: Story = {
  args: {
    chain: mainnet,
    baseCurrency: {
      symbol: 'BTC',
      name: 'BTC',
      address: zeroAddress,
      decimals: 18,
    },
    quoteCurrency: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: zeroAddress,
      decimals: 18,
    },
    createAt: 1744005461,
    price: 100000,
    marketCap: 100000,
    dailyVolume: 100000,
    dailyChange: -0.2,
    verified: true,
    isBidTaken: false,
    isAskTaken: false,
  },
}

export const NotVerified: Story = {
  args: {
    chain: mainnet,
    baseCurrency: {
      symbol: 'BTC',
      name: 'BTC',
      address: zeroAddress,
      decimals: 18,
    },
    quoteCurrency: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: zeroAddress,
      decimals: 18,
    },
    createAt: 1744005461,
    price: 100000,
    marketCap: 100000,
    dailyVolume: 100000,
    dailyChange: 0.2,
    verified: false,
    isBidTaken: false,
    isAskTaken: false,
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
