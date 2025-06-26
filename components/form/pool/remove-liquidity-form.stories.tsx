import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import '../../../styles/globals.css'
import { mainnet } from 'viem/chains'

import { RemoveLiquidityForm } from './remove-liquidity-form'

export default {
  title: 'Form/RemoveLiquidityForm',
  component: RemoveLiquidityForm,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex flex-col rounded-2xl bg-gray-900 p-6 gap-6 md:gap-8 w-full sm:w-[480px] h-full">
      <RemoveLiquidityForm {...args} />
    </div>
  ),
} as Meta<typeof RemoveLiquidityForm>

type Story = StoryObj<typeof RemoveLiquidityForm>

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
    prices: {
      '0x0000000000000000000000000000000000000001': 50000,
      '0x0000000000000000000000000000000000000002': 50000,
      '0x0000000000000000000000000000000000000003': 0.99999,
    },
    lpCurrencyAmount: '1',
    setLpCurrencyAmount: () => {},
    availableLpCurrencyBalance: 1000999999999999900n,
    receiveCurrencies: [
      {
        currency: {
          address: '0x0000000000000000000000000000000000000002',
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        amount: 500499999999999950n,
      },
      {
        currency: {
          address: '0x0000000000000000000000000000000000000002',
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        amount: 500499999999999950n,
      },
    ],
    slippageInput: '0.5',
    setSlippageInput: () => {},
    actionButtonProps: {
      disabled: false,
      onClick: () => {},
      text: 'Remove Liquidity',
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
