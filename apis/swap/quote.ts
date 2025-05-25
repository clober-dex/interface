import { Transaction } from '@clober/v2-sdk'
import { getAddress, zeroAddress } from 'viem'

import { Currency } from '../../model/currency'
import { Aggregator } from '../../model/aggregator'
import { Quote } from '../../model/aggregator/quote'
import { Prices } from '../../model/prices'
import { formatUnits } from '../../utils/bigint'

export async function fetchQuotes(
  aggregators: Aggregator[],
  inputCurrency: Currency,
  amountIn: bigint,
  outputCurrency: Currency,
  slippageLimitPercent: number,
  gasPrice: bigint,
  prices: Prices,
  userAddress?: `0x${string}`,
): Promise<{ best: Quote; all: Quote[] }> {
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
      } => quote !== undefined,
    )
  if (quotes.length === 0) {
    throw new Error('No quotes available')
  }

  let bestQuote: Quote = {
    amountIn,
    amountOut: 0n,
    gasLimit: 0n,
    aggregator: aggregators[0],
    transaction: undefined,
    gasUsd: 0,
    netAmountOutUsd: 0,
  }
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
      amountIn,
      ...quote,
      gasUsd,
      netAmountOutUsd,
    }

    allQuotes.push(quoteWithMeta)

    if (outputPrice && nativePrice) {
      if (netAmountOutUsd > bestQuote.netAmountOutUsd) {
        bestQuote = quoteWithMeta
      }
    } else if (!outputPrice || !nativePrice) {
      if (
        fallbackQuote === undefined ||
        quote.amountOut > fallbackQuote.amountOut
      ) {
        fallbackQuote = {
          amountIn,
          ...quote,
          gasUsd: 0,
          netAmountOutUsd: 0,
        }
      }
    }
  }

  if (bestQuote.netAmountOutUsd === 0 && fallbackQuote) {
    bestQuote = fallbackQuote
  }

  return {
    best: bestQuote,
    all: allQuotes,
  }
}
