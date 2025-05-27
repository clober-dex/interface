import BigNumber from 'bignumber.js'
import { CHAIN_IDS, getPriceNeighborhood } from '@clober/v2-sdk'

import { Currency } from '../model/currency'

export const getPriceDecimals = (price: number) => {
  const priceNumber = new BigNumber(price).div(10000) // 1bp
  let i = 0
  while (
    priceNumber
      .times(10 ** i)
      .integerValue()
      .isZero()
  ) {
    i += 1
  }
  return i + 1
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
    } = getPriceNeighborhood({
      chainId,
      price,
      currency0,
      currency1,
    })
    if (decimalPlaces < 0) {
      return new BigNumber(marketPrice)
        .minus(new BigNumber(marketPrice).mod(10 ** -decimalPlaces))
        .toFixed()
    }
    return new BigNumber(marketPrice).toFixed(
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
