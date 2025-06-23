import React from 'react'

import { Prices } from '../../../model/prices'
import { Currency } from '../../../model/currency'
import { ActionButton, ActionButtonProps } from '../../button/action-button'
import LpCurrencyAmountInput from '../../input/lp-currency-amount-input'
import { formatDollarValue, formatUnits } from '../../../utils/bigint'
import { SlippageToggle } from '../../toggle/slippage-toggle'
import { Chain } from '../../../model/chain'
import { Pool } from '../../../model/pool'
import { formatWithCommas } from '../../../utils/bignumber'

export const RemoveLiquidityForm = ({
  chain,
  pool,
  prices,
  lpCurrencyAmount,
  setLpCurrencyAmount,
  availableLpCurrencyBalance,
  receiveCurrencies,
  slippageInput,
  setSlippageInput,
  isCalculatingReceiveCurrencies,
  actionButtonProps,
}: {
  chain: Chain
  pool: Pool
  prices: Prices
  lpCurrencyAmount: string
  setLpCurrencyAmount: (inputCurrencyAmount: string) => void
  availableLpCurrencyBalance: bigint
  receiveCurrencies: { currency: Currency; amount: bigint }[]
  slippageInput: string
  setSlippageInput: (slippageInput: string) => void
  isCalculatingReceiveCurrencies: boolean
  actionButtonProps: ActionButtonProps
}) => {
  return (
    <>
      <div className="flex flex-col relative gap-4 self-stretch">
        <div className="text-white text-sm md:text-base font-bold">
          Enter amount you’d like to withdraw.
        </div>
        <LpCurrencyAmountInput
          chain={chain}
          currency={pool.currencyLp}
          currency0={pool.currencyA}
          currency1={pool.currencyB}
          value={lpCurrencyAmount}
          onValueChange={setLpCurrencyAmount}
          availableAmount={availableLpCurrencyBalance}
          price={prices[pool.currencyLp.address]}
        />
      </div>
      <div className="flex flex-col items-start gap-3 md:gap-4 self-stretch">
        <div className="flex justify-start items-center gap-2 self-stretch text-xs sm:text-sm">
          <div className="flex h-full text-gray-400 font-semibold">Receive</div>
          <div className="flex h-full flex-col ml-auto gap-2">
            {receiveCurrencies.map((receiveCurrency, index) => (
              <div
                key={index}
                className="flex ml-auto items-center gap-1 text-white text-sm md:text-base font-semibold"
              >
                {isCalculatingReceiveCurrencies ? (
                  <span className="w-[100px] h-5 sm:h-6 mx-1 rounded animate-pulse bg-gray-500"></span>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 text-white font-bold">
                      <div>
                        {formatWithCommas(
                          formatUnits(
                            receiveCurrency.amount,
                            receiveCurrency.currency.decimals,
                            prices[receiveCurrency.currency.address],
                          ),
                        )}
                      </div>
                      <div>{receiveCurrency.currency.symbol}</div>
                    </div>
                    <div className="text-gray-400 font-semibold">
                      (
                      {formatDollarValue(
                        receiveCurrency.amount,
                        receiveCurrency.currency.decimals,
                        prices[receiveCurrency.currency.address],
                      )}
                      )
                    </div>
                  </div>
                )}
              </div>
            ))}
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
