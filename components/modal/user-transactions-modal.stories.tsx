import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { currentTimestampInSeconds } from '../../utils/date'

import { UserTransactionsModal } from './user-transactions-modal'

export default {
  title: 'Modal/UserTransactionsModal',
  component: UserTransactionsModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => <UserTransactionsModal {...args} />,
} as Meta<typeof UserTransactionsModal>

type Story = StoryObj<typeof UserTransactionsModal>

const now = currentTimestampInSeconds() - 1000000

export const Default: Story = {
  args: {
    chain: mainnet,
    userAddress: '0xf4649Ecd9fcbd87b5D39dEf47786e1CE904d41fD',
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
            value: '0.000000000000012',
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
            value: '0.0004',
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
            value: '2.001',
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
            value: '0.000000000000012',
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
            value: '0.0004',
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
            value: '2.001',
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
