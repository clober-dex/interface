import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import '../../styles/globals.css'
import { monad } from 'viem/chains'

import { LpCurrencyIcon } from './lp-currency-icon'

export default {
  title: 'Icon/LpCurrencyIcon',
  component: LpCurrencyIcon,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'light' },
  },
  render: ({ ...args }) => (
    <div className="w-[400px] h-[400px] relative z-10 bg-transparent">
      <LpCurrencyIcon {...args} className="w-full h-full shrink-0 relative" />
    </div>
  ),
} as Meta<typeof LpCurrencyIcon>

type Story = StoryObj<typeof LpCurrencyIcon>

export const Default: Story = {
  args: {
    chain: monad,
    currencyA: {
      address: '0x0000000000000000000000000000000000000001',
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
      icon: 'https://raw.githubusercontent.com/monad-crypto/token-list/refs/heads/main/mainnet/USDC/logo.svg',
    },
    currencyB: {
      address: '0x0000000000000000000000000000000000000000',
      name: 'MON',
      symbol: 'MON',
      decimals: 18,
      icon: 'https://raw.githubusercontent.com/monad-crypto/token-list/refs/heads/main/mainnet/WETH/logo.svg',
    },
  },
}

export const ETH_USDC_LP: Story = {
  args: {
    chain: monad,
    currencyA: {
      address: '0x0000000000000000000000000000000000000001',
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
      icon: 'https://raw.githubusercontent.com/monad-crypto/token-list/refs/heads/main/mainnet/USDC/logo.svg',
    },
    currencyB: {
      address: '0x0000000000000000000000000000000000000002',
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
      icon: 'https://raw.githubusercontent.com/monad-crypto/token-list/refs/heads/main/mainnet/WETH/logo.svg',
    },
  },
}
