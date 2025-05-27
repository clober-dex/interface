import React, { useEffect, useState } from 'react'
import { isAddressEqual } from 'viem'
import { getMarketPrice, getPriceNeighborhood, Market } from '@clober/v2-sdk'
import BigNumber from 'bignumber.js'

import NumberInput from '../input/number-input'
import CurrencyAmountInput from '../input/currency-amount-input'
import { Currency } from '../../model/currency'
import { ActionButton, ActionButtonProps } from '../button/action-button'
import CurrencySelect from '../selector/currency-select'
import { Balances } from '../../model/balances'
import { Prices } from '../../model/prices'
import { formatSignificantString } from '../../utils/bignumber'
import { formatCloberPriceString, getPriceDecimals } from '../../utils/prices'
import CloseSvg from '../svg/close-svg'
import { Chain } from '../../model/chain'

export type LimitFormProps = {
  chain: Chain
  explorerUrl: string
  currencies: Currency[]
  setCurrencies: (currencies: Currency[]) => void
  balances: Balances
  prices: Prices
  priceInput: string
  setPriceInput: (priceInput: string) => void
  selectedMarket?: Market
  isBid: boolean
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
  setOutputCurrencyAmount: (outputCurrencyAmount: string) => void
  availableOutputCurrencyBalance: bigint
  swapInputCurrencyAndOutputCurrency: () => void
  minimumDecimalPlaces: number | undefined
  marketPrice: number
  marketRateDiff: number
  setMarketRateAction:
    | {
        isLoading: boolean
        action: () => Promise<void>
      }
    | undefined
  closeLimitFormAction?: () => void
  actionButtonProps?: ActionButtonProps
}

export const LimitForm = ({
  chain,
  explorerUrl,
  currencies,
  setCurrencies,
  balances,
  prices,
  priceInput,
  setPriceInput,
  selectedMarket,
  isBid,
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
  setOutputCurrencyAmount,
  availableOutputCurrencyBalance,
  swapInputCurrencyAndOutputCurrency,
  minimumDecimalPlaces,
  marketPrice,
  marketRateDiff,
  setMarketRateAction,
  closeLimitFormAction,
  actionButtonProps,
}: LimitFormProps) => {
  minimumDecimalPlaces =
    minimumDecimalPlaces !== undefined
      ? minimumDecimalPlaces
      : getPriceDecimals(Number(priceInput))

  const [debouncedPriceInput, setDebouncedPriceInput] = useState('')
  const minimumPrice = formatSignificantString(
    new BigNumber(0.1).pow(minimumDecimalPlaces).toString(),
    minimumDecimalPlaces,
    BigNumber.ROUND_DOWN,
  )
  const maximumPrice = formatSignificantString(
    '8662020672688495886265',
    minimumDecimalPlaces,
    BigNumber.ROUND_DOWN,
  )

  // only when user change priceInput directly
  useEffect(() => {
    const handler = setTimeout(() => {
      if (
        inputCurrency &&
        outputCurrency &&
        minimumDecimalPlaces &&
        !new BigNumber(debouncedPriceInput).isNaN()
      ) {
        const price = formatCloberPriceString(
          chain.id,
          debouncedPriceInput,
          inputCurrency,
          outputCurrency,
          isBid,
          minimumDecimalPlaces,
        )
        setPriceInput(price)
      }
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [
    chain.id,
    debouncedPriceInput,
    inputCurrency,
    isBid,
    minimumDecimalPlaces,
    outputCurrency,
    setPriceInput,
  ])

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
      <div className="flex flex-col gap-6 self-stretch w-full">
        <div className="flex items-start gap-4 self-stretch">
          <div className="flex flex-row gap-1 items-center h-6 opacity-90 text-white text-base font-semibold">
            {isBid ? 'Buy' : 'Sell'} {selectedMarket?.base?.symbol} at rate
            {marketPrice > 0 && marketRateDiff >= 10000 ? (
              <div className="text-xs sm:text-sm font-semibold text-green-400">
                (&gt;10000%)
              </div>
            ) : marketRateDiff === -100 ? (
              <></>
            ) : !isNaN(marketRateDiff) &&
              isFinite(marketRateDiff) &&
              marketRateDiff.toFixed(2) !== '0.00' ? (
              <div
                className={`text-gray-200 ${
                  marketRateDiff >= 0 ? 'text-green-400' : 'text-red-400'
                } sm:text-sm font-semibold`}
              >
                ({marketRateDiff.toFixed(2)}%)
              </div>
            ) : (
              <></>
            )}
          </div>
          {closeLimitFormAction && (
            <button
              className="flex sm:hidden w-5 h-5 ml-auto"
              onClick={closeLimitFormAction}
            >
              <CloseSvg />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-5 self-stretch w-full">
          <div className="flex flex-col gap-5 self-stretch">
            <div className="flex flex-col gap-3 self-stretch">
              <div className="h-[92px] sm:h-[104px] items-center hover:ring-1 hover:ring-gray-700 flex rounded-xl border-solid border-2 border-gray-700 p-4">
                <div className="flex flex-col flex-1 gap-2">
                  {setMarketRateAction && setMarketRateAction.isLoading ? (
                    <span className="flex justify-start items-start w-[235px] sm:w-[340px] h-[32px] sm:h-[34px] rounded animate-pulse bg-gray-500" />
                  ) : (
                    <NumberInput
                      value={priceInput}
                      onValueChange={(value) => {
                        setDebouncedPriceInput(value)
                        setPriceInput(value)
                      }}
                      className="text-xl w-full sm:text-3xl bg-transparent placeholder-gray-500 text-white outline-none"
                    />
                  )}
                  <div className="h-6 justify-start items-start gap-1 sm:gap-1.5 flex">
                    {setMarketRateAction ? (
                      <button
                        disabled={false}
                        onClick={async () => {
                          await setMarketRateAction.action()
                        }}
                        className="text-center text-blue-400 text-xs font-semibold px-1.5 py-[5px] sm:px-2 sm:py-[5px] bg-blue-500/25 rounded-xl justify-center items-center gap-2.5 flex"
                      >
                        Set to market rate
                      </button>
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
                <div className="flex items-center w-[34px] sm:w-11 h-full flex-col gap-2">
                  <button
                    onClick={() => {
                      if (
                        selectedMarket &&
                        inputCurrency &&
                        outputCurrency &&
                        minimumDecimalPlaces &&
                        !new BigNumber(priceInput).isNaN()
                      ) {
                        if (new BigNumber(priceInput).gte(maximumPrice)) {
                          setPriceInput('')
                          return
                        }
                        const {
                          normal: {
                            now: { tick },
                          },
                        } = getPriceNeighborhood({
                          chainId: chain.id,
                          price: priceInput,
                          currency0: inputCurrency,
                          currency1: outputCurrency,
                        })
                        let currentTick = tick
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                          const price = getMarketPrice({
                            marketQuoteCurrency: selectedMarket.quote,
                            marketBaseCurrency: selectedMarket.base,
                            bidTick: currentTick,
                          })
                          const nextPrice = formatCloberPriceString(
                            chain.id,
                            price,
                            inputCurrency,
                            outputCurrency,
                            isBid,
                            minimumDecimalPlaces,
                          )
                          if (new BigNumber(nextPrice).lt(minimumPrice)) {
                            setPriceInput(minimumPrice)
                            break
                          }
                          if (new BigNumber(nextPrice).gt(priceInput)) {
                            setPriceInput(nextPrice)
                            break
                          }
                          currentTick = currentTick + 1n
                        }
                      }
                    }}
                    className="cursor-pointer group group-hover:ring-1 group-hover:ring-gray-700 flex w-full h-full bg-gray-800 rounded flex-col items-center justify-center gap-1"
                  >
                    <svg
                      className="group-hover:stroke-white stroke-[#9CA3AF] w-[12px] h-[7px] sm:w-[14px] sm:h-[8px]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 12 7"
                      fill="none"
                    >
                      <path
                        d="M11 6L6 1L1 6"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (
                        selectedMarket &&
                        inputCurrency &&
                        outputCurrency &&
                        minimumDecimalPlaces &&
                        !new BigNumber(priceInput).isNaN()
                      ) {
                        if (new BigNumber(priceInput).gte(maximumPrice)) {
                          setPriceInput('')
                          return
                        }
                        const {
                          normal: {
                            now: { tick },
                          },
                        } = getPriceNeighborhood({
                          chainId: chain.id,
                          price: priceInput,
                          currency0: inputCurrency,
                          currency1: outputCurrency,
                        })
                        let currentTick = tick
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                          const price = getMarketPrice({
                            marketQuoteCurrency: selectedMarket.quote,
                            marketBaseCurrency: selectedMarket.base,
                            bidTick: currentTick,
                          })
                          const nextPrice = formatCloberPriceString(
                            chain.id,
                            price,
                            inputCurrency,
                            outputCurrency,
                            isBid,
                            minimumDecimalPlaces,
                          )
                          if (new BigNumber(nextPrice).lte(minimumPrice)) {
                            setPriceInput(minimumPrice)
                            break
                          }
                          if (new BigNumber(nextPrice).lt(priceInput)) {
                            setPriceInput(nextPrice)
                            break
                          }
                          currentTick = currentTick - 1n
                        }
                      }
                    }}
                    className="cursor-pointer group group-hover:ring-1 group-hover:ring-gray-700 flex w-full h-full bg-gray-800 rounded flex-col items-center justify-center gap-1"
                  >
                    <svg
                      className="group-hover:stroke-white stroke-[#9CA3AF] w-[12px] h-[7px] sm:w-[14px] sm:h-[8px]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 12 7"
                      fill="none"
                    >
                      <path
                        d="M1 1L6 6L11 1"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-full relative gap-5 self-stretch">
              <div className="flex flex-col w-full gap-2.5 sm:gap-3 self-stretch items-start">
                <div className="flex items-center w-full gap-3 self-stretch text-gray-500 text-xs sm:text-sm font-semibold">
                  Pay
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
                  onValueChange={setOutputCurrencyAmount}
                  availableAmount={availableOutputCurrencyBalance}
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
                />
              </div>

              <div className="absolute flex items-center justify-center top-[56%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 p-1 sm:p-1.5">
                <button
                  className="flex items-center justify-center p-0 bg-gray-700 w-full h-full rounded-full transform hover:rotate-180 transition duration-300"
                  onClick={swapInputCurrencyAndOutputCurrency}
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

          <div className="flex justify-end text-white text-[13px] sm:text-sm h-5">
            {/*<CheckIcon*/}
            {/*  checked={isPostOnly}*/}
            {/*  onCheck={() => setIsPostOnly((prevState) => !prevState)}*/}
            {/*  text="Post Only"*/}
            {/*/>*/}
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
