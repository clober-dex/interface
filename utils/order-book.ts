import BigNumber from 'bignumber.js'
import { CHAIN_IDS, Depth, Market } from '@clober/v2-sdk'

import { Decimals } from '../model/decimals'

import { formatSignificantString } from './bignumber'
import { formatTickPriceString } from './prices'

export function calculateInputCurrencyAmountString(
  isBid: boolean,
  outputCurrencyAmount: string,
  priceInput: string,
  inputCurrencyDecimals: number,
) {
  const inputCurrencyAmount = isBid
    ? new BigNumber(outputCurrencyAmount).times(priceInput)
    : new BigNumber(outputCurrencyAmount).div(priceInput)
  return formatSignificantString(
    inputCurrencyAmount.isNaN() || !inputCurrencyAmount.isFinite()
      ? new BigNumber(0)
      : inputCurrencyAmount,
    inputCurrencyDecimals,
  )
}

export function calculateOutputCurrencyAmountString(
  isBid: boolean,
  inputCurrencyAmount: string,
  priceInput: string,
  outputCurrencyDecimals: number,
) {
  const outputCurrencyAmount = isBid
    ? new BigNumber(inputCurrencyAmount).div(priceInput)
    : new BigNumber(inputCurrencyAmount).times(priceInput)
  return formatSignificantString(
    outputCurrencyAmount.isNaN() || !outputCurrencyAmount.isFinite()
      ? new BigNumber(0)
      : outputCurrencyAmount,
    outputCurrencyDecimals,
  )
}

export function parseDepth(
  chainId: CHAIN_IDS,
  isBid: boolean,
  market: Market,
  decimalPlaces: Decimals,
): {
  price: string
  size: string
}[] {
  return Array.from(
    [...(isBid ? market.bids : market.asks).map((depth) => ({ ...depth }))]
      .sort((a, b) =>
        isBid
          ? Number(b.price) - Number(a.price)
          : Number(a.price) - Number(b.price),
      )
      .map((x) => {
        return {
          price: x.price,
          size: new BigNumber(x.baseAmount),
          tick: BigInt(x.tick),
        }
      })
      .reduce(
        (prev, curr) => {
          const key = formatTickPriceString(
            chainId,
            curr.tick,
            market.quote,
            market.base,
            isBid,
            decimalPlaces.value,
          )
          if (!new BigNumber(key).eq(0)) {
            prev.set(
              key,
              prev.has(key)
                ? {
                    price: key,
                    size: curr.size.plus(prev.get(key)?.size || 0),
                  }
                : {
                    price: key,
                    size: curr.size,
                  },
            )
          }
          return prev
        },
        new Map<
          string,
          {
            price: string
            size: BigNumber
          }
        >(),
      )
      .values(),
  ).map((x) => {
    return {
      price: x.price,
      size: formatSignificantString(x.size, market.base.decimals),
    }
  })
}

export const isOrderBookEqual = (a: Depth[], b: Depth[]) => {
  if (a.length !== b.length) {
    return false
  }
  const sortedA = a.sort((x, y) => Number(x.price) - Number(y.price))
  const sortedB = b.sort((x, y) => Number(x.price) - Number(y.price))
  return sortedA.every((x, i) => {
    return (
      x.price === sortedB[i].price && x.baseAmount === sortedB[i].baseAmount
    )
  })
}
