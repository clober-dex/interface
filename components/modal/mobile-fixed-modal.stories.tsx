import React, { useState } from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { dummyCurrencies } from '../../.storybook/dummy-data/currencies'

import { MobileFixedModal } from './mobile-fixed-modal'

export default {
  title: 'Modal/MobileFixedModal',
  component: MobileFixedModal,
  parameters: {
    layout: 'centered',
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [showMobileModal, setShowMobileModal] = useState(false)

    return (
      <div className="relative w-screen h-screen flex">
        <div className="absolute -top-12 w-screen h-screen flex justify-center items-center">
          <MobileFixedModal
            {...args}
            limitFormProps={{
              ...args.limitFormProps,
              closeLimitFormAction: () => setShowMobileModal(false),
            }}
            showMobileModal={showMobileModal}
            setShowMobileModal={setShowMobileModal}
          />
        </div>
      </div>
    )
  },
} as Meta<typeof MobileFixedModal>

type Story = StoryObj<typeof MobileFixedModal>

export const Limit: Story = {
  args: {
    tab: 'limit',
    disabled: false,
    quotes: {
      best: {
        timestamp: 1,
        amountIn: 1020000000000000000n,
        amountOut: 1000000000n,
        gasLimit: 2100000n,
        aggregator: { name: 'Clober' } as any,
        transaction: undefined,
        netAmountOutUsd: 10000,
        gasUsd: 0.2,
        executionMilliseconds: 1500,
        fee: 0n,
      },
      all: [
        {
          timestamp: 1,
          amountIn: 1020000000000000000n,
          amountOut: 1000000000n,
          gasLimit: 2100000n,
          aggregator: { name: 'Clober' } as any,
          transaction: undefined,
          netAmountOutUsd: 10000,
          gasUsd: 0.2,
          executionMilliseconds: 1500,
          fee: 0n,
        },
        {
          timestamp: 2,
          amountIn: 1020000000000000000n,
          amountOut: 1300000000n,
          gasLimit: 21000000000n,
          aggregator: { name: 'OpenOcean' } as any,
          transaction: undefined,
          netAmountOutUsd: 12000,
          gasUsd: 0.2,
          executionMilliseconds: 1500,
          fee: 0n,
        },
      ],
    },
    selectedQuote: null,
    setSelectedQuote: () => {},
    limitFormProps: {
      chain: mainnet,
      explorerUrl: 'https://etherscan.io',
      priceInput: '1000',
      setPriceInput: () => {},
      minimumDecimalPlaces: 2,
      onChainPrice: 1000,
      priceDeviationPercent: 0.01,
      showInputCurrencySelect: false,
      setShowInputCurrencySelect: () => {},
      showOutputCurrencySelect: false,
      setShowOutputCurrencySelect: () => {},
      currencies: dummyCurrencies,
      setCurrencies: () => {},
      balances: {},
      prices: {},
      isBid: true,
      depthClickedIndex: 0,
      inputCurrency: dummyCurrencies[0],
      setInputCurrency: () => {},
      inputCurrencyAmount: '0.1',
      setInputCurrencyAmount: () => {},
      availableInputCurrencyBalance: 10000000000n,
      outputCurrency: dummyCurrencies[4],
      setOutputCurrency: () => {},
      outputCurrencyAmount: '0.1',
      setOutputCurrencyAmount: () => {},
      availableOutputCurrencyBalance: 100000000000000000n,
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
    swapActionButtonProps: {
      text: 'Swap',
      disabled: false,
      onClick: () => {},
    },
  },
}

export const Swap: Story = {
  args: {
    tab: 'swap',
    disabled: false,
    quotes: {
      best: {
        timestamp: 1,
        amountIn: 1020000000000000000n,
        amountOut: 1000000000n,
        gasLimit: 2100000n,
        aggregator: { name: 'Clober' } as any,
        transaction: undefined,
        netAmountOutUsd: 10000,
        gasUsd: 0.2,
        executionMilliseconds: 1500,
        fee: 0n,
      },
      all: [
        {
          timestamp: 1,
          amountIn: 1020000000000000000n,
          amountOut: 1000000000n,
          gasLimit: 2100000n,
          aggregator: { name: 'Clober' } as any,
          transaction: undefined,
          netAmountOutUsd: 10000,
          gasUsd: 0.2,
          executionMilliseconds: 1500,
          fee: 0n,
        },
        {
          timestamp: 2,
          amountIn: 1020000000000000000n,
          amountOut: 1300000000n,
          gasLimit: 21000000000n,
          aggregator: { name: 'OpenOcean' } as any,
          transaction: undefined,
          netAmountOutUsd: 12000,
          gasUsd: 0.2,
          executionMilliseconds: 2000,
          fee: 0n,
        },
      ],
    },
    selectedQuote: null,
    setSelectedQuote: () => {},
    limitFormProps: {
      chain: mainnet,
      explorerUrl: 'https://etherscan.io',
      priceInput: '1000',
      setPriceInput: () => {},
      minimumDecimalPlaces: 2,
      onChainPrice: 1000,
      priceDeviationPercent: 0.01,
      showInputCurrencySelect: false,
      setShowInputCurrencySelect: () => {},
      showOutputCurrencySelect: false,
      setShowOutputCurrencySelect: () => {},
      currencies: dummyCurrencies,
      setCurrencies: () => {},
      balances: {},
      prices: {},
      isBid: true,
      depthClickedIndex: 0,
      inputCurrency: dummyCurrencies[0],
      setInputCurrency: () => {},
      inputCurrencyAmount: '0.1',
      setInputCurrencyAmount: () => {},
      availableInputCurrencyBalance: 10000000000n,
      outputCurrency: dummyCurrencies[4],
      setOutputCurrency: () => {},
      outputCurrencyAmount: '0.1',
      setOutputCurrencyAmount: () => {},
      availableOutputCurrencyBalance: 100000000000000000n,
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
    swapActionButtonProps: {
      text: 'Swap',
      disabled: false,
      onClick: () => {},
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
