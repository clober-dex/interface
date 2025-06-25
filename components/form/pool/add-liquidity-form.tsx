import React, { useMemo } from 'react'
import { isAddressEqual } from 'viem'

import { Prices } from '../../../model/prices'
import { ActionButton, ActionButtonProps } from '../../button/action-button'
import CurrencyAmountInput from '../../input/currency-amount-input'
import { formatWithCommas } from '../../../utils/bignumber'
import { formatDollarValue, formatUnits } from '../../../utils/bigint'
import { SlippageToggle } from '../../toggle/slippage-toggle'
import { Chain } from '../../../model/chain'
import { Pool } from '../../../model/pool'
import { WHITELISTED_WRAPPED_LP_CURRENCIES } from '../../../chain-configs/pool'

export const AddLiquidityForm = ({
  chain,
  pool,
  prices,
  currency0Amount,
  setCurrency0Amount,
  availableCurrency0Balance,
  currency1Amount,
  setCurrency1Amount,
  availableCurrency1Balance,
  disableSwap,
  setDisableSwap,
  disableDisableSwap,
  slippageInput,
  setSlippageInput,
  receiveLpCurrencyAmount,
  isCalculatingReceiveLpAmount,
  setShowLpWrapUnwrapModal,
  actionButtonProps,
}: {
  chain: Chain
  pool: Pool
  prices: Prices
  currency0Amount: string
  setCurrency0Amount: (inputCurrencyAmount: string) => void
  availableCurrency0Balance: bigint
  currency1Amount: string
  setCurrency1Amount: (inputCurrencyAmount: string) => void
  availableCurrency1Balance: bigint
  disableSwap: boolean
  setDisableSwap: (value: boolean) => void
  disableDisableSwap: boolean
  slippageInput: string
  setSlippageInput: (slippageInput: string) => void
  receiveLpCurrencyAmount: bigint
  isCalculatingReceiveLpAmount: boolean
  setShowLpWrapUnwrapModal: (show: boolean) => void
  actionButtonProps: ActionButtonProps
}) => {
  const isNoLiquidity = useMemo(
    () =>
      pool.liquidityA.total.value === '0' &&
      pool.liquidityB.total.value === '0',
    [pool],
  )
  return (
    <>
      <div className="flex flex-col relative gap-4 self-stretch">
        <div className="flex flex-row w-full text-white text-sm md:text-base font-bold">
          <div>Enter amount you’d like to add.</div>

          {WHITELISTED_WRAPPED_LP_CURRENCIES.some((currency) =>
            isAddressEqual(currency.address, pool.wrappedLpCurrency.address),
          ) && (
            <button
              onClick={() => {
                setShowLpWrapUnwrapModal(true)
              }}
              className="ml-auto w-fit sm:w-[140px] h-fit sm:h-8 px-2 sm:px-6 py-1 sm:py-4 bg-blue-500/25 rounded-xl shadow-[7.660800457000732px_7.660800457000732px_61.28640365600586px_0px_rgba(191,57,0,0.32)] inline-flex justify-center items-center"
            >
              <div className="text-nowrap opacity-90 text-center justify-center text-blue-400 text-[11px] sm:text-sm font-bold">
                Wrap / Unwrap
              </div>
            </button>
          )}
        </div>
        <div className="flex flex-col relative gap-4 self-stretch">
          <CurrencyAmountInput
            chain={chain}
            currency={pool.currencyA}
            value={currency0Amount}
            onValueChange={setCurrency0Amount}
            availableAmount={availableCurrency0Balance}
            price={prices[pool.currencyA.address]}
          />
          <CurrencyAmountInput
            chain={chain}
            currency={pool.currencyB}
            value={currency1Amount}
            onValueChange={setCurrency1Amount}
            availableAmount={availableCurrency1Balance}
            price={prices[pool.currencyB.address]}
          />
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <div className="text-white text-xs sm:text-sm font-semibold">
            Auto-Balance Liquidity
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              disabled={disableDisableSwap}
              defaultChecked={!isNoLiquidity && !chain.testnet}
              onChange={() => {
                setDisableSwap(!disableSwap)
              }}
            />
            <div className="relative w-7 sm:w-11 h-4 sm:h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-0 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 sm:after:h-5 after:w-3 sm:after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
      <div className="flex flex-col items-start gap-3 md:gap-4 self-stretch text-xs sm:text-sm">
        <div className="flex items-center gap-2 self-stretch">
          <div className="text-gray-400 font-semibold">Receive</div>
          <div className="flex items-center gap-1 ml-auto">
            {isCalculatingReceiveLpAmount ? (
              <span className="w-[100px] h-6 mx-1 rounded animate-pulse bg-gray-500"></span>
            ) : (
              <div className="flex items-center gap-1 text-white text-sm md:text-base font-semibold">
                <div>
                  {formatWithCommas(
                    formatUnits(
                      receiveLpCurrencyAmount,
                      pool.lpCurrency.decimals,
                      pool.lpPriceUSD,
                    ),
                  )}
                  {' LP'}
                </div>
                <div className="text-gray-400">
                  (
                  {formatDollarValue(
                    receiveLpCurrencyAmount,
                    pool.lpCurrency.decimals,
                    pool.lpPriceUSD,
                  )}
                  )
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 sm:gap-2 self-stretch flex-col sm:flex-row text-xs sm:text-sm">
          <div className="text-gray-400 font-semibold flex mr-auto">
            Max Slippage
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <SlippageToggle
              slippageInput={slippageInput}
              setSlippageInput={setSlippageInput}
            />
          </div>
        </div>
      </div>
      <ActionButton {...actionButtonProps} />
    </>
  )
}
