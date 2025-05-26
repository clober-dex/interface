import React from 'react'
import '../../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'

import { FuturesPositionCard } from './futures-position-card'

export default {
  title: 'Card/FuturesAssetShortPositionCard',
  component: FuturesPositionCard,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="w-96 text-white">
      <FuturesPositionCard {...args} />
    </div>
  ),
} as Meta<typeof FuturesPositionCard>

type Story = StoryObj<typeof FuturesPositionCard>

export const Default: Story = {
  args: {
    chain: mainnet,
    position: {
      user: zeroAddress,
      asset: {
        id: '0x',
        currency: {
          address: zeroAddress,
          decimals: 18,
          name: 'AAPL',
          symbol: 'AAPL',
          icon: 'https://www.pyth.network/_next/image?url=%2Ficons%2Fprice-feed-icons%2Flight%2Fequity-us-aapl-usd.inline.svg&w=1920&q=75',
          priceFeedId: '0x',
        },
        collateral: {
          address: '0x43D614B1bA4bA469fAEAa4557AEAFdec039b8795',
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          priceFeedId: '0x',
        },
        expiration: 1635724800,
        maxLTV: 700000n,
        liquidationThreshold: 800000n,
        ltvPrecision: 1000000n,
        minDebt: 10000000n,
        settlePrice: 31441,
      },
      averagePrice: 123.12,
      collateralAmount: 100000000n,
      debtAmount: 10000000000000000000n,
      liquidationPrice: 123.12,
      ltv: 10,
    },
    loanAssetPrice: 145.12,
    isPending: false,
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
