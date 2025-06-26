import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { LpUnwrapModal } from './lp-unwrap-modal'

export default {
  title: 'Modal/LpUnwrapModal',
  component: LpUnwrapModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => <LpUnwrapModal {...args} />,
} as Meta<typeof LpUnwrapModal>

type Story = StoryObj<typeof LpUnwrapModal>

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
    onUnwrap: async () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
