import { getAddress, isAddressEqual } from 'viem'

import { Asset } from '../../model/futures/asset'
import { Subgraph } from '../../model/subgraph'
import { CHAIN_CONFIG } from '../../chain-configs'
import { applyPercent } from '../../utils/bigint'

type AssetDto = {
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

const DEFAULT_COLLATERAL = {
  ...CHAIN_CONFIG.DEFAULT_STABLE_COIN_CURRENCY,
  priceFeedId:
    '0x41f3625971ca2ed2263e78573fe5ce23e13d2558ed3f2e47ab0f84fb9e7ae722',
}

export const fetchFuturesAssets = async (): Promise<Asset[]> => {
  const {
    data: { assets },
  } = await Subgraph.get<{
    data: {
      assets: AssetDto[]
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.TRADING_COMPETITION_SEASON2,
    'getAssets',
    'query getAssets { assets { id assetId currency { id name symbol decimals } collateral { id name symbol decimals } expiration maxLTV liquidationThreshold minDebt settlePrice } }',
    {},
  )
  return assets
    .map((asset) => {
      const currency = CHAIN_CONFIG.WHITELISTED_CURRENCIES.find((currency) =>
        isAddressEqual(currency.address, getAddress(asset.currency.id)),
      )
      if (
        !currency ||
        !isAddressEqual(
          DEFAULT_COLLATERAL.address,
          getAddress(asset.collateral.id),
        )
      ) {
        return undefined
      }
      return {
        id: getAddress(asset.id),
        currency: {
          address: getAddress(asset.currency.id),
          name: asset.currency.name,
          symbol: asset.currency.symbol,
          decimals: Number(asset.currency.decimals),
          priceFeedId: asset.assetId as `0x${string}`,
          icon: currency.icon,
        },
        collateral: DEFAULT_COLLATERAL,
        expiration: Number(asset.expiration),
        maxLTV: applyPercent(BigInt(asset.maxLTV), 98), // @dev: Use 98% of maxLTV as the effective LTV
        liquidationThreshold: BigInt(asset.liquidationThreshold),
        ltvPrecision: 1000000n,
        minDebt: BigInt(asset.minDebt),
        settlePrice: Number(asset.settlePrice),
      }
    })
    .filter((asset) => asset !== undefined) as Asset[]
}
