import BigNumber from 'bignumber.js'
import { getAddress, isAddressEqual } from 'viem'

import { Subgraph } from '../model/subgraph'
import { currentTimestampInSeconds } from '../utils/date'
import { formatUnits } from '../utils/bigint'
import { CHAIN_CONFIG } from '../chain-configs'

const CONSTANTS: {
  [key: string]: {
    START_AT: number
    POINT_PER_SECOND: number
  }
} = {
  ['0xad46920833ad7a1ba8e74cc241faf9ae4fd3dc4616ad9648b13160f8453e444f']: {
    START_AT: 1743465600,
    POINT_PER_SECOND: 0.000001,
  },
}

export async function fetchLiquidVaultPoint(
  userAddress: `0x${string}`,
): Promise<number> {
  const {
    data: { user: liquidityVaultPoint },
  } = await Subgraph.get<{
    data: {
      user: {
        id: string
        vaultBalances: {
          amount: string
          updatedAt: string
          pool: { id: string }
        }[]
        accumulatedPoints: string
      }
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.LIQUIDITY_VAULT_POINT,
    'getPoint',
    'query getPointByUserAddress($userAddress: ID!) { user(id: $userAddress) { id vaultBalances { amount pool { id } updatedAt } accumulatedPoints } }',
    {
      userAddress: userAddress.toLowerCase(),
    },
  )
  const now = currentTimestampInSeconds()
  return liquidityVaultPoint.vaultBalances.reduce((acc, vaultBalance) => {
    const startedAt = CONSTANTS?.[vaultBalance.pool.id]?.START_AT ?? 0
    const pointsPerSecond =
      CONSTANTS?.[vaultBalance.pool.id]?.POINT_PER_SECOND ?? 0
    if (startedAt === 0 || pointsPerSecond === 0 || startedAt > now) {
      return acc
    }
    const timeDelta = now - Math.max(Number(vaultBalance.updatedAt), startedAt)
    const point = new BigNumber(vaultBalance.amount)
      .times(timeDelta)
      .times(pointsPerSecond)
      .div('1000000000000000000')
      .toNumber()
    return acc + point
  }, Number(liquidityVaultPoint.accumulatedPoints))
}

export async function fetchLiquidVaultBalanceLeaderboard(): Promise<
  {
    address: `0x${string}`
    balance: number
  }[]
> {
  const {
    data: { vaultBalances },
  } = await Subgraph.get<{
    data: {
      vaultBalances: {
        user: {
          id: string
        }
        amount: string
      }[]
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.LIQUIDITY_VAULT_POINT,
    '',
    '{ vaultBalances(first: 1000, where: {pool: "0xad46920833ad7a1ba8e74cc241faf9ae4fd3dc4616ad9648b13160f8453e444f"} orderBy: amount orderDirection: desc) { user { id } amount } }',
    {},
  )

  return vaultBalances
    .filter(
      (vaultBalance) =>
        !CHAIN_CONFIG.BLACKLISTED_USERS.some((address) =>
          isAddressEqual(getAddress(vaultBalance.user.id), address),
        ),
    )
    .map((vaultBalance) => ({
      address: getAddress(vaultBalance.user.id),
      balance: Number(formatUnits(BigInt(vaultBalance.amount), 18)),
    }))
}
