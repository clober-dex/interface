import React, { useCallback, useMemo, useState } from 'react'
import { parseUnits } from 'viem'

import { Currency, LpCurrency } from '../../model/currency'
import CurrencyAmountInput from '../input/currency-amount-input'
import { Chain } from '../../model/chain'
import LpCurrencyAmountInput from '../input/lp-currency-amount-input'
import { ActionButton } from '../button/action-button'

import Modal from './modal'

export const LpWrapUnwrapModal = ({
  chain,
  lpCurrency,
  lpBalance,
  lpPrice,
  wrappedCurrency,
  wrappedBalance,
  onClose,
}: {
  chain: Chain
  lpCurrency: LpCurrency
  lpBalance: bigint
  lpPrice: number
  wrappedCurrency: Currency
  wrappedBalance: bigint
  onClose: () => void
}) => {
  const [currency, setCurrency] = useState<Currency | LpCurrency>(lpCurrency)
  const [amount, setAmount] = useState<string>('')
  const mode = useMemo(() => {
    return (currency as LpCurrency).currencyA &&
      (currency as LpCurrency).currencyB
      ? 'wrap'
      : 'unwrap'
  }, [currency])

  const swapCurrencies = useCallback(() => {
    setCurrency(mode === 'wrap' ? wrappedCurrency : lpCurrency)
    setAmount('')
  }, [lpCurrency, mode, wrappedCurrency])

  return (
    <Modal show onClose={onClose}>
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-col h-full max-h-[460px] sm:max-h-[576px]">
          <h1 className="flex font-bold mb-6 sm:text-xl items-center justify-center w-full">
            {mode === 'wrap' ? 'Wrap LP Tokens' : 'Unwrap LP Tokens'}
          </h1>

          <div className="flex flex-col justify-start items-end gap-5">
            <div className="flex flex-col w-full gap-2.5 sm:gap-3 self-stretch items-start">
              {mode === 'wrap' ? (
                <LpCurrencyAmountInput
                  chain={chain}
                  currency={lpCurrency}
                  currency0={lpCurrency.currencyA!}
                  currency1={lpCurrency.currencyB!}
                  value={amount}
                  onValueChange={setAmount}
                  availableAmount={lpBalance}
                  onCurrencyClick={undefined}
                  price={lpPrice}
                />
              ) : (
                <CurrencyAmountInput
                  chain={chain}
                  currency={wrappedCurrency}
                  value={amount}
                  onValueChange={setAmount}
                  availableAmount={wrappedBalance}
                  onCurrencyClick={undefined}
                  price={lpPrice}
                />
              )}
            </div>

            <div className="flex flex-col w-full gap-2.5 sm:gap-3 self-stretch items-start">
              {mode === 'wrap' ? (
                <CurrencyAmountInput
                  chain={chain}
                  currency={wrappedCurrency}
                  value={amount}
                  onValueChange={setAmount}
                  availableAmount={wrappedBalance}
                  onCurrencyClick={undefined}
                  price={lpPrice}
                />
              ) : (
                <LpCurrencyAmountInput
                  chain={chain}
                  currency={lpCurrency}
                  currency0={lpCurrency.currencyA!}
                  currency1={lpCurrency.currencyB!}
                  value={amount}
                  onValueChange={setAmount}
                  availableAmount={lpBalance}
                  onCurrencyClick={undefined}
                  price={lpPrice}
                />
              )}
            </div>

            <div className="absolute flex items-center justify-center top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 p-1 sm:p-1.5">
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

          <div className="flex flex-col mt-9">
            <ActionButton
              disabled={
                Number(amount) <= 0 ||
                (mode === 'wrap' && lpBalance < parseUnits(amount, 18)) ||
                (mode === 'unwrap' &&
                  wrappedBalance < parseUnits(amount, wrappedCurrency.decimals))
              }
              text={
                Number(amount) <= 0
                  ? 'Enter Amount'
                  : mode === 'wrap' && lpBalance < parseUnits(amount, 18)
                    ? 'Insufficient LP Balance'
                    : mode === 'unwrap' &&
                        wrappedBalance <
                          parseUnits(amount, wrappedCurrency.decimals)
                      ? `Insufficient ${wrappedCurrency.symbol} Balance`
                      : mode === 'wrap'
                        ? `Wrap ${lpCurrency.currencyB?.symbol}-${lpCurrency.currencyA?.symbol} LP`
                        : `Unwrap ${wrappedCurrency.symbol}`
              }
              onClick={async () => {}}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
