import { createPublicClient, getAddress, http, isAddressEqual } from 'viem'

import { FuturesPosition } from '../../model/futures/futures-position'
import { Prices } from '../../model/prices'
import { WHITELISTED_FUTURES_ASSETS } from '../../constants/futures'
import { Asset } from '../../model/futures/asset'
import { calculateLiquidationPrice, calculateLtv } from '../../utils/ltv'
import { Subgraph } from '../../model/subgraph'
import { Chain } from '../../model/chain'
import { CHAIN_CONFIG } from '../../chain-configs'

type PositionDto = {
  id: string
  user: string
  asset: {
    id: string
    assetId: string
    currency: {
      id: string
      name: string
      symbol: string
      decimals: string
    }
    collateral: {
      id: string
      name: string
      symbol: string
      decimals: string
    }
    expiration: string
    maxLTV: string
    liquidationThreshold: string
    minDebt: string
    settlePrice: string
  }
  collateralAmount: string
  debtAmount: string
  averagePrice: string
}

const _abi = [
  {
    type: 'function',
    name: 'getPosition',
    inputs: [
      {
        name: 'debtToken',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'user',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'collateral',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'debt',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
] as const

export const fetchFuturesPositions = async (
  chain: Chain,
  userAddress: `0x${string}`,
  prices: Prices,
  assets: Asset[],
): Promise<FuturesPosition[]> => {
  const publicClient = createPublicClient({
    chain,
    transport: http(CHAIN_CONFIG.RPC_URL),
  })

  const {
    data: { positions },
  } = await Subgraph.get<{
    data: {
      positions: PositionDto[]
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.FUTURES,
    'getPositions',
    'query getPositions($userAddress: String!) { positions (where: {user: $userAddress }) { id user asset { id assetId currency { id name symbol decimals } collateral { id name symbol decimals } expiration maxLTV settlePrice liquidationThreshold minDebt } collateralAmount debtAmount averagePrice } }',
    {
      userAddress: userAddress.toLowerCase(),
    },
  )

  const results = await publicClient.multicall({
    contracts: WHITELISTED_FUTURES_ASSETS.map(({ address }) => ({
      address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
      abi: _abi,
      functionName: 'getPosition',
      args: [address, userAddress],
    })),
  })
  return results
    .map((result, index) => {
      const asset = assets.find((asset) =>
        isAddressEqual(
          asset.currency.address,
          WHITELISTED_FUTURES_ASSETS[index].address,
        ),
      )
      if (result.error || !asset) {
        return null
      }
      const offChainPosition = positions.find(
        (position) =>
          `${userAddress.toLowerCase()}-${asset.id.toLowerCase()}` ===
          position.id,
      )
      if (!offChainPosition) {
        return null
      }
      const collateralAmount = BigInt(result.result[0])
      const debtAmount = BigInt(result.result[1])
      return {
        user: getAddress(userAddress),
        asset,
        collateralAmount,
        debtAmount,
        liquidationPrice: calculateLiquidationPrice(
          asset.currency,
          prices[asset.currency.address],
          asset.collateral,
          prices[asset.collateral.address],
          BigInt(debtAmount),
          BigInt(collateralAmount),
          BigInt(asset.liquidationThreshold),
          1000000n,
        ),
        ltv: calculateLtv(
          asset.currency,
          prices[asset.currency.address],
          debtAmount,
          asset.collateral,
          prices[asset.collateral.address],
          collateralAmount,
        ),
        averagePrice: Number(offChainPosition.averagePrice),
      } as FuturesPosition
    })
    .filter(
      (position) =>
        position &&
        position.debtAmount > 0n &&
        prices[position.asset.currency.address] > 0,
    ) as FuturesPosition[]
}
