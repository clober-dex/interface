import { getPool, getPoolSnapshot, getPoolSnapshots } from '@clober/v2-sdk'
import { getAddress } from 'viem'

import { Chain } from '../model/chain'
import { Prices } from '../model/prices'
import { Pool, PoolSnapshot } from '../model/pool'
import { CHAIN_CONFIG } from '../chain-configs'
import { currentTimestampInSeconds } from '../utils/date'
import { calculateApy } from '../utils/apy'
import { Currency } from '../model/currency'

const getBlacklistedTimestampsForPair = (
  currencyA: Currency,
  currencyB: Currency,
): number[] => {
  const blacklistCurrencies = [
    ...new Set(
      CHAIN_CONFIG.ANALYTICS_VOLUME_BLACKLIST.map((currency) =>
        getAddress(currency.address),
      ),
    ),
  ]
  if (
    blacklistCurrencies.includes(getAddress(currencyA.address)) ||
    blacklistCurrencies.includes(getAddress(currencyB.address))
  ) {
    return [
      ...new Set(
        CHAIN_CONFIG.ANALYTICS_VOLUME_BLACKLIST.map(
          (currency) => currency.timestamp,
        ),
      ),
    ]
  }
  return []
}

export async function fetchPoolSnapshots(chain: Chain) {
  const poolSnapshots = await getPoolSnapshots({
    chainId: chain.id,
  })
  const now = currentTimestampInSeconds()
  return poolSnapshots
    .filter(({ key }) => CHAIN_CONFIG.WHITELISTED_POOL_KEYS.includes(key))
    .sort((a, b) => Number(b.volumeUSD24h) - Number(a.volumeUSD24h))
    .map((poolSnapshot) => {
      const blacklistedTimestamps = getBlacklistedTimestampsForPair(
        poolSnapshot.currencyA,
        poolSnapshot.currencyB,
      )
      const totalSpreadProfitUSD = poolSnapshot.performanceHistories.reduce(
        (acc, performanceHistory) => {
          if (blacklistedTimestamps.includes(performanceHistory.timestamp)) {
            return acc
          }
          return acc + Number(performanceHistory.spreadProfitUSD)
        },
        0,
      )
      return {
        ...poolSnapshot,
        apy: calculateApy(
          1 + totalSpreadProfitUSD / Number(poolSnapshot.totalTvlUSD),
          now - Number(poolSnapshot.initialLPInfo.timestamp),
        ),
      }
    })
}

export async function fetchPool(
  chain: Chain,
  prices: Prices,
  poolKey: `0x${string}`,
): Promise<{ pool: Pool; poolSnapshot: PoolSnapshot }> {
  const poolSnapshot = await getPoolSnapshot({
    chainId: chain.id,
    poolKey,
  })
  const pool = await getPool({
    chainId: chain.id,
    token0: poolSnapshot.currencyA.address,
    token1: poolSnapshot.currencyB.address,
    salt: poolSnapshot.salt,
    options: {
      useSubgraph: true, // doesn't matter since to get pool liquidity, we need to use on-chain call
      rpcUrl: CHAIN_CONFIG.RPC_URL,
    },
  })
  const tvl =
    Number(pool.liquidityA.total.value) *
      prices[pool.liquidityA.total.currency.address] +
    Number(pool.liquidityB.total.value) *
      prices[pool.liquidityB.total.currency.address]
  const now = currentTimestampInSeconds()
  const blacklistedTimestamps = getBlacklistedTimestampsForPair(
    poolSnapshot.currencyA,
    poolSnapshot.currencyB,
  )
  const totalSpreadProfitUSD = poolSnapshot.performanceHistories.reduce(
    (acc, performanceHistory) => {
      if (blacklistedTimestamps.includes(performanceHistory.timestamp)) {
        return acc
      }
      return acc + Number(performanceHistory.spreadProfitUSD)
    },
    0,
  )
  const apy = calculateApy(
    1 + totalSpreadProfitUSD / Number(poolSnapshot.totalTvlUSD),
    now - Number(poolSnapshot.initialLPInfo.timestamp),
  )
  return {
    pool: {
      ...pool,
      lpPriceUSD: tvl / Number(pool.totalSupply.value),
      tvl,
      apy,
    },
    poolSnapshot: {
      ...poolSnapshot,
      apy,
    },
  }
}
