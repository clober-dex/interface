import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'
import { zeroAddress } from 'viem'

import { TokenPullModal } from './token-pull-modal'

export default {
  title: 'Modal/TokenPullModal',
  component: TokenPullModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => <TokenPullModal {...args} />,
} as Meta<typeof TokenPullModal>

type Story = StoryObj<typeof TokenPullModal>

export const Default: Story = {
  args: {
    chain: mainnet,
    explorerUrl: '',
    currencies: [
      {
        address: '0x0000000000000000000000000000000000000001',
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      {
        address: '0x0000000000000000000000000000000000000002',
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
      },
    ],
    selectedCurrency: {
      address: '0x0000000000000000000000000000000000000001',
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    setSelectedCurrency: () => {},
    setCurrencies: () => {},
    balances: {
      '0x0000000000000000000000000000000000000001': 100000000000000n,
      '0x0000000000000000000000000000000000000002': 2000000n,
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
      '0x0000000000000000000000000000000000000001': 3000.1,
      '0x0000000000000000000000000000000000000002': 0.999,
    },
    onBack: () => {},
    onClose: () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
