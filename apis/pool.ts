import { getPool, getPoolSnapshot, getPoolSnapshots } from '@clober/v2-sdk'

import { Chain } from '../model/chain'
import { Prices } from '../model/prices'
import { Pool, PoolSnapshot } from '../model/pool'
import { CHAIN_CONFIG } from '../chain-configs'
import { currentTimestampInSeconds } from '../utils/date'
import { calculateApy } from '../utils/apy'

export async function fetchPoolSnapshots(chain: Chain) {
  const poolSnapshots = await getPoolSnapshots({
    chainId: chain.id,
  })
  const now = currentTimestampInSeconds()
  return poolSnapshots
    .filter(({ key }) => CHAIN_CONFIG.WHITELISTED_POOL_KEYS.includes(key))
    .sort((a, b) => Number(b.volumeUSD24h) - Number(a.volumeUSD24h))
    .map((poolSnapshot) => {
      const lastPerformanceHistory =
        poolSnapshot.performanceHistories.slice(-1)[0]
      const onHoldUSDValuePerLp =
        (Number(poolSnapshot.initialLPInfo.currencyA.value) *
          lastPerformanceHistory.priceAUSD +
          Number(poolSnapshot.initialLPInfo.currencyB.value) *
            lastPerformanceHistory.priceBUSD) /
        Number(poolSnapshot.initialLPInfo.lpToken.value)

      return {
        ...poolSnapshot,
        apy: calculateApy(
          Number(poolSnapshot.lpPriceUSD) / onHoldUSDValuePerLp,
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
  const lastPerformanceHistory = poolSnapshot.performanceHistories.slice(-1)[0]
  const onHoldUSDValuePerLp =
    (Number(poolSnapshot.initialLPInfo.currencyA.value) *
      lastPerformanceHistory.priceAUSD +
      Number(poolSnapshot.initialLPInfo.currencyB.value) *
        lastPerformanceHistory.priceBUSD) /
    Number(poolSnapshot.initialLPInfo.lpToken.value)

  const apy = calculateApy(
    Number(poolSnapshot.lpPriceUSD) / onHoldUSDValuePerLp,
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
