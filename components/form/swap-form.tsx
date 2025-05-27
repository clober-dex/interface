import React, { useCallback, useMemo, useState } from 'react'
import { isAddressEqual, parseUnits } from 'viem'
import BigNumber from 'bignumber.js'
import { getQuoteToken } from '@clober/v2-sdk'

import CurrencyAmountInput from '../input/currency-amount-input'
import { Currency } from '../../model/currency'
import CurrencySelect from '../selector/currency-select'
import {
  formatPreciseAmountString,
  toPlacesString,
} from '../../utils/bignumber'
import { ActionButton, ActionButtonProps } from '../button/action-button'
import { Prices } from '../../model/prices'
import { Balances } from '../../model/balances'
import { ExchangeSvg } from '../svg/exchange-svg'
import CloseSvg from '../svg/close-svg'
import { SlippageToggle } from '../toggle/slippage-toggle'
import { Chain } from '../../model/chain'
import { handleCopyClipBoard } from '../../utils/string'
import { ClipboardSvg } from '../svg/clipboard-svg'
import { Toast } from '../toast'

export type SwapFormProps = {
  chain: Chain
  explorerUrl: string
  currencies: Currency[]
  setCurrencies: (currencies: Currency[]) => void
  balances: Balances
  prices: Prices
  showInputCurrencySelect: boolean
  setShowInputCurrencySelect:
    | ((showInputCurrencySelect: boolean) => void)
    | undefined
  inputCurrency: Currency | undefined
  setInputCurrency: (inputCurrency: Currency | undefined) => void
  inputCurrencyAmount: string
  setInputCurrencyAmount: (inputCurrencyAmount: string) => void
  availableInputCurrencyBalance: bigint
  showOutputCurrencySelect: boolean
  setShowOutputCurrencySelect:
    | ((showOutputCurrencySelect: boolean) => void)
    | undefined
  outputCurrency: Currency | undefined
  setOutputCurrency: (outputCurrency: Currency | undefined) => void
  outputCurrencyAmount: string
  slippageInput: string
  setSlippageInput: (slippageInput: string) => void
  gasEstimateValue: number
  priceImpact: number
  aggregatorName: string
  refreshQuotesAction: () => void
  closeSwapFormAction?: () => void
  actionButtonProps?: ActionButtonProps
}

export const SwapForm = ({
  chain,
  explorerUrl,
  currencies,
  setCurrencies,
  balances,
  prices,
  showInputCurrencySelect,
  setShowInputCurrencySelect,
  inputCurrency,
  setInputCurrency,
  inputCurrencyAmount,
  setInputCurrencyAmount,
  availableInputCurrencyBalance,
  showOutputCurrencySelect,
  setShowOutputCurrencySelect,
  outputCurrency,
  setOutputCurrency,
  outputCurrencyAmount,
  slippageInput,
  setSlippageInput,
  gasEstimateValue,
  priceImpact,
  aggregatorName,
  refreshQuotesAction,
  closeSwapFormAction,
  actionButtonProps,
}: SwapFormProps) => {
  const isLoadingResults = useMemo(() => {
    return !!(
      inputCurrency &&
      outputCurrency &&
      parseUnits(inputCurrencyAmount, inputCurrency?.decimals ?? 18) > 0n &&
      parseUnits(outputCurrencyAmount, outputCurrency?.decimals ?? 18) === 0n
    )
  }, [inputCurrency, inputCurrencyAmount, outputCurrency, outputCurrencyAmount])

  const swapCurrencies = useCallback(() => {
    const prevInputCurrency = inputCurrency
    setInputCurrency(outputCurrency)
    setOutputCurrency(prevInputCurrency)
    setInputCurrencyAmount('')
  }, [
    inputCurrency,
    outputCurrency,
    setInputCurrency,
    setInputCurrencyAmount,
    setOutputCurrency,
  ])
  const [isCopyToast, setIsCopyToast] = useState(false)
  const [quoteCurrency, baseCurrency] = useMemo(() => {
    if (!inputCurrency || !outputCurrency) {
      return [undefined, undefined]
    }
    const quoteTokenAddress = getQuoteToken({
      chainId: chain.id,
      token0: inputCurrency.address,
      token1: outputCurrency.address,
    })
    return isAddressEqual(inputCurrency.address, quoteTokenAddress)
      ? [inputCurrency, outputCurrency]
      : [outputCurrency, inputCurrency]
  }, [chain.id, inputCurrency, outputCurrency])

  const exchangeRate = useMemo(() => {
    const rate = new BigNumber(outputCurrencyAmount).div(inputCurrencyAmount)
    return !inputCurrency || !quoteCurrency || rate.isNaN() || rate.isZero()
      ? new BigNumber(0)
      : isAddressEqual(inputCurrency.address, quoteCurrency.address)
        ? new BigNumber(1).div(rate)
        : rate
  }, [inputCurrency, inputCurrencyAmount, outputCurrencyAmount, quoteCurrency])

  return showInputCurrencySelect ? (
    <CurrencySelect
      chain={chain}
      explorerUrl={explorerUrl}
      currencies={
        outputCurrency
          ? currencies.filter(
              (currency) =>
                !isAddressEqual(currency.address, outputCurrency.address),
            )
          : currencies
      }
      balances={balances}
      prices={prices}
      onBack={() =>
        setShowInputCurrencySelect
          ? setShowInputCurrencySelect(false)
          : undefined
      }
      onCurrencySelect={(currency) => {
        if (setShowInputCurrencySelect) {
          setCurrencies(
            !currencies.find((c) => isAddressEqual(c.address, currency.address))
              ? [...currencies, currency]
              : currencies,
          )
          setInputCurrency(currency)
          setShowInputCurrencySelect(false)
        }
      }}
      defaultBlacklistedCurrency={outputCurrency}
    />
  ) : showOutputCurrencySelect ? (
    <CurrencySelect
      chain={chain}
      explorerUrl={explorerUrl}
      currencies={
        inputCurrency
          ? currencies.filter(
              (currency) =>
                !isAddressEqual(currency.address, inputCurrency.address),
            )
          : currencies
      }
      balances={balances}
      prices={prices}
      onBack={() =>
        setShowOutputCurrencySelect
          ? setShowOutputCurrencySelect(false)
          : undefined
      }
      onCurrencySelect={(currency) => {
        if (setShowOutputCurrencySelect) {
          setCurrencies(
            !currencies.find((c) => isAddressEqual(c.address, currency.address))
              ? [...currencies, currency]
              : currencies,
          )
          setOutputCurrency(currency)
          setShowOutputCurrencySelect(false)
        }
      }}
      defaultBlacklistedCurrency={inputCurrency}
    />
  ) : (
    <div className="flex flex-col gap-5 h-full w-full">
      <Toast
        isCopyToast={isCopyToast}
        setIsCopyToast={setIsCopyToast}
        durationInMs={1300}
      >
        <div className="w-[240px] items-center justify-center flex flex-row gap-1.5 text-white text-sm font-semibold">
          <ClipboardSvg />
          Swap URL copied to clipboard
        </div>
      </Toast>

      <div className="flex items-start gap-4 self-stretch">
        <div className="flex flex-row gap-1 items-center h-6 opacity-90 text-white text-base font-semibold">
          Swap {inputCurrency?.symbol ?? ''} &#8594;{' '}
          {outputCurrency?.symbol ?? ''}
          {inputCurrency && outputCurrency ? (
            <button
              onClick={async () => {
                await handleCopyClipBoard(
                  `${window.location.origin}/trade?inputCurrency=${inputCurrency?.address}&outputCurrency=${outputCurrency?.address}`,
                )
                setIsCopyToast(true)
              }}
              className="cursor-pointer p-0.5 bg-gray-800 rounded-md justify-center items-center gap-0.5 flex"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M13.3334 6.66665V4.99998C13.3334 4.55795 13.1578 4.13403 12.8452 3.82147C12.5327 3.50891 12.1087 3.33331 11.6667 3.33331H5.00004C4.55801 3.33331 4.13409 3.50891 3.82153 3.82147C3.50897 4.13403 3.33337 4.55795 3.33337 4.99998V11.6666C3.33337 12.1087 3.50897 12.5326 3.82153 12.8452C4.13409 13.1577 4.55801 13.3333 5.00004 13.3333H6.66671M6.66671 8.33331C6.66671 7.89129 6.8423 7.46736 7.15486 7.1548C7.46742 6.84224 7.89135 6.66665 8.33337 6.66665H15C15.4421 6.66665 15.866 6.84224 16.1786 7.1548C16.4911 7.46736 16.6667 7.89129 16.6667 8.33331V15C16.6667 15.442 16.4911 15.8659 16.1786 16.1785C15.866 16.4911 15.4421 16.6666 15 16.6666H8.33337C7.89135 16.6666 7.46742 16.4911 7.15486 16.1785C6.8423 15.8659 6.66671 15.442 6.66671 15V8.33331Z"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <></>
          )}
        </div>
        {closeSwapFormAction && (
          <button
            className="flex sm:hidden w-5 h-5 ml-auto"
            onClick={closeSwapFormAction}
          >
            <CloseSvg />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 self-stretch w-full">
        <div className="flex flex-col gap-5 self-stretch">
          <div className="flex flex-col w-full relative gap-5 self-stretch">
            <div className="flex flex-col w-full gap-2.5 sm:gap-3 self-stretch items-start">
              <div className="flex items-center w-full gap-3 self-stretch text-gray-500 text-xs sm:text-sm font-semibold">
                Pay
                <div className="flex ml-auto mr-2">
                  <button
                    onClick={refreshQuotesAction}
                    className="flex w-4 h-4 sm:w-6 sm:h-6"
                  >
                    <ExchangeSvg className="w-full h-full hover:animate-spin" />
                  </button>
                </div>
              </div>
              <CurrencyAmountInput
                chain={chain}
                currency={inputCurrency}
                value={inputCurrencyAmount}
                onValueChange={setInputCurrencyAmount}
                availableAmount={availableInputCurrencyBalance}
                onCurrencyClick={
                  setShowInputCurrencySelect
                    ? () => setShowInputCurrencySelect(true)
                    : undefined
                }
                price={
                  inputCurrency
                    ? (prices[inputCurrency.address] ?? 0)
                    : undefined
                }
              />
            </div>

            <div className="flex flex-col w-full gap-2.5 sm:gap-3 self-stretch items-start">
              <div className="flex items-center w-full gap-3 self-stretch text-gray-500 text-xs sm:text-sm font-semibold">
                Receive
              </div>
              <CurrencyAmountInput
                chain={chain}
                currency={outputCurrency}
                value={outputCurrencyAmount}
                onValueChange={() => {}}
                availableAmount={0n}
                onCurrencyClick={
                  setShowOutputCurrencySelect
                    ? () => setShowOutputCurrencySelect(true)
                    : undefined
                }
                price={
                  outputCurrency
                    ? (prices[outputCurrency.address] ?? 0)
                    : undefined
                }
                disabled={true}
              >
                <div
                  className={`text-xs sm:text-sm ${priceImpact < -5 ? 'text-yellow-500' : 'text-gray-500'} flex flex-row gap-0.5 items-center`}
                >
                  {Number.isNaN(priceImpact)
                    ? ''
                    : `(${priceImpact.toFixed(2)}%)`}
                  {priceImpact < -5 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      className="fill-yellow-500 stroke-amber-500 w-4 h-4"
                    >
                      <path d="M7.9999 4.16036L12.7918 12.4396H3.20798L7.9999 4.16036ZM8.86533 3.11604C8.48016 2.45076 7.51964 2.45076 7.13448 3.11604L1.86878 12.2113C1.48281 12.878 1.96387 13.7124 2.7342 13.7124H13.2656C14.0359 13.7124 14.517 12.878 14.131 12.2113L8.86533 3.11604Z" />
                      <path d="M8.63628 11.1669C8.63628 10.8154 8.35136 10.5305 7.9999 10.5305C7.64844 10.5305 7.36353 10.8154 7.36353 11.1669C7.36353 11.5184 7.64844 11.8033 7.9999 11.8033C8.35136 11.8033 8.63628 11.5184 8.63628 11.1669Z" />
                      <path d="M8.63628 7.34878C8.63628 6.99732 8.35136 6.7124 7.9999 6.7124C7.64844 6.7124 7.36353 6.99732 7.36353 7.34878V9.25791C7.36353 9.60937 7.64844 9.89429 7.9999 9.89429C8.35136 9.89429 8.63628 9.60937 8.63628 9.25791V7.34878Z" />
                    </svg>
                  )}
                </div>
              </CurrencyAmountInput>
            </div>

            <div className="absolute flex items-center justify-center top-[56%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 p-1 sm:p-1.5">
              <button
                className="flex items-center justify-center p-0 bg-gray-700 w-full h-full rounded-full transform hover:rotate-180 transition duration-300"
                onClick={swapCurrencies}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M4.08335 12.25L4.08335 1.75M4.08335 12.25L2.33335 10.5M4.08335 12.25L5.83335 10.5M8.16669 3.5L9.91669 1.75M9.91669 1.75L11.6667 3.5M9.91669 1.75L9.91669 12.25"
                    stroke="white"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-[13px] sm:text-sm font-medium">
          <div className="flex flex-col items-start gap-2 md:gap-3 self-stretch justify-end text-white text-[13px] sm:text-sm">
            <div className="flex items-center gap-2 self-stretch">
              <div className="text-gray-400">Gas Fee</div>
              <div className="flex ml-auto">
                {!Number.isNaN(gasEstimateValue) ? (
                  <div className="flex relative h-full sm:h-[20px] items-center text-xs sm:text-sm text-white ml-auto">
                    {isLoadingResults ? (
                      <span className="w-[50px] h-full mx-1 rounded animate-pulse bg-gray-500" />
                    ) : (
                      <div className="text-xs sm:text-sm text-gray-400 flex flex-row gap-1 items-center">
                        <span className="text-white">
                          ${toPlacesString(gasEstimateValue)}
                        </span>
                        {aggregatorName.length > 0 ? (
                          <>
                            via
                            <div className="text-gray-400">
                              {aggregatorName}
                            </div>
                          </>
                        ) : (
                          <></>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch">
              <div className="text-gray-400">Exchange Ratio</div>
              <div className="flex ml-auto">
                {baseCurrency && quoteCurrency ? (
                  <div className="flex relative h-full sm:h-[20px] items-center text-xs sm:text-sm text-white ml-auto">
                    {isLoadingResults ? (
                      <span className="w-[50px] h-full mx-1 rounded animate-pulse bg-gray-500" />
                    ) : (
                      <div className="text-xs sm:text-sm text-gray-400 flex flex-row gap-1 items-center">
                        <span className="text-white">
                          1 {baseCurrency.symbol}
                        </span>
                        =
                        <span className="text-white">
                          {formatPreciseAmountString(
                            exchangeRate,
                            baseCurrency
                              ? prices[baseCurrency.address]
                              : undefined,
                          )}{' '}
                          {quoteCurrency.symbol}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 self-stretch">
              <div className="text-gray-400">Max Slippage</div>
              <div className="flex ml-auto">
                <SlippageToggle
                  slippageInput={slippageInput}
                  setSlippageInput={setSlippageInput}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {actionButtonProps && (
        <div className="flex mt-auto">
          <ActionButton {...actionButtonProps} />
        </div>
      )}
    </div>
  )
}
