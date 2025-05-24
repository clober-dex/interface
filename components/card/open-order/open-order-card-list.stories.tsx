import React from 'react'
import '../../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { zeroAddress } from 'viem'
import { OpenOrder } from '@clober/v2-sdk'

import { dummyCurrencies } from '../../../.storybook/dummy-data/currencies'

import { OpenOrderCardList } from './open-order-card-list'

export default {
  title: 'Card/OpenOrderCardList',
  component: OpenOrderCardList,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex flex-col w-[448px] h-[154px] gap-2">
      <OpenOrderCardList {...args} />
    </div>
  ),
} as Meta<typeof OpenOrderCardList>

type Story = StoryObj<typeof OpenOrderCardList>

const bidOpenOrder = {
  id: '1',
  isBid: true,
  tick: 1,
  orderIndex: '1',
  user: zeroAddress,
  inputCurrency: dummyCurrencies[0],
  outputCurrency: dummyCurrencies[1],
  txHash: '0x6d91975935196522e7da9911412a1c2c2e509b13f19f215f7aaef820f7125734',
  createdAt: 1630000000000,
  price: '1600',
  amount: {
    value: '10000000',
    currency: dummyCurrencies[0],
  },
  filled: {
    value: '9000000',
    currency: dummyCurrencies[0],
  },
  claimed: {
    value: '1000000',
    currency: dummyCurrencies[0],
  },
  claimable: {
    value: '100',
    currency: dummyCurrencies[0],
  },
  cancelable: {
    value: '1000000',
    currency: dummyCurrencies[0],
  },
}

export const Bid: Story = {
  args: {
    userAddress: zeroAddress,
    openOrders: [bidOpenOrder, bidOpenOrder] as OpenOrder[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    claims: async (_) => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cancels: async (_) => {},
  },
}

const askOpenOrder = {
  id: '1',
  isBid: false,
  tick: 1,
  orderIndex: '1',
  user: zeroAddress,
  inputCurrency: dummyCurrencies[1],
  outputCurrency: dummyCurrencies[0],
  txHash: '0x6d91975935196522e7da9911412a1c2c2e509b13f19f215f7aaef820f7125734',
  createdAt: 1630000000000,
  price: '1600',
  amount: {
    value: '10000000',
    currency: dummyCurrencies[0],
  },
  filled: {
    value: '9000000',
    currency: dummyCurrencies[0],
  },
  claimed: {
    value: '1000000',
    currency: dummyCurrencies[0],
  },
  claimable: {
    value: '100',
    currency: dummyCurrencies[0],
  },
  cancelable: {
    value: '1000000',
    currency: dummyCurrencies[0],
  },
}

export const Ask: Story = {
  args: {
    userAddress: zeroAddress,
    openOrders: [askOpenOrder, askOpenOrder] as OpenOrder[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    claims: async (_) => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cancels: async (_) => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
