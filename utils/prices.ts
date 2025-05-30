import BigNumber from 'bignumber.js'
import {
  CHAIN_IDS,
  getMarketPrice,
  getPriceNeighborhood,
  getQuoteToken,
} from '@clober/v2-sdk'
import { isAddressEqual } from 'viem'

import { Currency } from '../model/currency'

export const BPS = 10000 // Basis Points

export const getPriceDecimals = (price: number) => {
  const priceNumber = new BigNumber(price).div(BPS)
  let i = 0
  while (
    priceNumber
      .times(10 ** i)
      .integerValue()
      .isZero()
  ) {
    i += 1
  }
  return i
}

export const formatToCloberPriceString = (
  chainId: CHAIN_IDS,
  price: string,
  currency0: Currency,
  currency1: Currency,
  isBid: boolean,
  decimalPlaces?: number,
): string => {
  const {
    normal: {
      now: { tick: bidTick },
    },
    inverted: {
      now: { tick: askTick },
    },
  } = getPriceNeighborhood({
    chainId,
    price,
    currency0,
    currency1,
  })
  return formatTickPriceString(
    chainId,
    isBid ? bidTick : askTick,
    currency0,
    currency1,
    isBid,
    decimalPlaces,
  )
}

export const formatTickPriceString = (
  chainId: CHAIN_IDS,
  tick: bigint,
  currency0: Currency,
  currency1: Currency,
  isBid: boolean,
  decimalPlaces?: number,
): string => {
  const [marketQuoteCurrency, marketBaseCurrency] = isAddressEqual(
    getQuoteToken({
      chainId,
      token0: currency0.address,
      token1: currency1.address,
    }),
    currency0.address,
  )
    ? [currency0, currency1]
    : [currency1, currency0]

  const price = isBid
    ? getMarketPrice({
        marketQuoteCurrency,
        marketBaseCurrency,
        bidTick: tick,
      })
    : getMarketPrice({
        marketQuoteCurrency,
        marketBaseCurrency,
        askTick: tick,
      })

  decimalPlaces =
    decimalPlaces !== undefined
      ? decimalPlaces
      : getPriceDecimals(Number(price))

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
