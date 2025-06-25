import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

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
    pool: {
      chainId: 1,
      key: '0x',
      liquidityA: {
        total: {
          currency: {
            address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
          },
          value: '74472.065381',
        },
        reserve: {
          currency: {
            address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
          },
          value: '20852.178307',
        },
        cancelable: {
          currency: {
            address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
          },
          value: '53619.887074',
        },
        claimable: {
          currency: {
            address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
          },
          value: '0',
        },
      },
      liquidityB: {
        total: {
          currency: {
            address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
          },
          value: '74472.065381',
        },
        reserve: {
          currency: {
            address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
          },
          value: '20852.178307',
        },
        cancelable: {
          currency: {
            address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
          },
          value: '53619.887074',
        },
        claimable: {
          currency: {
            address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
          },
          value: '0',
        },
      },
      lpPriceUSD: 12344.3241,
      lpCurrency: {
        id: '0x',
        address: '0x0000000000000000000000000000000000000001',
        name: 'ETH-USDC-LP',
        symbol: 'ETH-USDC-LP',
        decimals: 18,
      },
      wrappedLpCurrency: {
        address: '0x0000000000000000000000000000000000000003',
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
      },
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
      apy: 120.5434,
      tvl: 43123123.0123455,
      // @ts-ignore
      market: {},
    },
    lpBalance: 1100000000000000000n,
    lpPrice: 2000,
    wrappedBalance: 2000000000000000000n,
    onClose: () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
