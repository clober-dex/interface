import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import '../../../styles/globals.css'
import { zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'

import { MintFuturesAssetForm } from './mint-futures-asset-form'

export default {
  title: 'Form/MintFuturesAssetForm',
  component: MintFuturesAssetForm,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="text-white">
      <MintFuturesAssetForm {...args} />
    </div>
  ),
} as Meta<typeof MintFuturesAssetForm>

type Story = StoryObj<typeof MintFuturesAssetForm>
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
      settlePrice: 315234,
    },
    maxBorrowAmount: 100000000000n,
    borrowLTV: 12,
    collateralValue: '1.2',
    setCollateralValue: () => {},
    borrowValue: '1.2',
    setBorrowValue: () => {},
    balances: {
      [zeroAddress]: 1000000000000000000n,
      '0x43D614B1bA4bA469fAEAa4557AEAFdec039b8795': 100000000n,
    },
    prices: {
      [zeroAddress]: 210,
      '0x43D614B1bA4bA469fAEAa4557AEAFdec039b8795': 1.0001,
    },
    liquidationPrice: 25400,
    actionButtonProps: {
      disabled: false,
      onClick: () => {},
      text: 'Borrow',
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
