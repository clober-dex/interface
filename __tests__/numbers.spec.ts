import BigNumber from 'bignumber.js'

import {
  findFirstNonZeroIndex,
  formatSignificantString,
} from '../utils/bignumber'
import {
  removeZeroTail,
  toHumanReadableString,
  toShortNumber,
} from '../utils/number'

describe('Numbers', () => {
  it('findFirstNonZeroIndex', () => {
    expect(findFirstNonZeroIndex(1111.1023123)).toBe(1)
    expect(findFirstNonZeroIndex(0.1023123)).toBe(1)
    expect(findFirstNonZeroIndex(0.01023123)).toBe(2)
    expect(findFirstNonZeroIndex(0)).toBe(0)
    expect(findFirstNonZeroIndex(1000000)).toBe(0)
    expect(findFirstNonZeroIndex(123)).toBe(0)
    expect(findFirstNonZeroIndex(1.23)).toBe(1)
    expect(findFirstNonZeroIndex(123.000000123)).toBe(7)
  })

  it('removeZeroTail', () => {
    expect(removeZeroTail('1111.30010000')).toBe('1111.3001')
    expect(removeZeroTail('123')).toBe('123')
    expect(removeZeroTail('123.000')).toBe('123')
    expect(removeZeroTail('0.000')).toBe('0')
    expect(removeZeroTail('0.0001')).toBe('0.0001')
    expect(removeZeroTail('0.0001000')).toBe('0.0001')
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
    expect(toShortNumber(10000.001234566)).toBe('10,000')
    expect(toShortNumber(10000.1234566)).toBe('10,000.1')
    expect(toShortNumber(10000.123)).toBe('10,000.1')
    expect(toShortNumber(10000)).toBe('10,000')
    expect(toShortNumber(1000)).toBe('1,000')
    expect(toShortNumber(100)).toBe('100')
    expect(toShortNumber(10)).toBe('10')
    expect(toShortNumber(1)).toBe('1')
    expect(toShortNumber(1.23)).toBe('1.23')
    expect(toShortNumber(0)).toBe('0')
    expect(toShortNumber(0.1)).toBe('0.1')
    expect(toShortNumber(0.01)).toBe('0.01')
    expect(toShortNumber(0.001)).toBe('0.001')
    expect(toShortNumber(0.0001)).toBe('0.0001')
    expect(toShortNumber(0.00001)).toBe('0.0₄1')
    expect(toShortNumber(0.000001)).toBe('0.0₅1')
    expect(toShortNumber(0.0000001)).toBe('0.0₆1')
  })

  it('toDollarString', () => {
    expect(toHumanReadableString(new BigNumber(100000000))).toBe('100.0M')
    expect(toHumanReadableString(new BigNumber(10000000))).toBe('10.0M')
    expect(toHumanReadableString(new BigNumber(1000000))).toBe('1.0M')
    expect(toHumanReadableString(new BigNumber(100000))).toBe('100.0K')
  })
})
