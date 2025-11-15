import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import '../../styles/globals.css'
import { zeroAddress } from 'viem'

import BalanceSourcesModal from './balance-sources-modal'

export default {
  title: 'Modal/BalanceSourcesModal',
  component: BalanceSourcesModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="w-full flex">
      <BalanceSourcesModal {...args} />
    </div>
  ),
} as Meta<typeof BalanceSourcesModal>

type Story = StoryObj<typeof BalanceSourcesModal>

export const Default: Story = {
  args: {
    currency: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: zeroAddress,
    },
    balances: {
      [zeroAddress]: 10000000n,
    },
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
    prices: {
      [zeroAddress]: 1.0,
    },
    onClose: () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
