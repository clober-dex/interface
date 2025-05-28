import React, { useMemo } from 'react'

import { Quote } from '../model/aggregator/quote'
import { Currency } from '../model/currency'

import { SwapRouteCard } from './card/swap-router-card'

export const SwapRouteList = ({
  quotes,
  bestQuote,
  outputCurrency,
  aggregatorNames,
  selectedQuote,
  setSelectedQuote,
}: {
  quotes: Quote[]
  bestQuote: Quote | null
  outputCurrency: Currency | undefined
  aggregatorNames: string[]
  selectedQuote: Quote | null
  setSelectedQuote: (quote: Quote | null) => void
}) => {
  const quotesWithoutBestQuote = useMemo(
    () =>
      quotes.filter(
        (quote) => quote.aggregator.name !== (bestQuote?.aggregator.name ?? ''),
      ) as Quote[],
    [quotes, bestQuote],
  )
  const noRoute = useMemo(
    () =>
      quotes.length > 0 &&
      quotes.reduce((acc, quote) => acc && quote.amountOut === 0n, true),
    [quotes],
  )
  return (
    <div className="flex flex-col sm:p-4 gap-4 md:gap-2.5 sm:gap-3">
      {bestQuote && quotes.length > 0 ? (
        [bestQuote, ...quotesWithoutBestQuote].map((quote, index) => (
          <SwapRouteCard
            quote={quote}
            key={index}
            isBestQuote={quote.aggregator.name === bestQuote.aggregator.name}
            priceDifference={
              100 *
              ((Number(quote.amountOut) - Number(bestQuote.amountOut)) /
                Number(bestQuote.amountOut))
            }
            outputCurrency={outputCurrency}
            aggregatorName={quote.aggregator.name}
            isSelected={
              selectedQuote?.aggregator.name === quote.aggregator.name
            }
            setSelectedQuote={setSelectedQuote}
          />
        ))
      ) : !noRoute ? (
        aggregatorNames.map((name) => (
          <SwapRouteCard
            quote={undefined}
            key={name}
            isBestQuote={false}
            priceDifference={0}
            outputCurrency={outputCurrency}
            aggregatorName={name}
            isSelected={false}
            setSelectedQuote={undefined}
          />
        ))
      ) : (
        <div className="text-base flex font-bold text-center w-full justify-center items-center h-full lg:h-fit lg:absolute lg:top-1/2">
          No quotes available for this swap.
        </div>
      )}
    </div>
  )
}
