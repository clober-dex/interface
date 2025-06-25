import React, { useCallback, useMemo, useState } from 'react'
import { Currency6909 } from '@clober/v2-sdk'
import { parseUnits } from 'viem'

import { Currency } from '../../model/currency'
import { Chain } from '../../model/chain'
import LpCurrencyAmountInput from '../input/lp-currency-amount-input'
import { Pool } from '../../model/pool'
import { ActionButton } from '../button/action-button'

import Modal from './modal'

export const LpWrapUnwrapModal = ({
  chain,
  pool,
  lpBalance,
  lpPrice,
  wrappedBalance,
  onClose,
  onWrap,
  onUnwrap,
}: {
  chain: Chain
  pool: Pool
  lpBalance: bigint
  lpPrice: number
  wrappedBalance: bigint
  onClose: () => void
  onWrap: (pool: Pool, amount: string) => Promise<void>
  onUnwrap: (pool: Pool, amount: string) => Promise<void>
}) => {
  const [inputCurrency, setInputCurrency] = useState<Currency | Currency6909>(
    pool.lpCurrency,
  )
  const [amount, setAmount] = useState<string>('')
  const mode = useMemo(() => {
    return inputCurrency && (inputCurrency as Currency6909)?.id
      ? 'wrap'
      : 'unwrap'
  }, [inputCurrency])

  const swapCurrencies = useCallback(() => {
    setInputCurrency(mode === 'wrap' ? pool.wrappedLpCurrency : pool.lpCurrency)
    setAmount('')
  }, [mode, pool.lpCurrency, pool.wrappedLpCurrency])

  return (
    <Modal show onClose={onClose}>
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-col h-full max-h-[460px] sm:max-h-[576px]">
          <h1 className="flex font-bold mb-6 sm:text-xl items-center justify-center w-full">
            {mode === 'wrap'
              ? `Wrap ${pool.lpCurrency.symbol}`
              : `Unwrap ${pool.wrappedLpCurrency.symbol}`}
          </h1>

          <div className="flex flex-col justify-start items-end gap-5">
            <div className="flex flex-col w-full gap-2.5 sm:gap-3 self-stretch items-start">
              <LpCurrencyAmountInput
                chain={chain}
                currency={{
                  ...pool.lpCurrency,
                  symbol: mode === 'wrap' ? 'LP Token' : 'wLP Token',
                }}
                currency0={pool.currencyA}
                currency1={pool.currencyB}
                value={amount}
                onValueChange={setAmount}
                availableAmount={mode === 'wrap' ? lpBalance : wrappedBalance}
                onCurrencyClick={undefined}
                price={lpPrice}
              />
            </div>

            <div className="flex flex-col w-full gap-2.5 sm:gap-3 self-stretch items-start">
              <LpCurrencyAmountInput
                chain={chain}
                currency={{
                  ...pool.lpCurrency,
                  symbol: mode === 'wrap' ? 'wLP Token' : 'LP Token',
                }}
                currency0={pool.currencyA}
                currency1={pool.currencyB}
                value={amount}
                onValueChange={setAmount}
                availableAmount={0n}
                onCurrencyClick={undefined}
                price={lpPrice}
                disabled={true}
              />
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
                (mode === 'wrap' &&
                  lpBalance < parseUnits(amount, pool.lpCurrency.decimals)) ||
                (mode === 'unwrap' &&
                  wrappedBalance <
                    parseUnits(amount, pool.wrappedLpCurrency.decimals))
              }
              text={
                Number(amount) <= 0
                  ? 'Enter Amount'
                  : mode === 'wrap' &&
                      lpBalance < parseUnits(amount, pool.lpCurrency.decimals)
                    ? 'Insufficient LP Balance'
                    : mode === 'unwrap' &&
                        wrappedBalance <
                          parseUnits(amount, pool.wrappedLpCurrency.decimals)
                      ? `Insufficient ${pool.wrappedLpCurrency.symbol} Balance`
                      : mode === 'wrap'
                        ? `Wrap ${pool.lpCurrency.symbol}`
                        : `Unwrap ${pool.wrappedLpCurrency.symbol}`
              }
              onClick={async () => {
                if (mode === 'wrap') {
                  await onWrap(pool, amount)
                } else if (mode === 'unwrap') {
                  await onUnwrap(pool, amount)
                } else {
                  throw new Error('Invalid mode')
                }
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
