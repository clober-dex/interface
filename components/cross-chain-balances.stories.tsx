import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import '../styles/globals.css'
import { zeroAddress } from 'viem'

import CrossChainBalances from './cross-chain-balances'

export default {
  title: 'Common/CrossChainBalances',
  component: CrossChainBalances,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex flex-col w-[100vw] min-h-[100vh] bg-gray-950">
      <CrossChainBalances {...args} />
    </div>
  ),
} as Meta<typeof CrossChainBalances>

type Story = StoryObj<typeof CrossChainBalances>

export const Default: Story = {
  args: {
    currency: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: zeroAddress,
    },
    balance: 10000000n,
    remoteChainBalances: {
      [zeroAddress]: {
        total: 5000000n,
        key: 'usdc',
        breakdown: [
          {
            chain: { id: 1, name: 'Ethereum', logo: '' },
            balance: 2000000n,
          },
          { chain: { id: 56, name: 'BSC', logo: '' }, balance: 3000000n },
        ],
      },
    },
    price: 1.0,
  },
}
