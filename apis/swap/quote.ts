import { Transaction } from '@clober/v2-sdk'
import { getAddress, zeroAddress } from 'viem'

import { Currency } from '../../model/currency'
import { Aggregator } from '../../model/aggregator'
import { Quote } from '../../model/aggregator/quote'
import { Prices } from '../../model/prices'
import { formatUnits } from '../../utils/bigint'

export async function fetchAllQuotesAndSelectBest(
  aggregators: Aggregator[],
  inputCurrency: Currency,
  amountIn: bigint,
  outputCurrency: Currency,
  slippageLimitPercent: number,
  gasPrice: bigint,
  prices: Prices,
  userAddress?: `0x${string}`,
): Promise<{ best: Quote | null; all: Quote[] }> {
  const quotes = (
    await Promise.allSettled(
      aggregators.map((aggregator) =>
        aggregator
          .quote(
            inputCurrency,
            amountIn,
            outputCurrency,
            slippageLimitPercent,
            gasPrice,
            userAddress,
          )
          .catch((error) => {
            console.error(
              `Failed to get quote from ${aggregator.name}: ${error}`,
            )
          }),
      ),
    )
  )
    .map((result) => (result.status === 'fulfilled' ? result.value : undefined))
    .filter(
      (
        quote,
      ): quote is {
        amountOut: bigint
        gasLimit: bigint
        aggregator: Aggregator
        transaction: Transaction | undefined
        executionMilliseconds: number
      } => quote !== undefined,
    )
  if (quotes.length === 0) {
    throw new Error('No quotes available')
  }

  let bestQuote: Quote | null = null
  let fallbackQuote: Quote | undefined = undefined
  const allQuotes: Quote[] = []
  for (const quote of quotes) {
    const outputPrice = prices[getAddress(outputCurrency.address)]
    const nativePrice = prices[zeroAddress]

    const gasUsd =
      Number(formatUnits(quote.gasLimit * gasPrice, 18)) * (nativePrice ?? 0)
    const amountOutUsd =
      Number(formatUnits(quote.amountOut, outputCurrency.decimals)) *
      (outputPrice ?? 0)
    const netAmountOutUsd = amountOutUsd - gasUsd

    const quoteWithMeta: Quote = {
      timestamp: new Date().getTime(),
      amountIn,
      ...quote,
      gasUsd,
      netAmountOutUsd,
    }

    allQuotes.push(quoteWithMeta)

    if (quote.amountOut > 0n) {
      if (outputPrice && nativePrice) {
        if (
          netAmountOutUsd >
          (bestQuote?.netAmountOutUsd ?? -Number.MAX_SAFE_INTEGER)
        ) {
          bestQuote = quoteWithMeta
        }
      } else if (!outputPrice || !nativePrice) {
        if (
          fallbackQuote === undefined ||
          quote.amountOut > fallbackQuote.amountOut
        ) {
          fallbackQuote = {
            timestamp: new Date().getTime(),
            amountIn,
            ...quote,
            gasUsd: 0,
            netAmountOutUsd: 0,
          }
        }
      }
    }
  }

  if (!bestQuote && fallbackQuote) {
    bestQuote = fallbackQuote
  }

  return {
    best: bestQuote,
    all: allQuotes,
  }
}

export async function fetchQuotesLive(
  aggregators: Aggregator[],
  inputCurrency: Currency,
  amountIn: bigint,
  outputCurrency: Currency,
  slippageLimitPercent: number,
  gasPrice: bigint,
  prices: Prices,
  userAddress: `0x${string}` | undefined,
  onAllQuotes: (
    callback: (prevQuotes: { best: Quote | null; all: Quote[] }) => {
      best: Quote | null
      all: Quote[]
    },
  ) => void,
): Promise<void> {
  let bestQuote: Quote | null = null
  let fallbackQuote: Quote | undefined = undefined

  onAllQuotes(() => ({
    best: null,
    all: [],
  }))

  await Promise.all(
    aggregators.map(async (aggregator) => {
      const quote = await aggregator
        .quote(
          inputCurrency,
          amountIn,
          outputCurrency,
          slippageLimitPercent,
          gasPrice,
          userAddress,
        )
        .catch((error) => {
          console.error(`Failed to get quote from ${aggregator.name}: ${error}`)
          return
        })
      if (!quote) {
        return
      }

      const outputPrice = prices[getAddress(outputCurrency.address)]
      const nativePrice = prices[zeroAddress]

      const gasUsd =
        Number(formatUnits(quote.gasLimit * gasPrice, 18)) * (nativePrice ?? 0)
      const amountOutUsd =
        Number(formatUnits(quote.amountOut, outputCurrency.decimals)) *
        (outputPrice ?? 0)
      const netAmountOutUsd = amountOutUsd - gasUsd

      const quoteWithMeta: Quote = {
        timestamp: new Date().getTime(),
        amountIn,
        ...quote,
        gasUsd,
        netAmountOutUsd,
      }

      if (quote.amountOut > 0n) {
        if (outputPrice && nativePrice) {
          if (
            netAmountOutUsd >
            (bestQuote?.netAmountOutUsd ?? -Number.MAX_SAFE_INTEGER)
          ) {
            bestQuote = quoteWithMeta
          }
        } else if (!outputPrice || !nativePrice) {
          if (
            fallbackQuote === undefined ||
            quote.amountOut > fallbackQuote.amountOut
          ) {
            fallbackQuote = {
              timestamp: new Date().getTime(),
              amountIn,
              ...quote,
              gasUsd: 0,
              netAmountOutUsd: 0,
            }
          }
        }
      }

      // calculate and emit quotes
      if (!bestQuote && fallbackQuote) {
        bestQuote = fallbackQuote
      }
      if (bestQuote) {
        onAllQuotes((prevQuotes) => {
          const prevQuote = prevQuotes.all.find(
            (q) => q.aggregator.name === quoteWithMeta.aggregator.name,
          )
          if (
            prevQuote === undefined ||
            (prevQuote &&
              Number(prevQuote.timestamp) < Number(quoteWithMeta.timestamp))
          ) {
            return {
              best: bestQuote,
              all: [
                ...prevQuotes.all.filter(
                  (q) => q.aggregator.name !== quoteWithMeta.aggregator.name,
                ),
                quoteWithMeta,
              ],
            }
          }
          return prevQuotes
        })
      }
    }),
  )
}
