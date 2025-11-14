import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { TokenTransferModal } from './token-transfer-modal'

export default {
  title: 'Modal/TokenTransferModal',
  component: TokenTransferModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => <TokenTransferModal {...args} />,
} as Meta<typeof TokenTransferModal>

type Story = StoryObj<typeof TokenTransferModal>

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
