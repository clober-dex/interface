import BigNumber from 'bignumber.js'

import { findFirstNonZeroIndex, formatWithCommas } from './bignumber'

export const POLLY_FILL_DECIMALS = 4

export const removeZeroTail = (number: string) => {
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

export const toShortNumber = (number: BigNumber.Value): string => {
  const bn = new BigNumber(number)
  const integer = bn.integerValue()
  if (integer.gt(0)) {
    // minimum tick is 0.1bp
    const fractionDigits = findFirstNonZeroIndex(integer.div(100000))
    return formatWithCommas(
      removeZeroTail(bn.toFixed(fractionDigits, BigNumber.ROUND_DOWN)),
    )
  }
  const index = findFirstNonZeroIndex(bn) - 1
  if (index === -1) {
    if (integer.eq(0)) {
      return '0'
    }
    // minimum tick is 0.1bp
    const fractionDigits = findFirstNonZeroIndex(integer.div(100000))
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
  const list = [
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
  const char = list[index]
  return removeZeroTail(
    `0.0${char}` +
      bn
        .toFixed(100, BigNumber.ROUND_DOWN)
        .slice(index + 2, index + 2 + POLLY_FILL_DECIMALS),
  )
}
