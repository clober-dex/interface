import { NextApiRequest, NextApiResponse } from 'next'
import {
  formatUnits,
  getAddress,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import BigNumber from 'bignumber.js'

import { CHAIN_CONFIG } from '../../../../chain-configs'
import { fetchCurrency } from '../../../../utils/currency'
import { Currency } from '../../../../model/currency'
import { aggregators } from '../../../../chain-configs/aggregators'

const cache: {
  [key: string]: Currency
} = {}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  try {
    const query = req.query
    // eslint-disable-next-line prefer-const
    let { token } = query
    if (!token || typeof token !== 'string') {
      res.json({
        status: 'error',
        message: 'URL should be /api/price/[token]',
      })
      return
    }
    if (!isAddress(token)) {
      res.json({
        status: 'error',
        message: 'Invalid address',
      })
      return
    }

    if (
      isAddressEqual(
        getAddress(token),
        CHAIN_CONFIG.DEFAULT_STABLE_COIN_CURRENCY.address,
      )
    ) {
      res.status(200).json({
        usdPrice: '1',
        source: [],
      })
      return
    }

    if (!cache[token]) {
      const currency = isAddressEqual(getAddress(token), zeroAddress)
        ? { address: zeroAddress, ...CHAIN_CONFIG.CHAIN.nativeCurrency }
        : await fetchCurrency(CHAIN_CONFIG.CHAIN, getAddress(token))
      if (!currency) {
        res.json({
          status: 'error',
          message: 'Token not found',
        })
        return
      }
      cache[token] = currency
    }

    const results = (
      await Promise.allSettled(
        aggregators.map(async (aggregator) =>
          aggregator.quote(
            CHAIN_CONFIG.DEFAULT_STABLE_COIN_CURRENCY,
            10n ** BigInt(CHAIN_CONFIG.DEFAULT_STABLE_COIN_CURRENCY.decimals),
            cache[token as string] as Currency,
            1,
            1n,
            zeroAddress,
            2000,
            false, // estimateGas
          ),
        ),
      )
    )
      .map((result) =>
        result.status === 'fulfilled' ? result.value : undefined,
      )
      .filter(
        (quote): quote is any => quote !== undefined && quote.amountOut > 0n,
      )
      .map((quote) => ({
        usdPrice: new BigNumber(1)
          .div(formatUnits(quote.amountOut, cache[token as string].decimals))
          .toFixed(18),
        aggregator: quote.aggregator.name,
        executionMilliseconds: quote.executionMilliseconds,
      }))
      .sort((a, b) => Number(a.usdPrice) - Number(b.usdPrice))

    res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate=1')
    res.status(200).json({
      usdPrice: results.length > 0 ? results[0].usdPrice : '0',
      currency: cache[token as string],
      source: results,
    })
  } catch (error) {
    console.error('fetchTokenInfo error', error)
    res.json({
      status: 'error',
      message: 'Internal server error',
    })
  }
}
