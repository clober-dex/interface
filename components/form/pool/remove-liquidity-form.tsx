import React from 'react'

import { Prices } from '../../../model/prices'
import { Currency } from '../../../model/currency'
import { ActionButton, ActionButtonProps } from '../../button/action-button'
import LpCurrencyAmountInput from '../../input/lp-currency-amount-input'
import { formatDollarValue, formatUnits } from '../../../utils/bigint'
import { SlippageSelector } from '../../selector/slippage-selector'
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
      <div className="flex flex-col relative gap-4 self-stretch p-4 sm:p-5 bg-[#16181d] rounded-2xl lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
        <div className="flex flex-row w-full text-[#8d94a1] text-[13px] font-medium">
          Enter amount you’d like to withdraw.
        </div>
        <LpCurrencyAmountInput
          chain={chain}
          currency={{ ...pool.lpCurrency, symbol: 'LP Token' }}
          currency0={pool.currencyA}
          currency1={pool.currencyB}
          value={lpCurrencyAmount}
          onValueChange={setLpCurrencyAmount}
          availableAmount={availableLpCurrencyBalance}
          price={prices[pool.lpCurrency.address]}
        />
      </div>

      <div className="flex flex-col items-start gap-3 self-stretch text-xs sm:text-sm p-4 sm:p-5 bg-[#16181d] rounded-2xl lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
        <div className="flex justify-start items-center gap-2 self-stretch text-xs sm:text-sm">
          <div className="text-gray-400 text-[13px] font-semibold">Receive</div>
          <div className="flex h-full flex-col ml-auto gap-2">
            {receiveCurrencies.map((receiveCurrency, index) => (
              <div
                key={index}
                className="flex ml-auto items-center gap-1 text-white text-sm font-semibold"
              >
                {isCalculatingReceiveCurrencies ? (
                  <span className="w-[100px] h-5 mx-1 rounded animate-pulse bg-gray-500" />
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 text-white font-semibold">
                      <div>
                        {formatUnits(
                          receiveCurrency.amount,
                          receiveCurrency.currency.decimals,
                          prices[receiveCurrency.currency.address],
                          formatWithCommas,
                        )}
                      </div>
                      <div>{receiveCurrency.currency.symbol}</div>
                    </div>
                    <div className="text-gray-400 text-[13px]">
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

        <div className="flex flex-row w-full">
          <div className="text-gray-400 flex flex-row sm:flex-col gap-3">
            Max Slippage
          </div>
          <div className="flex ml-auto">
            <SlippageSelector
              slippageInput={slippageInput}
              setSlippageInput={setSlippageInput}
            />
          </div>
        </div>

        <ActionButton {...actionButtonProps} />
      </div>
    </>
  )
}
