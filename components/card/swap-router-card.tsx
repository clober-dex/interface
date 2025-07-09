import React from 'react'

import { Quote } from '../../model/aggregator/quote'
import { Currency } from '../../model/currency'
import { formatUnits } from '../../utils/bigint'
import { GasSvg } from '../svg/gas-svg'
import { formatWithCommas } from '../../utils/bignumber'
import { TimerSvg } from '../svg/timer-svg'

export const SwapRouteCard = ({
  quote,
  isBestQuote,
  priceDifference,
  outputCurrency,
  aggregatorName,
  isSelected,
  setSelectedQuote,
}: {
  quote: Quote | undefined
  isBestQuote: boolean
  priceDifference: number
  outputCurrency: Currency | undefined
  aggregatorName: string
  isSelected: boolean
  setSelectedQuote?: (quote: Quote | null) => void
}) => {
  return (
    <button
      onClick={
        setSelectedQuote ? () => setSelectedQuote(quote ?? null) : undefined
      }
      disabled={!setSelectedQuote}
      className={`hover:bg-[#e5eaff]/10 h-full lg:h-[84px] text-white w-full self-stretch px-3.5 sm:px-4 py-3 bg-[#e5eaff]/5 rounded-xl flex flex-col justify-start items-start gap-1.5 sm:gap-3 ${isSelected ? 'outline outline-[1.20px] outline-offset-[-1.20px] outline-blue-400/80' : ''}`}
    >
      <div className="self-stretch flex justify-start items-start gap-1">
        <div className="self-stretch inline-flex justify-start items-center gap-1.5">
          {quote && outputCurrency ? (
            <div className="justify-start text-white text-sm sm:text-base font-semibold">
              {formatWithCommas(
                formatUnits(
                  (quote?.amountOut ?? 0n) - (quote?.fee ?? 0n),
                  outputCurrency.decimals,
                ),
              )}
            </div>
          ) : (
            <div className="w-[70px] h-5 sm:h-6 rounded animate-pulse bg-gray-500" />
          )}
          <div className="justify-start text-gray-400 text-sm sm:text-base font-semibold">
            {outputCurrency?.symbol ?? ''}
          </div>
        </div>
        <div className="flex ml-auto">
          {quote ? (
            isBestQuote ? (
              <div className="px-[7px] sm:px-2 py-[3px] sm:py-1 bg-blue-500/25 rounded-2xl inline-flex justify-center items-center gap-2.5">
                <div className="justify-start text-blue-400 text-xs sm:text-sm font-semibold">
                  Best
                </div>
              </div>
            ) : (
              <div className="px-[7px] sm:px-2 py-[3px] sm:py-1 bg-red-400/10 rounded-2xl inline-flex justify-center items-center gap-2.5">
                <div className="justify-start text-red-400 text-xs sm:text-sm font-semibold">
                  {priceDifference.toFixed(2)}%
                </div>
              </div>
            )
          ) : (
            <div className="w-[70px] h-5 sm:h-6 rounded animate-pulse bg-gray-500" />
          )}
        </div>
      </div>
      <div className="self-stretch flex flex-col lg:flex-row justify-center sm:justify-start items-start gap-2 lg:gap-3">
        <div className="flex justify-start items-center gap-1.5 text-nowrap">
          {quote ? (
            <div className="justify-start text-[#838b99] text-xs sm:text-sm font-medium">
              = {quote.netAmountOutUsd >= 0 ? '' : '-'}$
              {formatWithCommas(Math.abs(quote.netAmountOutUsd).toFixed(4))}
            </div>
          ) : (
            <div className="w-[70px] h-4 sm:h-5 rounded animate-pulse bg-gray-500" />
          )}
          <div className="justify-start text-[#838b99] text-xs sm:text-sm font-medium">
            after gas fees
          </div>
        </div>
        <div className="flex justify-start items-center gap-1.5 w-full">
          {quote ? (
            <div className="flex flex-row gap-0.5 items-center justify-start text-[#838b99] text-xs sm:text-sm font-medium">
              <GasSvg /> ${formatWithCommas(quote.gasUsd.toFixed(6))}
            </div>
          ) : (
            <div className="w-[70px] h-4 sm:h-5 rounded animate-pulse bg-gray-500" />
          )}
          <div className="w-full flex flex-row justify-between items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
            <div className="text-blue-400 self-start sm:self-center">
              via {aggregatorName}
            </div>
            {quote && (
              <div className="flex flex-row gap-0.5 items-center text-[#838b99] text-nowrap">
                <TimerSvg /> {(quote.executionMilliseconds / 1000).toFixed(2)}{' '}
                sec
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
