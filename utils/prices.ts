import BigNumber from 'bignumber.js'
import { CHAIN_IDS, getPriceNeighborhood } from '@clober/v2-sdk'

import { Currency } from '../model/currency'

import { findFirstNonZeroIndex } from './bignumber'

export const getPriceDecimals = (price: number, r: number = 1.0001) => {
  const priceNumber = new BigNumber(price)
  const priceDiff = new BigNumber(r)
    .multipliedBy(priceNumber)
    .minus(priceNumber)
  return findFirstNonZeroIndex(priceDiff) + 1
}

export const formatCloberPriceString = (
  chainId: CHAIN_IDS,
  price: string,
  currency0: Currency,
  currency1: Currency,
  isBid: boolean,
  decimalPlaces?: number,
): string => {
  decimalPlaces =
    decimalPlaces !== undefined
      ? decimalPlaces
      : getPriceDecimals(Number(price))
  try {
    const {
      normal: {
        now: { marketPrice },
      },
      inverted: {
        now: { marketPrice: invertedMarketPrice },
      },
    } = getPriceNeighborhood({
      chainId,
      price,
      currency0,
      currency1,
    })
    const newPrice = isBid ? marketPrice : invertedMarketPrice
    if (decimalPlaces < 0) {
      return new BigNumber(newPrice)
        .minus(new BigNumber(newPrice).mod(10 ** -decimalPlaces))
        .toFixed()
    }
    return new BigNumber(newPrice).toFixed(
      decimalPlaces,
      isBid ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP,
    )
  } catch {
    if (decimalPlaces < 0) {
      return new BigNumber(price)
        .minus(new BigNumber(price).mod(10 ** -decimalPlaces))
        .toFixed()
    }
    return new BigNumber(price).toFixed(
      decimalPlaces,
      isBid ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP,
    )
  }
}
