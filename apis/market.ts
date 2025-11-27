import {
  createPublicClient,
  erc20Abi,
  http,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { getMarketId, CHAIN_IDS, getReferenceCurrency } from '@clober/v2-sdk'

import { Chain } from '../model/chain'
import { CHAIN_CONFIG } from '../chain-configs'
import { Currency } from '../model/currency'

import { fetchApi } from './utils'

const decimalsCache: { [address: string]: number } = {
  [zeroAddress]: 18,
}

type ExternalMarketSnapshot = {
  chainId: CHAIN_IDS
  marketId: string
  base: Currency
  quote: Currency
  price: number
  priceUSD: number
  volume24hUSD: number
  buyVolume24hUSD: number
  sellVolume24hUSD: number
  totalValueLockedUSD: number
  priceChange24h: number
  createdAtTimestamp: number
  fdv: number
  marketCap: number
}

export async function fetchExternalMarketSnapshots(
  chain: Chain,
  currencies: Currency[],
): Promise<ExternalMarketSnapshot[]> {
  const publicClient = createPublicClient({
    chain,
    transport: http(CHAIN_CONFIG.RPC_URL),
  })

  try {
    const qs = new URLSearchParams({
      include: 'dex%2Cdex.network%2Cdex.network.network_metric%2Ctokens',
      sort: '-6h_trend_score',
      networks: chain.name.toLowerCase(),
      include_network_metrics: 'false',
    })

    const { included, data } = await fetchApi<{
      data: {
        type: string
        id: string
        attributes: {
          price_percent_change: string // "+32.54%"
          price_in_usd: string
          reserve_in_usd: string
          pool_created_at: string // 2025-11-24T14:04:12.000Z
          net_volume_data_24h: {
            buy_volume_in_usd: string
            sell_volume_in_usd: string
          }
          token_value_data: {
            [key: string]: {
              fdv_in_usd: string
              market_cap_in_usd: string
              market_cap_to_holders_ratio: string
            }
          }
        }
        relationships: { tokens: { data: { id: string; type: 'token' }[] } }
      }[]
      included: {
        type: string
        id: string
        attributes: {
          address: string
          name: string
          symbol: string
          image_url: string
        }
      }[]
    }>('/api/proxy', '', {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      timeout: 2000,
      params: {
        url: `https://app.geckoterminal.com/api/p1/monad/pools?${qs.toString()}`,
      },
    })

    const tokenAddresses = included
      .filter((item) => item.type === 'token')
      .map((token) => token.attributes.address.toLowerCase())
      .filter((address, index, self) => self.indexOf(address) === index)
      .filter((address) => !decimalsCache[address])

    const currencyMap = currencies.reduce<{ [address: string]: Currency }>(
      (acc, currency) => {
        acc[currency.address.toLowerCase()] = currency
        return acc
      },
      {},
    )

    const results =
      tokenAddresses.length > 0
        ? await publicClient.multicall({
            contracts: tokenAddresses.map((address) => ({
              address: address as `0x${string}`,
              abi: erc20Abi,
              functionName: 'decimals',
            })),
            allowFailure: true,
          })
        : []

    // update decimalsCache
    results.forEach((res, index) => {
      const address = tokenAddresses[index]
      if (res.status === 'success') {
        decimalsCache[address] = Number(res.result)
      }
    })

    const tokens: {
      [id: string]: {
        address: string
        name: string
        symbol: string
        decimals: number
        icon?: string
      }
    } = included.reduce(
      (acc, item) => {
        if (item.type === 'token') {
          const address = item.attributes.address.toLowerCase()
          acc[item.id.toString()] = {
            address,
            name: item.attributes.name,
            symbol: item.attributes.symbol,
            decimals: decimalsCache[address],
            icon: item.attributes.image_url.includes('missing')
              ? undefined
              : item.attributes.image_url,
          }
        }
        return acc
      },
      {} as {
        [id: string]: {
          address: string
          name: string
          symbol: string
          decimals: number
          icon?: string
        }
      },
    )

    const pools = data.map((pool) => {
      const _tokens = pool.relationships.tokens.data.map(
        (t) => tokens[t.id].address as `0x${string}`,
      )
      if (_tokens.length !== 2) {
        return null
      }
      const { marketId, baseTokenAddress, quoteTokenAddress } = getMarketId(
        chain.id,
        _tokens,
      )
      const [baseTokenId, quoteTokenId] = [
        pool.relationships.tokens.data.find(
          (t) =>
            tokens[t.id].address.toLowerCase() ===
            baseTokenAddress.toLowerCase(),
        )?.id!,
        pool.relationships.tokens.data.find(
          (t) =>
            tokens[t.id].address.toLowerCase() ===
            quoteTokenAddress.toLowerCase(),
        )?.id!,
      ]
      const tokenValueData = pool.attributes.token_value_data[baseTokenId]
      const ref = getReferenceCurrency({ chainId: chain.id })
      if (
        isAddressEqual(
          tokens[baseTokenId].address as `0x${string}`,
          ref.address,
        )
      ) {
        return null
      }

      return {
        chainId: chain.id,
        marketId,
        base: {
          ...tokens[baseTokenId],
          icon:
            currencyMap[tokens[baseTokenId].address.toLowerCase()]?.icon ??
            tokens[baseTokenId].icon,
        },
        quote: {
          ...tokens[quoteTokenId],
          icon:
            currencyMap[tokens[quoteTokenId].address.toLowerCase()]?.icon ??
            tokens[quoteTokenId].icon,
        },
        price: -1,
        priceUSD: Number(pool.attributes.price_in_usd),
        volume24hUSD: Number(
          pool.attributes.net_volume_data_24h.buy_volume_in_usd,
        ),
        buyVolume24hUSD: Number(
          pool.attributes.net_volume_data_24h.buy_volume_in_usd,
        ),
        sellVolume24hUSD: Number(
          pool.attributes.net_volume_data_24h.sell_volume_in_usd,
        ),
        totalValueLockedUSD: Number(pool.attributes.reserve_in_usd),
        priceChange24h:
          Number(
            pool.attributes.price_percent_change
              .replace('%', '')
              .replace('+', ''),
          ) / 100,
        createdAtTimestamp: Math.floor(
          new Date(pool.attributes.pool_created_at).getTime() / 1000,
        ),
        fdv: Number(tokenValueData.fdv_in_usd),
        marketCap: Number(tokenValueData.market_cap_in_usd),
      } as ExternalMarketSnapshot
    })

    // merge unique pools by marketId, summing volume24hUSD and totalValueLockedUSD
    return pools
      .filter((pool): pool is ExternalMarketSnapshot => pool !== null)
      .reduce<ExternalMarketSnapshot[]>((acc, pool) => {
        const existing = acc.find((p) => p.marketId === pool.marketId)
        if (existing) {
          existing.price =
            pool.totalValueLockedUSD > existing.totalValueLockedUSD
              ? pool.price
              : existing.price
          existing.priceUSD =
            pool.totalValueLockedUSD > existing.totalValueLockedUSD
              ? pool.priceUSD
              : existing.priceUSD
          existing.volume24hUSD += pool.volume24hUSD
          existing.totalValueLockedUSD += pool.totalValueLockedUSD
          existing.createdAtTimestamp = Math.min(
            existing.createdAtTimestamp,
            pool.createdAtTimestamp,
          )
          existing.marketCap =
            pool.totalValueLockedUSD > existing.totalValueLockedUSD
              ? pool.marketCap
              : existing.marketCap
          existing.fdv =
            pool.totalValueLockedUSD > existing.totalValueLockedUSD
              ? pool.fdv
              : existing.fdv
        } else {
          acc.push(pool)
        }
        return acc
      }, [] as ExternalMarketSnapshot[])
  } catch (error) {
    console.error('Error fetching external market snapshots:', error)
  }
  return [] as ExternalMarketSnapshot[]
}
