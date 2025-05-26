import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { zeroAddress } from 'viem'

import { FuturesPositionAdjustModal } from './futures-position-adjust-modal'

export default {
  title: 'Modal/FuturesPositionAdjustModal',
  component: FuturesPositionAdjustModal,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof FuturesPositionAdjustModal>

type Story = StoryObj<typeof FuturesPositionAdjustModal>

export const Default: Story = {
  args: {
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
    onClose: () => {},
    ltv: 10,
    newLTV: 20,
    setNewLTV: () => {},
    currentCollateralAmount: 100000000n,
    expectedCollateralAmount: 200000000n,
    currentDebtAmount: 10000000000000000000n,
    expectedDebtAmount: 20000000000000000000n,
    loanAssetPrice: 145.12,
    collateralPrice: 1.0001,
    actionButtonProps: {
      disabled: false,
      onClick: () => {},
      text: 'Edit Multiple',
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
