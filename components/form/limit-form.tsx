import React, { useEffect, useState } from 'react'
import { isAddressEqual } from 'viem'
import { getPriceNeighborhood, Market } from '@clober/v2-sdk'
import BigNumber from 'bignumber.js'

import NumberInput from '../input/number-input'
import CurrencyAmountInput from '../input/currency-amount-input'
import { Currency } from '../../model/currency'
import { ActionButton, ActionButtonProps } from '../button/action-button'
import CurrencySelect from '../selector/currency-select'
import { Balances } from '../../model/balances'
import { Prices } from '../../model/prices'
import { toSignificantString } from '../../utils/bignumber'
import {
  formatTickPriceString,
  formatToCloberPriceString,
  getPriceDecimals,
} from '../../utils/prices'
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
  depthClickedIndex: number | undefined
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
  onChainPrice: number
  priceDeviationPercent: number
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
  depthClickedIndex,
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
  onChainPrice,
  priceDeviationPercent,
  setMarketRateAction,
  closeLimitFormAction,
  actionButtonProps,
}: LimitFormProps) => {
  minimumDecimalPlaces =
    minimumDecimalPlaces !== undefined
      ? minimumDecimalPlaces
      : getPriceDecimals(Number(priceInput))

  const [debouncedPriceInput, setDebouncedPriceInput] = useState('')
  const minimumPrice = toSignificantString(
    new BigNumber(0.1).pow(minimumDecimalPlaces).toString(),
    minimumDecimalPlaces,
    BigNumber.ROUND_DOWN,
  )
  const maximumPrice = toSignificantString(
    '8662020672688495886265',
    minimumDecimalPlaces,
    BigNumber.ROUND_DOWN,
  )

  useEffect(() => {
    if (depthClickedIndex) {
      setDebouncedPriceInput('')
    }
  }, [depthClickedIndex])

  // only when user change priceInput directly
  useEffect(() => {
    const handler = setTimeout(() => {
      if (
        inputCurrency &&
        outputCurrency &&
        minimumDecimalPlaces &&
        !new BigNumber(debouncedPriceInput).isNaN()
      ) {
        setPriceInput(
          formatToCloberPriceString(
            chain.id,
            debouncedPriceInput,
            inputCurrency,
            outputCurrency,
            isBid,
            minimumDecimalPlaces,
          ),
        )
      }
    }, 1000)

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
      <div className="flex flex-col gap-4 self-stretch w-full px-5">
        <div className="flex items-start gap-4 self-stretch">
          <div className="flex flex-row gap-1 text-[#8d94a1] text-[13px] font-medium h-full justify-start">
            <span className={`${isBid ? 'text-green-400' : 'text-red-400'}`}>
              {isBid ? 'Buy' : 'Sell'}
            </span>{' '}
            {isBid ? outputCurrency?.symbol : inputCurrency?.symbol} at rate
            {onChainPrice > 0 && priceDeviationPercent >= 10000 ? (
              <div className="text-green-400 text-[13px] font-medium">
                (&gt;10000%)
              </div>
            ) : priceDeviationPercent === -100 ? (
              <></>
            ) : !isNaN(priceDeviationPercent) &&
              isFinite(priceDeviationPercent) &&
              priceDeviationPercent.toFixed(2) !== '0.00' ? (
              <div
                className={`text-gray-200 ${
                  priceDeviationPercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                ({priceDeviationPercent.toFixed(2)}%)
              </div>
            ) : (
              <></>
            )}
          </div>
          {closeLimitFormAction && (
            <button
              className="flex sm:hidden w-3 sm:w-4 h-3 sm:h-3 ml-auto"
              onClick={closeLimitFormAction}
            >
              <CloseSvg />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-5 self-stretch w-full">
          <div className="flex flex-col gap-5 self-stretch">
            <div className="flex flex-col gap-3 self-stretch">
              <div className="hover:ring-1 hover:ring-gray-700 self-stretch p-4 bg-[#24272e] rounded-xl outline outline-1 outline-offset-[-1px] outline-[#39393b] flex justify-center items-start gap-[14px]">
                <div className="flex flex-col flex-1 gap-2 w-full items-end">
                  {setMarketRateAction && setMarketRateAction.isLoading ? (
                    <span className="flex w-full h-[28px] sm:h-[33px] rounded animate-pulse bg-gray-500" />
                  ) : (
                    <NumberInput
                      value={priceInput}
                      onValueChange={(value) => {
                        setDebouncedPriceInput(value)
                        setPriceInput(value)
                      }}
                      className="text-xl w-full sm:text-[28px] font-medium bg-transparent placeholder-gray-500 text-white outline-none text-right"
                    />
                  )}
                  <div className="h-[22px] justify-start items-start gap-1 sm:gap-1.5 flex">
                    {setMarketRateAction ? (
                      <button
                        disabled={false}
                        onClick={async () => {
                          setDebouncedPriceInput('')
                          await setMarketRateAction.action()
                        }}
                        className="px-2 py-1 bg-blue-400/25 rounded-xl inline-flex justify-center items-center gap-2.5 text-center text-blue-300 text-[11px] sm:text-xs font-medium"
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
                      setDebouncedPriceInput('')
                      if (
                        selectedMarket &&
                        inputCurrency &&
                        outputCurrency &&
                        minimumDecimalPlaces !== undefined &&
                        !new BigNumber(priceInput).isNaN()
                      ) {
                        if (new BigNumber(priceInput).gte(maximumPrice)) {
                          setPriceInput('')
                          return
                        }
                        const {
                          normal: {
                            now: { tick: bidTick },
                          },
                          inverted: {
                            now: { tick: askTick },
                          },
                        } = getPriceNeighborhood({
                          chainId: chain.id,
                          price: priceInput,
                          currency0: inputCurrency,
                          currency1: outputCurrency,
                        })
                        let currentTick = isBid ? bidTick : askTick
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                          const nextPrice = formatTickPriceString(
                            chain.id,
                            currentTick,
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
                          currentTick = isBid
                            ? currentTick + 1n
                            : currentTick - 1n
                        }
                      }
                    }}
                    className="cursor-pointer group group-hover:ring-1 group-hover:ring-gray-700 flex w-full h-full bg-[#3e3e41] rounded flex-col items-center justify-center gap-1 px-4 py-2.5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                    >
                      <path
                        d="M11 6.5L6 1.5L1 6.5"
                        stroke="#8D94A1"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setDebouncedPriceInput('')
                      if (
                        selectedMarket &&
                        inputCurrency &&
                        outputCurrency &&
                        minimumDecimalPlaces !== undefined &&
                        !new BigNumber(priceInput).isNaN()
                      ) {
                        if (new BigNumber(priceInput).gte(maximumPrice)) {
                          setPriceInput('')
                          return
                        }
                        const {
                          normal: {
                            now: { tick: bidTick },
                          },
                          inverted: {
                            now: { tick: askTick },
                          },
                        } = getPriceNeighborhood({
                          chainId: chain.id,
                          price: priceInput,
                          currency0: inputCurrency,
                          currency1: outputCurrency,
                        })
                        let currentTick = isBid ? bidTick : askTick
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                          const nextPrice = formatTickPriceString(
                            chain.id,
                            currentTick,
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
                          currentTick = isBid
                            ? currentTick - 1n
                            : currentTick + 1n
                        }
                      }
                    }}
                    className="cursor-pointer group group-hover:ring-1 group-hover:ring-gray-700 flex w-full h-full bg-[#3e3e41] rounded flex-col items-center justify-center gap-1 px-4 py-2.5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                    >
                      <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="#8D94A1"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-full relative gap-4 self-stretch">
              <div className="flex flex-col w-full gap-2.5 sm:gap-4 self-stretch items-start">
                <span className="text-[#8d94a1] text-[13px] font-medium">
                  Pay
                </span>
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
                    inputCurrency ? prices[inputCurrency.address] : undefined
                  }
                />
              </div>

              <div className="flex flex-col w-full gap-2.5 sm:gap-4 self-stretch items-start">
                <span className="text-[#8d94a1] text-[13px] font-medium">
                  Receive
                </span>
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
                    outputCurrency ? prices[outputCurrency.address] : undefined
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

          <div className="flex sm:hidden justify-end text-white text-[13px] sm:text-sm h-1 sm:h-0">
            {/*<CheckIcon*/}
            {/*  checked={isPostOnly}*/}
            {/*  onCheck={() => setIsPostOnly((prevState) => !prevState)}*/}
            {/*  text="Post Only"*/}
            {/*/>*/}
          </div>
        </div>
      </div>

      {actionButtonProps && (
        <div className="flex mt-auto px-5">
          <ActionButton {...actionButtonProps} />
        </div>
      )}
    </div>
  )
}
