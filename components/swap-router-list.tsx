import React, { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

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
      <AnimatePresence initial={false}>
        {bestQuote && quotes.length > 0 ? (
          [bestQuote, ...quotesWithoutBestQuote]
            .filter((quote) => quote.amountOut > 0n)
            .sort(
              (a, b) =>
                (b.netAmountOutUsd ?? 0) - (a.netAmountOutUsd ?? 0) ||
                Number(b.amountOut) - Number(a.amountOut),
            )
            .map((quote, index) => (
              <motion.div
                key={quote.aggregator.name}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, y: 0, position: 'absolute' }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              >
                <SwapRouteCard
                  quote={quote}
                  key={index}
                  isBestQuote={
                    quote.aggregator.name === bestQuote.aggregator.name
                  }
                  priceDifference={
                    100 *
                    (quote.netAmountOutUsd > 0 && bestQuote.netAmountOutUsd > 0
                      ? (Number(quote.netAmountOutUsd) -
                          Number(bestQuote.netAmountOutUsd)) /
                        Number(bestQuote.netAmountOutUsd)
                      : (Number(quote.amountOut) -
                          Number(bestQuote.amountOut)) /
                        Number(bestQuote.amountOut))
                  }
                  outputCurrency={outputCurrency}
                  aggregatorName={quote.aggregator.name}
                  isSelected={
                    selectedQuote?.aggregator.name === quote.aggregator.name
                  }
                  setSelectedQuote={setSelectedQuote}
                />
              </motion.div>
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
          <div className="lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 w-full">
            <div className="flex flex-col gap-1 lg:gap-2 text-base font-bold text-center w-full justify-center items-center">
              No quotes available for this swap
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
