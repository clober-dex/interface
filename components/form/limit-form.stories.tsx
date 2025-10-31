import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { dummyCurrencies } from '../../.storybook/dummy-data/currencies'

import { LimitForm } from './limit-form'

export default {
  title: 'Form/LimitForm',
  component: LimitForm,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex flex-col rounded-2xl bg-gray-900 p-6 w-full sm:w-[480px] h-[616px]">
      <LimitForm {...args} />
    </div>
  ),
} as Meta<typeof LimitForm>

type Story = StoryObj<typeof LimitForm>

export const Default: Story = {
  args: {
    chain: mainnet,
    explorerUrl: 'https://etherscan.io',
    currencies: dummyCurrencies,
    setCurrencies: () => {},
    balances: {},
    prices: {},
    isBid: true,
    inputCurrency: undefined,
    setInputCurrency: () => {},
    inputCurrencyAmount: '0.1',
    setInputCurrencyAmount: () => {},
    outputCurrency: undefined,
    setOutputCurrency: () => {},
    outputCurrencyAmount: '0.1',
    setOutputCurrencyAmount: () => {},
    swapInputCurrencyAndOutputCurrency: () => {},
    setMarketRateAction: {
      isLoading: false,
      action: async () => {},
    },
    actionButtonProps: {
      onClick: () => {},
      disabled: false,
      text: 'Limit Order',
    },
  },
}

export const Selected: Story = {
  args: {
    chain: mainnet,
    currencies: dummyCurrencies,
    setCurrencies: () => {},
    balances: {},
    prices: {},
    isBid: true,
    inputCurrency: dummyCurrencies[0],
    setInputCurrency: () => {},
    inputCurrencyAmount: '0.1',
    setInputCurrencyAmount: () => {},
    availableInputCurrencyBalance: 10000000000n,
    outputCurrency: dummyCurrencies[4],
    setOutputCurrency: () => {},
    outputCurrencyAmount: '0.1',
    setOutputCurrencyAmount: () => {},
    swapInputCurrencyAndOutputCurrency: () => {},
    setMarketRateAction: {
      isLoading: false,
      action: async () => {},
    },
    actionButtonProps: {
      onClick: () => {},
      disabled: false,
      text: 'Limit Order',
    },
  },
}

export const IsFetchingPrice: Story = {
  args: {
    chain: mainnet,
    currencies: dummyCurrencies,
    setCurrencies: () => {},
    balances: {},
    prices: {},
    isBid: true,
    inputCurrency: undefined,
    setInputCurrency: () => {},
    inputCurrencyAmount: '0.1',
    setInputCurrencyAmount: () => {},
    outputCurrency: undefined,
    setOutputCurrency: () => {},
    outputCurrencyAmount: '0.1',
    setOutputCurrencyAmount: () => {},
    swapInputCurrencyAndOutputCurrency: () => {},
    setMarketRateAction: {
      isLoading: true,
      action: async () => {},
    },
    actionButtonProps: {
      onClick: () => {},
      disabled: false,
      text: 'Limit Order',
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
