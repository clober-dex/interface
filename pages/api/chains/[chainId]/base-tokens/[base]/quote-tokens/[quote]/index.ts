import { NextApiRequest, NextApiResponse } from 'next'
import { getAddress, isAddress, isAddressEqual, zeroAddress } from 'viem'
import axios from 'axios'
import { getReferenceCurrency } from '@clober/v2-sdk'

import { TokenInfo } from '../../../../../../../../model/token-info'

type PairDto = {
  pairAddress: string
  baseToken: { address: string }
  quoteToken: { address: string }
  priceNative: string
  priceUsd: string
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  fdv: number
  marketCap: number
  pairCreatedAt: number
  info: {
    imageUrl: string
    websites: {
      label: string
      url: string
    }[]
    socials: {
      type: string
      url: string
    }[]
  }
}

const cache: {
  [key: string]: { tokenInfo: TokenInfo | undefined; timestamp: number }
} = {}

const buildTokenInfo = (pairs: PairDto[]): TokenInfo => {
  const mainPair = pairs.sort((a, b) => b.volume.h24 - a.volume.h24)[0]

  return {
    volume24hUSD: pairs.reduce((acc, pair) => acc + pair?.volume?.h24 || 0, 0),
    totalValueLockedUSD: pairs.reduce(
      (acc, pair) => acc + pair?.liquidity?.usd || 0,
      0,
    ),
    price: Number(mainPair?.priceNative ?? 0),
    priceUsd: Number(mainPair?.priceUsd ?? 0),
    fdv: mainPair?.fdv ?? 0,
    marketCap: mainPair?.marketCap ?? 0,
    website: mainPair?.info?.websites?.[0]?.url ?? '',
    twitter:
      mainPair?.info?.socials.find((social) => social.type === 'twitter')
        ?.url ?? '',
    telegram:
      mainPair?.info?.socials.find((social) => social.type === 'telegram')
        ?.url ?? '',
    pairAddress:
      mainPair && mainPair.pairAddress && isAddress(mainPair.pairAddress)
        ? getAddress(mainPair.pairAddress)
        : null,
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  try {
    const query = req.query
    // eslint-disable-next-line prefer-const
    let { chainId, base, quote } = query
    if (
      !chainId ||
      !base ||
      !quote ||
      typeof chainId !== 'string' ||
      typeof base !== 'string' ||
      typeof quote !== 'string'
    ) {
      res.json({
        status: 'error',
        message:
          'URL should be /api/chains/[chainId]/base-tokens/[base]/quote-tokens/[quote]',
      })
      return
    }
    if (!isAddress(base) && !isAddress(quote)) {
      res.json({
        status: 'error',
        message: 'Invalid address',
      })
      return
    }

    const id = Number(chainId)
    const referenceCurrency = getReferenceCurrency({ chainId: id })
    const baseAddress = getAddress(
      isAddressEqual(getAddress(base), zeroAddress)
        ? referenceCurrency.address
        : base,
    )
    const quoteAddress = getAddress(
      isAddressEqual(getAddress(quote), zeroAddress)
        ? referenceCurrency.address
        : quote,
    )

    const key = `${baseAddress}-${quoteAddress}`
    if (cache[key] && Date.now() - cache[key].timestamp < 1000 * 3) {
      res.json({ tokenInfo: cache[key].tokenInfo })
      return
    }

    const {
      data: { pairs },
    } = (await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${baseAddress}`,
    )) as {
      data: { pairs: PairDto[] }
    }

    const filterPairs = (pairs ?? []).filter(
      (pair) =>
        isAddressEqual(getAddress(pair.baseToken.address), baseAddress) &&
        isAddressEqual(getAddress(pair.quoteToken.address), quoteAddress),
    )
    if (filterPairs.length === 0) {
      const filterPairsByBase = (pairs ?? []).filter((pair) =>
        isAddressEqual(getAddress(pair.baseToken.address), baseAddress),
      )
      if (filterPairsByBase.length === 0) {
        res.json({
          status: 'error',
          message: 'Pair not found',
        })
        return
      }
      const tokenInfo = buildTokenInfo(filterPairsByBase)
      cache[key] = {
        tokenInfo,
        timestamp: Date.now(),
      }
      res.json({
        tokenInfo,
      })
      return
    }

    const tokenInfo = buildTokenInfo(filterPairs)
    cache[key] = {
      tokenInfo,
      timestamp: Date.now(),
    }
    res.json({
      tokenInfo,
    })
  } catch (error) {
    console.error('fetchTokenInfo error', error)
    res.json({
      status: 'error',
      message: 'Internal server error',
    })
  }
}
