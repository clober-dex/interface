import React, { useMemo } from 'react'

import { Prices } from '../../../model/prices'
import { ActionButton, ActionButtonProps } from '../../button/action-button'
import CurrencyAmountInput from '../../input/currency-amount-input'
import { formatWithCommas } from '../../../utils/bignumber'
import { formatDollarValue, formatUnits } from '../../../utils/bigint'
import { SlippageToggle } from '../../toggle/slippage-toggle'
import { Chain } from '../../../model/chain'
import { Pool } from '../../../model/pool'

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
        <div className="w-full text-white text-sm md:text-base font-bold">
          Enter amount you’d like to add.
        </div>
        <div className="flex flex-col relative gap-4 self-stretch">
          <CurrencyAmountInput
            chain={chain}
            currency={pool.currencyA}
            value={currency0Amount}
            onValueChange={setCurrency0Amount}
            availableAmount={availableCurrency0Balance}
            price={prices[pool.currencyA.address] ?? 0}
          />
          <CurrencyAmountInput
            chain={chain}
            currency={pool.currencyB}
            value={currency1Amount}
            onValueChange={setCurrency1Amount}
            availableAmount={availableCurrency1Balance}
            price={prices[pool.currencyB.address] ?? 0}
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
          <div className="text-gray-400 font-semibold">You will receive</div>
          <div className="flex items-center gap-1 ml-auto">
            {isCalculatingReceiveLpAmount ? (
              <span className="w-[100px] h-6 mx-1 rounded animate-pulse bg-gray-500"></span>
            ) : (
              <div className="flex items-center gap-1 text-white text-sm md:text-base font-semibold">
                <div>
                  {formatWithCommas(
                    formatUnits(
                      receiveLpCurrencyAmount,
                      pool.currencyLp.decimals,
                      pool.lpPriceUSD,
                    ),
                  )}
                  {' LP'}
                </div>
                <div className="text-gray-400">
                  (
                  {formatDollarValue(
                    receiveLpCurrencyAmount,
                    pool.currencyLp.decimals,
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
