import React from 'react'
import '../../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { LpPositionCard } from './lp-position-card'

export default {
  title: 'Card/LpPositionCard',
  component: LpPositionCard,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex w-[300px]">
      <LpPositionCard {...args} />
    </div>
  ),
} as Meta<typeof LpPositionCard>

type Story = StoryObj<typeof LpPositionCard>

export const Default: Story = {
  args: {
    chain: mainnet,
    poolKey: '0x',
    currencyA: {
      address: '0x0000000000000000000000000000000000000003',
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    currencyB: {
      address: '0x0000000000000000000000000000000000000003',
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
    lpCurrency: {
      address: '0x0000000000000000000000000000000000000003',
      name: 'ETH-USDC-LP',
      symbol: 'ETH-USDC-LP',
      decimals: 18,
    },
    lpPriceUSD: 123.123,
    amount: 123456789012345678n,
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
