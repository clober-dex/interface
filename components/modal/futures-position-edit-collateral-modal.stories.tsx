import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'

import { FuturesPositionEditCollateralModal } from './futures-position-edit-collateral-modal'

export default {
  title: 'Modal/FuturesPositionEditCollateralModal',
  component: FuturesPositionEditCollateralModal,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof FuturesPositionEditCollateralModal>

type Story = StoryObj<typeof FuturesPositionEditCollateralModal>

export const Deposit: Story = {
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
      settlePrice: 31441,
    },
    onClose: () => {},
    value: '1.2',
    setValue: () => {},
    isWithdrawCollateral: false,
    setIsWithdrawCollateral: () => {},
    availableCollateralAmount: 100000000n,
    ltv: 10,
    newLTV: 20,
    collateralPrice: 1.0001,
    actionButtonProps: {
      disabled: false,
      onClick: () => {},
      text: 'Edit Collateral',
    },
  },
}

export const Withdraw: Story = {
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
      settlePrice: 31441,
    },
    onClose: () => {},
    value: '1.2',
    setValue: () => {},
    isWithdrawCollateral: true,
    setIsWithdrawCollateral: () => {},
    availableCollateralAmount: 100000000n,
    ltv: 10,
    newLTV: 20,
    collateralPrice: 1.0001,
    actionButtonProps: {
      disabled: false,
      onClick: () => {},
      text: 'Edit Collateral',
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
