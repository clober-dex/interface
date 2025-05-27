import BigNumber from 'bignumber.js'

import { POLLY_FILL_DECIMALS } from './number'

export const findFirstNonZeroIndex = (number: BigNumber.Value): number => {
  const value = new BigNumber(number)
  const decimalPart = value.minus(value.integerValue())
  if (decimalPart.isZero()) {
    return 0
  }
  let i = 0
  while (
    decimalPart
      .times(10 ** i)
      .integerValue()
      .isZero()
  ) {
    i += 1
  }
  return i
}

export const formatSignificantString = (
  number: BigNumber.Value,
  places: number = 4,
  roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_FLOOR,
): string => {
  const result = new BigNumber(number).toFixed(places, roundingMode)
  if (new BigNumber(result).isZero()) {
    const index = findFirstNonZeroIndex(number)
    return new BigNumber(number).toFixed(
      index + POLLY_FILL_DECIMALS,
      roundingMode,
    )
  } else {
    return result
  }
}

export const formatPreciseAmountString = (
  number: BigNumber.Value,
  price?: number,
): string => {
  if (!price) {
    const index = findFirstNonZeroIndex(number)
    return new BigNumber(number).toFixed(
      index + POLLY_FILL_DECIMALS,
      BigNumber.ROUND_FLOOR,
    )
  }
  const underHalfPennyDecimals =
    Math.floor(Math.max(-Math.log10(0.005 / price), 0) / 2) * 2
  return new BigNumber(number).toFixed(underHalfPennyDecimals)
}

export const formatWithCommas = (number: BigNumber.Value) => {
  const parts = number.toString().split('.')
  const integer = parts[0]
  const decimal = parts[1]
  const formattedInteger =
    (integer.startsWith('-') ? '-' : '') +
    integer.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decimal ? `${formattedInteger}.${decimal}` : formattedInteger
}

export const formatAbbreviatedNumberString = (
  value: BigNumber.Value,
  decimalPlaces = 1,
): string => {
  value = new BigNumber(value)
  let abbreviatedDollarValue = new BigNumber(value)
  let suffix = ''
  if (value.gte('1000000000000')) {
    abbreviatedDollarValue = value.div('1000000000000')
    suffix = 'T'
  } else if (value.gte('1000000000')) {
    abbreviatedDollarValue = value.div('1000000000')
    suffix = 'B'
  } else if (value.gte('1000000')) {
    abbreviatedDollarValue = value.div('1000000')
    suffix = 'M'
  } else if (value.gte('1000')) {
    abbreviatedDollarValue = value.div('1000')
    suffix = 'K'
  }
  return `${formatWithCommas(abbreviatedDollarValue.toFixed(decimalPlaces))}${suffix}`
}
