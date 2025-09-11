import React from 'react'
import '../../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'

import { PoolInfoCard } from './pool-info-card'

export default {
  title: 'Card/PoolInfoCard',
  component: PoolInfoCard,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex w-[740px]">
      <PoolInfoCard {...args} />
    </div>
  ),
} as Meta<typeof PoolInfoCard>

type Story = StoryObj<typeof PoolInfoCard>

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
    lpPriceUSD: 100000,
    apy: 12.34,
    lpTotalSupply: 200000,
    liquidityUsd: 300000,
    dailyVolume: 400000,
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
