import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { dummyMarkets } from '../../.storybook/dummy-data/markets'

import MarketSelect from './market-select'

export default {
  title: 'Selector/MarketSelector',
  component: MarketSelect,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="w-full sm:w-[480px]">
      <MarketSelect {...args} />
    </div>
  ),
} as Meta<typeof MarketSelect>

type Story = StoryObj<typeof MarketSelect>
export const Default: Story = {
  args: {
    chain: mainnet,
    markets: dummyMarkets,
    onMarketSelect: () => {},
  },
}

export const Empty: Story = {
  args: {
    chain: mainnet,
    markets: [],
    onMarketSelect: () => {},
  },
}
