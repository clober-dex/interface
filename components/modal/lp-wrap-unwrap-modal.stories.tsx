import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { Currency, LpCurrency } from '../../model/currency'

import { LpWrapUnwrapModal } from './lp-wrap-unwrap-modal'

export default {
  title: 'Modal/LpWrapUnwrapModal',
  component: LpWrapUnwrapModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => <LpWrapUnwrapModal {...args} />,
} as Meta<typeof LpWrapUnwrapModal>

type Story = StoryObj<typeof LpWrapUnwrapModal>

export const Default: Story = {
  args: {
    chain: mainnet,
    lpCurrency: {
      currencyA: {
        address: '0x0000000000000000000000000000000000000001',
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      } as Currency,
      currencyB: {
        address: '0x0000000000000000000000000000000000000002',
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
      } as Currency,
    } as LpCurrency,
    lpBalance: BigInt(1000000000000000000),
    lpPrice: 2000,
    wrappedCurrency: {
      address: '0x0000000000000000000000000000000000000002',
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
    wrappedBalance: BigInt(5000000),
    onClose: () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
