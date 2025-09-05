import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { berachain } from 'viem/chains'

import { dummyCurrencies } from '../../.storybook/dummy-data/currencies'
import { dummyPrices } from '../../.storybook/dummy-data/prices'

import { SwapForm } from './swap-form'

export default {
  title: 'Form/SwapForm',
  component: SwapForm,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="flex flex-col rounded-2xl bg-gray-900 p-6 w-full sm:w-[480px] h-[616px]">
      <SwapForm {...args} />
    </div>
  ),
} as Meta<typeof SwapForm>

type Story = StoryObj<typeof SwapForm>

export const Default: Story = {
  args: {
    chain: berachain,
    explorerUrl: 'https://etherscan.io',
    currencies: dummyCurrencies,
    setCurrencies: () => {},
    prices: dummyPrices,
    showInputCurrencySelect: false,
    setShowInputCurrencySelect: () => {},
    inputCurrency: undefined,
    setInputCurrency: () => {},
    inputCurrencyAmount: '0.1',
    setInputCurrencyAmount: () => {},
    availableInputCurrencyBalance: 10000000000000000000n,
    showOutputCurrencySelect: false,
    setShowOutputCurrencySelect: () => {},
    outputCurrency: undefined,
    setOutputCurrency: () => {},
    outputCurrencyAmount: '0.1',
    minimumReceivedAmount: '0.1',
    gasEstimateValue: 0.0,
    aggregatorName: 'Uniswap',
    selectedExecutorName: null,
    isRefreshing: false,
    refreshQuotesAction: () => {},
    priceImpact: 0.01,
    actionButtonProps: {
      disabled: false,
      onClick: () => {},
      text: 'Swap',
    },
  },
}

export const Selected: Story = {
  args: {
    chain: berachain,
    currencies: dummyCurrencies,
    setCurrencies: () => {},
    prices: dummyPrices,
    showInputCurrencySelect: false,
    setShowInputCurrencySelect: () => {},
    inputCurrency: dummyCurrencies[0],
    setInputCurrency: () => {},
    inputCurrencyAmount: '1.123',
    setInputCurrencyAmount: () => {},
    availableInputCurrencyBalance: 10000000000000000000n,
    showOutputCurrencySelect: false,
    setShowOutputCurrencySelect: () => {},
    outputCurrency: dummyCurrencies[4],
    setOutputCurrency: () => {},
    outputCurrencyAmount: '2000',
    minimumReceivedAmount: '2000',
    slippageInput: '1.00',
    gasEstimateValue: 1.12,
    aggregatorName: 'Uniswap',
    selectedExecutorName: null,
    isRefreshing: false,
    refreshQuotesAction: () => {},
    priceImpact: 0.01,
    actionButtonProps: {
      disabled: false,
      onClick: () => {},
      text: 'Swap',
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
