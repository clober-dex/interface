import React from 'react'
import '../../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { LpPositionCard } from './lp-position-card'

export default {
  title: 'Card/LpPositionCard',
  component: LpPositionCard,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex w-[500px]">
      <LpPositionCard {...args} />
    </div>
  ),
} as Meta<typeof LpPositionCard>

type Story = StoryObj<typeof LpPositionCard>

export const Default: Story = {
  args: {
    chain: mainnet,
    poolSnapshot: {
      any: 0,
      chainId: 1,
      key: '0x',
      currencyA: {
        address: '0x0000000000000000000000000000000000000002',
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      currencyB: {
        address: '0x0000000000000000000000000000000000000003',
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
      },
      lpPriceUSD: 123.123,
      lpCurrency: {
        address: '0x0000000000000000000000000000000000000003',
        name: 'ETH-USDC-LP',
        symbol: 'ETH-USDC-LP',
        decimals: 18,
      },
    } as any,
    isERC20: false,
    amount: 123456789012345678n,
    onWrap: async () => {},
    onUnwrap: async () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
