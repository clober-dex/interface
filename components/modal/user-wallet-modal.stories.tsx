import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { currentTimestampInSeconds } from '../../utils/date'

import { UserWalletModal } from './user-wallet-modal'

export default {
  title: 'Modal/UserWalletModal',
  component: UserWalletModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => <UserWalletModal {...args} />,
} as Meta<typeof UserWalletModal>

type Story = StoryObj<typeof UserWalletModal>

const now = currentTimestampInSeconds() - 1000000

export const Default: Story = {
  args: {
    chain: mainnet,
    userAddress: '0xf4649Ecd9fcbd87b5D39dEf47786e1CE904d41fD',
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
    setCurrencies: () => {},
    balances: {
      '0x0000000000000000000000000000000000000001': 100000000000000n,
      '0x0000000000000000000000000000000000000002': 2000000n,
    },
    prices: {
      '0x0000000000000000000000000000000000000001': 3000.1,
      '0x0000000000000000000000000000000000000002': 0.999,
    },
    transactionHistory: [
      {
        title: 'Confirm',
        txHash: `0x${BigInt(1234567890).toString(16)}`,
        chain: mainnet,
        type: 'approve',
        success: true,
        blockNumber: 123456,
        timestamp: now,
        fields: [
          {
            direction: 'in',
            currency: {
              address: '0x0000000000000000000000000000000000000003',
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            label: 'ETH ASDFASDF',
            primaryText: '0.000000000000012',
          },
          {
            direction: 'out',
            currency: {
              address: '0x0000000000000000000000000000000000000003',
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            label: 'ETH',
            primaryText: '0.0004',
          },
          {
            direction: 'out',
            currency: {
              address: '0x0000000000000000000000000000000000000003',
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            label: 'ETH',
            primaryText: '2.001',
          },
        ],
      },
      {
        title: 'Confirm',
        txHash: `0x${BigInt(1234567890).toString(16)}`,
        chain: mainnet,
        type: 'approve',
        success: true,
        blockNumber: 123456,
        timestamp: now + 10000,
        fields: [
          {
            direction: 'in',
            currency: {
              address: '0x0000000000000000000000000000000000000003',
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            label: 'ETH ASDFASDF',
            primaryText: '0.000000000000012',
          },
          {
            direction: 'out',
            currency: {
              address: '0x0000000000000000000000000000000000000003',
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            label: 'ETH',
            primaryText: '0.0004',
          },
          {
            direction: 'out',
            currency: {
              address: '0x0000000000000000000000000000000000000003',
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            label: 'ETH',
            primaryText: '2.001',
          },
        ],
      },
    ],
    walletIconUrl: 'https://web3auth.io/images/w3a-L-Favicon-1.svg',
    ens: null,
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
