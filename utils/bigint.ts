import BigNumber from 'bignumber.js'
import { formatUnits as _formatUnits } from 'viem'

import { formatAbbreviatedNumberString } from './bignumber'

export const max = (...args: bigint[]) =>
  args.reduce((m, e) => (e > m ? e : m), 0n)
export const min = (...args: bigint[]) =>
  args.reduce((m, e) => (e < m ? e : m), 2n ** 256n - 1n)

/**
 * Calculates the dollar value of a token amount using its price and decimals.
 * @dev: This function assumes the price is given in USD per whole token, not per unit of the smallest denomination.
 *
 * @param value - The token amount as a bigint.
 * @param decimals - The number of decimals the token uses.
 * @param price - The USD price per one whole token.
 * @returns The USD value as a BigNumber.
 */
export const getDollarValue = (
  value: bigint,
  decimals: number,
  price?: number,
): BigNumber => {
  if (!price) {
    return new BigNumber(0)
  }
  return new BigNumber(value.toString()).times(price).div(10 ** decimals)
}

/**
 * Formats the dollar value of a token amount into a human-readable USD string with commas and two decimal places.
 *
 * @param value - The token amount as a bigint.
 * @param decimals - The number of decimals the token uses.
 * @param price - The USD price per one whole token.
 * @returns A string representing the formatted dollar value, prefixed with "$".
 */
export const formatDollarValue = (
  value: bigint,
  decimals: number,
  price?: number,
): string => {
  return `$${formatAbbreviatedNumberString(getDollarValue(value, decimals, price).toFixed(2))}`
}

/**
 * Converts a bigint token amount to a decimal string, formatted based on price precision.
 *
 * - If no price is provided, it uses dynamic precision based on significant digits.
 * - If price is provided, it calculates precision based on half-cent sensitivity.
 *  @dev: The returned string can safely be wrapped with `Number(...)` for approximate numeric use,
 *   but note that very large or very small values may lose precision.
 *
 * @param value - The token amount as a bigint.
 * @param decimals - The number of decimals the token uses.
 * @param price - (Optional) The USD price used to determine appropriate decimal precision.
 * @param formatter - (Optional) A custom formatter function to format the final string.
 * @returns A formatted string representing the token amount.
 */
export const formatUnits = (
  value: bigint,
  decimals: number,
  price?: number,
  formatter?: (value: BigNumber.Value) => string,
): string => {
  const formatted = _formatUnits(value, decimals)
  if (!price) {
    return formatter ? formatter(formatted) : formatted
  }
  const underHalfPennyDecimals =
    Math.floor(Math.max(-Math.log10(0.005 / price), 0) / 2) * 2
  const base = new BigNumber(formatted).toFixed(underHalfPennyDecimals)
  return formatter ? formatter(base) : base
  // see if we can avoid trailing zeroes
  // return +fixed === 0 ? formatted : fixed
}

export const applyPercent = (
  amount: bigint,
  percent: number,
  decimal: number = 5,
): bigint => {
  return (
    (amount * BigInt(Math.floor(percent * 10 ** decimal))) /
    BigInt(100 * 10 ** decimal)
  )
}
