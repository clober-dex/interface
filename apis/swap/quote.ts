import { Transaction } from '@clober/v2-sdk'
import {
  decodeFunctionData,
  encodeFunctionData,
  getAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'

import { Currency } from '../../model/currency'
import { Aggregator } from '../../model/aggregator'
import { Quote } from '../../model/aggregator/quote'
import { Prices } from '../../model/prices'
import { applyPercent, formatUnits, max } from '../../utils/bigint'
import { ROUTER_GATEWAY_ABI } from '../../constants/router-gateway-abi'
import { CHAIN_CONFIG } from '../../chain-configs'

const applyFeeAdjustment = (
  bestQuote: Quote,
  secondBestQuote: Quote,
  inputCurrency: Currency,
  outputCurrency: Currency,
): Quote => {
  if (!bestQuote.transaction || !secondBestQuote.transaction) {
    return bestQuote
  }

  const { args } = decodeFunctionData({
    abi: ROUTER_GATEWAY_ABI,
    data: bestQuote.transaction.data as `0x${string}`,
  })
  const fee = max(
    applyPercent(
      bestQuote.amountOut - secondBestQuote.amountOut,
      CHAIN_CONFIG.SWAP_FEE_PERCENT,
    ),
    0n,
  )
  const wrapOrUnwrap =
    (isAddressEqual(inputCurrency.address, zeroAddress) &&
      isAddressEqual(
        outputCurrency.address,
        CHAIN_CONFIG.REFERENCE_CURRENCY.address,
      )) ||
    (isAddressEqual(
      inputCurrency.address,
      CHAIN_CONFIG.REFERENCE_CURRENCY.address,
    ) &&
      isAddressEqual(outputCurrency.address, zeroAddress))

  const _fee = wrapOrUnwrap ? 0n : fee
  return {
    ...bestQuote,
    fee: _fee,
    transaction: {
      ...bestQuote.transaction,
      data: encodeFunctionData({
        abi: ROUTER_GATEWAY_ABI,
        functionName: 'swap',
        args: [
          args[0], // inputCurrency.address
          args[1], // outputCurrency.address
          args[2], // amountIn
          args[3] - _fee, // minAmountOut
          args[4], // router
          args[5], // swapData
          _fee,
        ],
      }),
    },
  }
}

export async function fetchAllQuotesAndSelectBestBeforeFeeAdjustment(
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
    const outputPrice = prices[outputCurrency.address]
    const nativePrice = prices[zeroAddress]

    const gasUsd =
      Number(formatUnits(quote.gasLimit * gasPrice, 18)) * nativePrice
    const amountOutUsd =
      Number(formatUnits(quote.amountOut, outputCurrency.decimals)) *
      outputPrice
    const netAmountOutUsd = amountOutUsd - gasUsd

    const quoteWithMeta: Quote = {
      timestamp: new Date().getTime(),
      amountIn,
      ...quote,
      gasUsd,
      netAmountOutUsd,
      fee: 0n,
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
            fee: 0n,
          }
        }
      }
    }
  }

  if (!bestQuote && fallbackQuote) {
    bestQuote = fallbackQuote
  }

  const sortedQuotes = allQuotes
    .filter((quote) => quote.amountOut > 0n)
    .sort(
      (a, b) =>
        (b.netAmountOutUsd ?? 0) - (a.netAmountOutUsd ?? 0) ||
        Number(b.amountOut) - Number(a.amountOut),
    )

  return {
    best: bestQuote,
    all: sortedQuotes,
  }
}

const LOCAL_STORAGE_QUOTES_CACHE_KEY = 'quotes-cache'
const LOCAL_STORAGE_QUOTES_CACHE_VALUE = (
  inputCurrency: Currency,
  amountIn: bigint,
  outputCurrency: Currency,
  slippageLimitPercent: number,
  gasPrice: bigint,
  userAddress?: `0x${string}`,
) => {
  return `${getAddress(inputCurrency.address)}-${amountIn.toString()}-${getAddress(outputCurrency.address)}-${slippageLimitPercent}-${gasPrice.toString()}-${userAddress || ''}`
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
  estimateGas: boolean,
  onAllQuotes: (
    callback: (prevQuotes: { best: Quote | null; all: Quote[] }) => {
      best: Quote | null
      all: Quote[]
    },
  ) => void,
): Promise<void> {
  let bestQuote: Quote | null = null
  let fallbackQuote: Quote | undefined = undefined
  // update quotes in local storage
  localStorage.setItem(
    LOCAL_STORAGE_QUOTES_CACHE_KEY,
    LOCAL_STORAGE_QUOTES_CACHE_VALUE(
      inputCurrency,
      amountIn,
      outputCurrency,
      slippageLimitPercent,
      gasPrice,
      userAddress,
    ),
  )

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
          30 * 1000,
          estimateGas,
        )
        .catch((error) => {
          console.error(`Failed to get quote from ${aggregator.name}: ${error}`)
          return
        })
      if (!quote) {
        return
      }

      const outputPrice = prices[outputCurrency.address]
      const nativePrice = prices[zeroAddress]

      const gasUsd =
        Number(formatUnits(quote.gasLimit * gasPrice, 18)) * nativePrice
      const amountOutUsd =
        Number(formatUnits(quote.amountOut, outputCurrency.decimals)) *
        outputPrice
      const netAmountOutUsd = amountOutUsd - gasUsd

      const quoteWithMeta: Quote = {
        timestamp: new Date().getTime(),
        amountIn,
        ...quote,
        gasUsd,
        netAmountOutUsd,
        fee: 0n,
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
              fee: 0n,
            }
          }
        }
      }

      // calculate and emit quotes
      if (!bestQuote && fallbackQuote) {
        bestQuote = fallbackQuote
      }
      const latestLocalStorageValue = localStorage.getItem(
        LOCAL_STORAGE_QUOTES_CACHE_KEY,
      )
      if (
        bestQuote &&
        latestLocalStorageValue ===
          LOCAL_STORAGE_QUOTES_CACHE_VALUE(
            inputCurrency,
            amountIn,
            outputCurrency,
            slippageLimitPercent,
            gasPrice,
            userAddress,
          )
      ) {
        onAllQuotes((prevQuotes) => {
          const prevQuote = prevQuotes.all.find(
            (q) => q.aggregator.name === quoteWithMeta.aggregator.name,
          )
          if (
            prevQuote === undefined ||
            (prevQuote &&
              Number(prevQuote.timestamp) < Number(quoteWithMeta.timestamp))
          ) {
            const sortedQuotes = [
              ...prevQuotes.all.filter(
                (q) => q.aggregator.name !== quoteWithMeta.aggregator.name,
              ),
              quoteWithMeta,
            ]
              .filter((quote) => quote.amountOut > 0n)
              .sort(
                (a, b) =>
                  (b.netAmountOutUsd ?? 0) - (a.netAmountOutUsd ?? 0) ||
                  Number(b.amountOut) - Number(a.amountOut),
              )
            const adjustBestQuote =
              bestQuote && sortedQuotes.length >= 2
                ? applyFeeAdjustment(
                    bestQuote,
                    sortedQuotes[1],
                    inputCurrency,
                    outputCurrency,
                  )
                : bestQuote && sortedQuotes.length === 1
                  ? {
                      ...bestQuote,
                      fee: applyPercent(
                        bestQuote.amountOut,
                        CHAIN_CONFIG.MAX_SWAP_FEE,
                      ),
                    }
                  : null
            const adjustFee = adjustBestQuote?.fee ?? 0n
            return {
              best: adjustBestQuote,
              all: sortedQuotes
                .filter((q) => q.amountOut - adjustFee > 0n)
                .map((q) => ({
                  ...q,
                  fee: adjustFee,
                })),
            }
          }
          return prevQuotes
        })
      }
    }),
  )
}
