import BigNumber from 'bignumber.js'

import { BPS } from './prices'

export const POLLY_FILL_DECIMALS = 4
const TINY_NUMBER_LIST = [
  '₀',
  '₁',
  '₂',
  '₃',
  '₄',
  '₅',
  '₆',
  '₇',
  '₈',
  '₉',
  '₁₀',
  '₁₁',
  '₁₂',
  '₁₃',
  '₁₄',
  '₁₅',
  '₁₆',
  '₁₇',
  '₁₈',
  '₁₉',
  '₂₀',
  '₂₁',
  '₂₂',
  '₂₃',
  '₂₄',
  '₂₅',
  '₂₆',
  '₂₇',
  '₂₈',
  '₂₉',
  '₃₀',
  '₃₁',
  '₃₂',
  '₃₃',
  '₃₄',
  '₃₅',
  '₃₆',
  '₃₇',
  '₃₈',
  '₃₉',
  '₄₀',
  '₄₁',
  '₄₂',
  '₄₃',
  '₄₄',
  '₄₅',
  '₄₆',
  '₄₇',
  '₄₈',
]

/**
 * Finds the index of the first non-zero digit in the decimal portion of a number.
 *
 * @param number - A number or string compatible with BigNumber.
 * @returns The index (0-based) of the first non-zero digit after the decimal point.
 *          Returns 0 if the number is an integer.
 */
export const findFirstNonZeroDecimalIndex = (
  number: BigNumber.Value,
): number => {
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

/**
 * Formats a number into a string with a fixed number of decimal places.
 * If the result rounds to zero, dynamically increases precision to show significant digits.
 *
 * @param number - A number or string compatible with BigNumber.
 * @param places - Number of decimal places to show (default: 4).
 * @param roundingMode - Rounding mode from BigNumber (default: ROUND_FLOOR).
 * @param formatter - (Optional) A custom formatter function to format the final string.
 * @returns A formatted string with either the specified decimal places or
 *          dynamically extended precision if the number is near zero.
 */
export const formatSignificantString = (
  number: BigNumber.Value,
  places: number = 4,
  roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_FLOOR,
  formatter?: (value: BigNumber.Value) => string,
): string => {
  const result = new BigNumber(number).toFixed(places, roundingMode)
  if (new BigNumber(result).isZero()) {
    const index = findFirstNonZeroDecimalIndex(number)
    const base = new BigNumber(number).toFixed(
      index + POLLY_FILL_DECIMALS,
      roundingMode,
    )
    return formatter ? formatter(base) : base
  } else {
    return formatter ? formatter(result) : result
  }
}

/**
 * Formats a number into a string using dynamic precision based on price sensitivity.
 *
 * - If price is not provided, extends precision to reveal significant decimal digits.
 * - If price is provided, adjusts precision based on half-cent visibility threshold.
 *
 * @param number - A number or string compatible with BigNumber.
 * @param price - (Optional) USD price used to calculate decimal precision.
 * @param formatter - (Optional) A custom formatter function to format the final string.
 * @returns A formatted string with context-aware precision.
 */
export const formatPreciseAmountString = (
  number: BigNumber.Value,
  price?: number,
  formatter?: (value: BigNumber.Value) => string,
): string => {
  if (!price) {
    const index = findFirstNonZeroDecimalIndex(number)
    const base = new BigNumber(number).toFixed(
      index + POLLY_FILL_DECIMALS,
      BigNumber.ROUND_FLOOR,
    )
    return formatter ? formatter(base) : base
  }
  const underHalfPennyDecimals =
    Math.floor(Math.max(-Math.log10(0.005 / price), 0) / 2) * 2
  const base = new BigNumber(number).toFixed(underHalfPennyDecimals)
  return formatter ? formatter(base) : base
}

/**
 * Formats a number into a human-readable string with thousand separators (commas).
 *
 * @param number - A number or string compatible with BigNumber.
 * @returns A string with commas added to the integer portion for readability.
 *          If the number has decimals, they are preserved.
 */
export const formatWithCommas = (number: BigNumber.Value): string => {
  if (number === null || number === undefined) {
    return ''
  }

  const str = number.toString()

  if (str.endsWith('.')) {
    const int = str.slice(0, -1)
    const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return `${formattedInt}.`
  }

  const [int, dec] = str.split('.')
  const negative = int.startsWith('-')
  const digits = negative ? int.slice(1) : int

  const formattedInt = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const withSign = negative ? `-${formattedInt}` : formattedInt

  return dec !== undefined ? `${withSign}.${dec}` : withSign
}
/**
 * Formats a number into a compact string using K/M/B/T suffixes for thousands/millions/etc.
 *
 * For example:
 * - 1234 -> "1.2K"
 * - 1234567 -> "1.2M"
 *
 * @param value - A number or string compatible with BigNumber.
 * @param decimalPlaces - Number of decimal places to retain in the abbreviated value (default: 1).
 * @returns A formatted string representing the abbreviated number with suffix.
 */
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

const removeZeroTail = (number: string) => {
  // 0.001000 -> 0.001
  const parts = number.split('.')
  if (parts.length === 1) {
    return number // no decimal
  }
  const decimal = parts[1]
  let i = decimal.length - 1
  while (decimal[i] === '0') {
    i -= 1
  }
  if (i === -1) {
    return parts[0]
  }
  return `${parts[0]}.${decimal.slice(0, i + 1)}`.replace(/\.$/, '')
}

export const formatTinyNumber = (number: BigNumber.Value): string => {
  const bn = new BigNumber(number)
  const integer = bn.integerValue()
  if (integer.gt(0)) {
    // minimum tick is 0.1bp
    const fractionDigits = findFirstNonZeroDecimalIndex(integer.div(BPS))
    return formatWithCommas(
      removeZeroTail(bn.toFixed(fractionDigits, BigNumber.ROUND_DOWN)),
    )
  }
  const index = findFirstNonZeroDecimalIndex(bn) - 1
  if (index === -1) {
    if (integer.eq(0)) {
      return '0'
    }
    // minimum tick is 0.1bp
    const fractionDigits = findFirstNonZeroDecimalIndex(integer.div(BPS))
    return formatWithCommas(
      removeZeroTail(bn.toFixed(fractionDigits, BigNumber.ROUND_DOWN)),
    )
  }
  if (index <= 3) {
    return formatWithCommas(
      removeZeroTail(
        bn.toFixed(index + 1 + POLLY_FILL_DECIMALS, BigNumber.ROUND_DOWN),
      ),
    )
  }
  const char = TINY_NUMBER_LIST[index]
  return removeZeroTail(
    `0.0${char}` +
      bn
        .toFixed(100, BigNumber.ROUND_DOWN)
        .slice(index + 2, index + 2 + POLLY_FILL_DECIMALS),
  )
}
