import React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import '../styles/globals.css'

import SpotOrderBook from './spot-order-book'
export default {
  title: 'Common/SpotOrderBook',
  component: SpotOrderBook,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="w-[740px] h-[570px]">
      <SpotOrderBook {...args} />
    </div>
  ),
} as Meta<typeof SpotOrderBook>

type Story = StoryObj<typeof SpotOrderBook>

export const Default: Story = {
  args: {
    // @ts-ignore
    market: {},
    bids: [
      { price: '0.000001', size: '12' },
      { price: '0.000002', size: '12' },
      { price: '0.000003', size: '12' },
      { price: '0.000004', size: '12' },
      { price: '0.000005', size: '1' },
    ],
    asks: [
      { price: '0.000006', size: '12' },
      { price: '0.000007', size: '12' },
      { price: '0.000008', size: '12' },
      { price: '0.000009', size: '12' },
      { price: '0.000010', size: '1' },
    ],
    availableDecimalPlacesGroups: [
      { label: '0.000001', value: 6 },
      { label: '0.00001', value: 5 },
      { label: '0.0001', value: 4 },
      { label: '0.001', value: 3 },
    ],
    selectedDecimalPlaces: { label: '0.00001', value: 5 },
    setSelectedDecimalPlaces: () => {},
    setDepthClickedIndex: () => {},
    setTab: () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
