import React from 'react'
import '../../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'

import { FuturesRedeemCard } from './futures-redeem-card'

export default {
  title: 'Card/FuturesRedeemCard',
  component: FuturesRedeemCard,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="text-white">
      <FuturesRedeemCard {...args} />
    </div>
  ),
} as Meta<typeof FuturesRedeemCard>

type Story = StoryObj<typeof FuturesRedeemCard>

export const Default: Story = {
  args: {
    chain: mainnet,
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
      settlePrice: 254000,
    },
    prices: {
      [zeroAddress]: 240.1,
      ['0x43D614B1bA4bA469fAEAa4557AEAFdec039b8795']: 1.0001,
    },
    balance: 100000000000000000000n,
    redeemableCollateral: 10000000n,
    actionButtonProps: {
      onClick: () => {},
      disabled: false,
      text: 'Redeem',
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
