import BigNumber from 'bignumber.js'

import {
  findFirstNonZeroDecimalIndex,
  formatAbbreviatedNumberString,
  formatSignificantString,
  formatTinyNumber,
} from '../utils/bignumber'

describe('Numbers', () => {
  it('findFirstNonZeroIndex', () => {
    expect(findFirstNonZeroDecimalIndex(1111.1023123)).toBe(1)
    expect(findFirstNonZeroDecimalIndex(0.1023123)).toBe(1)
    expect(findFirstNonZeroDecimalIndex(0.01023123)).toBe(2)
    expect(findFirstNonZeroDecimalIndex(0)).toBe(0)
    expect(findFirstNonZeroDecimalIndex(1000000)).toBe(0)
    expect(findFirstNonZeroDecimalIndex(123)).toBe(0)
    expect(findFirstNonZeroDecimalIndex(1.23)).toBe(1)
    expect(findFirstNonZeroDecimalIndex(123.000000123)).toBe(7)
  })

  it('toPlacesString', () => {
    expect(formatSignificantString(1111.1023123)).toBe('1111.1023')
    expect(formatSignificantString(0.00000000001023123)).toBe(
      '0.000000000010231',
    )
    expect(formatSignificantString(1110.000001023123)).toBe('1110.0000')
    expect(formatSignificantString(0.1023123)).toBe('0.1023')
    expect(formatSignificantString(0.01023123)).toBe('0.0102')
    expect(formatSignificantString(0)).toBe('0.0000')
    expect(formatSignificantString(1000000)).toBe('1000000.0000')
    expect(formatSignificantString(123)).toBe('123.0000')
    expect(formatSignificantString(123.000000123)).toBe('123.0000')
  })

  it('toShortNumber', () => {
    expect(formatTinyNumber(10000.001234566)).toBe('10,000')
    expect(formatTinyNumber(10000.1234566)).toBe('10,000')
    expect(formatTinyNumber(10000.123)).toBe('10,000')
    expect(formatTinyNumber(10000)).toBe('10,000')
    expect(formatTinyNumber(1000)).toBe('1,000')
    expect(formatTinyNumber(100)).toBe('100')
    expect(formatTinyNumber(10)).toBe('10')
    expect(formatTinyNumber(1)).toBe('1')
    expect(formatTinyNumber(1.23)).toBe('1.23')
    expect(formatTinyNumber(0)).toBe('0')
    expect(formatTinyNumber(0.1)).toBe('0.1')
    expect(formatTinyNumber(0.01)).toBe('0.01')
    expect(formatTinyNumber(0.001)).toBe('0.001')
    expect(formatTinyNumber(0.0001)).toBe('0.0001')
    expect(formatTinyNumber(0.00001)).toBe('0.0₄1')
    expect(formatTinyNumber(0.000001)).toBe('0.0₅1')
    expect(formatTinyNumber(0.0000001)).toBe('0.0₆1')
  })

  it('toDollarString', () => {
    expect(formatAbbreviatedNumberString(new BigNumber(100000000))).toBe(
      '100.0M',
    )
    expect(formatAbbreviatedNumberString(new BigNumber(10000000))).toBe('10.0M')
    expect(formatAbbreviatedNumberString(new BigNumber(1000000))).toBe('1.0M')
    expect(formatAbbreviatedNumberString(new BigNumber(100000))).toBe('100.0K')
  })
})
