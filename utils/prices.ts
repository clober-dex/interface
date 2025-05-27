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
  decimalPlaces: number,
): string => {
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
    return new BigNumber(isBid ? marketPrice : invertedMarketPrice).toFixed(
      decimalPlaces,
      isBid ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP,
    )
  } catch {
    return new BigNumber(price).toFixed(
      decimalPlaces,
      isBid ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP,
    )
  }
}
