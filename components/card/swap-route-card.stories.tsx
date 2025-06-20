import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'

import { SwapRouteCard } from './swap-router-card'

export default {
  title: 'Common/SwapRouteCard',
  component: SwapRouteCard,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex w-[359px] sm:w-[740px]">
      <SwapRouteCard {...args} />
    </div>
  ),
} as Meta<typeof SwapRouteCard>

type Story = StoryObj<typeof SwapRouteCard>
export const Default: Story = {
  args: {
    quote: {
      timestamp: 1,
      amountIn: 1020000000000000000n,
      amountOut: 1000000000n,
      gasLimit: 2100000n,
      aggregator: { name: 'Uniswap' } as any,
      transaction: undefined,
      netAmountOutUsd: 10000,
      gasUsd: 0.2,
      executionMilliseconds: 1500,
    },
    isBestQuote: false,
    priceDifference: -1.2,
    outputCurrency: {
      address: '0x0000000000000000000000000000000000000003',
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
    aggregatorName: 'Clober',
  },
}

export const Best: Story = {
  args: {
    quote: {
      timestamp: 2,
      amountIn: 1020000000000000000n,
      amountOut: 1000000000n,
      gasLimit: 2100000n,
      aggregator: { name: 'Uniswap' } as any,
      transaction: undefined,
      netAmountOutUsd: 10000,
      gasUsd: 0.2,
      executionMilliseconds: 1500,
    },
    isBestQuote: true,
    priceDifference: 0,
    outputCurrency: {
      address: '0x0000000000000000000000000000000000000003',
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
    aggregatorName: 'Clober',
  },
}

export const Null: Story = {
  args: {
    quote: undefined,
    isBestQuote: false,
    priceDifference: 0,
    outputCurrency: {
      address: '0x0000000000000000000000000000000000000003',
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
    aggregatorName: 'Uniswap',
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
