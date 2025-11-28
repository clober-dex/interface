import { getAddress } from 'viem'

import { Prices } from '../../model/prices'
import { aggregators } from '../../chain-configs/aggregators'

export async function fetchPrices(): Promise<Prices> {
  const prices = (
    await Promise.allSettled(
      aggregators.map((aggregator) => aggregator.prices()),
    )
  )
    .map((result) => (result.status === 'fulfilled' ? result.value : undefined))
    .filter(
      (price): price is Prices =>
        price !== undefined && Object.keys(price).length > 0,
    )
  return prices.reduce((acc, prices) => {
    Object.entries(prices).forEach(([address, price]) => {
      if (price > 0) {
        acc[getAddress(address)] = price
      }
    })
    Object.entries(prices).forEach(([address, price]) => {
      if (price > 0) {
        acc[address.toLowerCase() as `0x${string}`] = price
      }
    })
    return acc
  }, {} as Prices)
}
