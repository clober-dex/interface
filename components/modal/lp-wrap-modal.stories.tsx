import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { LpWrapModal } from './lp-wrap-modal'

export default {
  title: 'Modal/LpWrapModal',
  component: LpWrapModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => <LpWrapModal {...args} />,
} as Meta<typeof LpWrapModal>

type Story = StoryObj<typeof LpWrapModal>

export const Default: Story = {
  args: {
    chain: mainnet,
    lpBalance: 1100000000000000000n,
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
    onClose: () => {},
    onWrap: async () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
