import { CHAIN_IDS, getQuoteToken } from '@clober/v2-sdk'
import { getAddress, isAddressEqual, parseUnits } from 'viem'
import BigNumber from 'bignumber.js'
import { EvmPriceServiceConnection, PriceFeed } from '@pythnetwork/pyth-evm-js'

import { aggregators } from '../chain-configs/aggregators'
import { toUnitString } from '../utils/bigint'
import { Currency } from '../model/currency'
import { Prices } from '../model/prices'
import { CHAIN_CONFIG } from '../chain-configs'

import { fetchAllQuotesAndSelectBestBeforeFeeAdjustment } from './swap/quote'

export const fetchPrice = async (
  chainId: CHAIN_IDS,
  currency0: Currency,
  currency1: Currency,
  gasPrice: bigint,
  prices: Prices,
): Promise<BigNumber> => {
  const quoteToken = getQuoteToken({
    chainId,
    token0: currency0.address,
    token1: currency1.address,
  })
  const [quoteCurrency, baseCurrency] = isAddressEqual(
    quoteToken,
    currency0.address,
  )
    ? [currency0, currency1]
    : [currency1, currency0]
  const TARGET_USD_AMOUNT = 100 // USD
  const amountIn = new BigNumber(TARGET_USD_AMOUNT).div(
    prices[baseCurrency.address] ? prices[baseCurrency.address] : 1,
  )
  try {
    const { best } = await fetchAllQuotesAndSelectBestBeforeFeeAdjustment(
      aggregators.filter((aggregator) => aggregator.supportsPriceCalculation),
      baseCurrency,
      BigInt(
        amountIn
          .multipliedBy(parseUnits('1', baseCurrency.decimals))
          .toFixed(0),
      ),
      quoteCurrency,
      5,
      gasPrice,
      {}, // arbitrary prices
    )
    const amountOut = new BigNumber(
      toUnitString(best?.amountOut ?? 0n, quoteCurrency.decimals),
    )
    return amountOut.div(amountIn)
  } catch (e) {
    console.error(e)
    return new BigNumber(0)
  }
}

export const fetchPricesFromPyth = async (
  chainId: CHAIN_IDS,
  priceFeedIdList: {
    priceFeedId: `0x${string}`
    address: `0x${string}`
  }[],
): Promise<Prices> => {
  priceFeedIdList = priceFeedIdList.filter(
    ({ address }, index, self) =>
      index ===
      self.findIndex(({ address: _address }) =>
        isAddressEqual(_address as `0x${string}`, address as `0x${string}`),
      ),
  )
  if (priceFeedIdList.length === 0) {
    return {} as Prices
  }
  const pythPriceService = new EvmPriceServiceConnection(
    CHAIN_CONFIG.PYTH_HERMES_ENDPOINT,
  )
  const prices: PriceFeed[] | undefined =
    await pythPriceService.getLatestPriceFeeds(
      priceFeedIdList.map((id) => id.priceFeedId),
    )
  if (prices === undefined) {
    return {}
  }
  return prices.reduce((acc, priceFeed, index) => {
    const price = priceFeed.getPriceUnchecked()
    const key = priceFeedIdList[index]
    return {
      ...acc,
      [key.address.toLowerCase()]: price.getPriceAsNumberUnchecked(),
      [getAddress(key.address.toLowerCase())]:
        price.getPriceAsNumberUnchecked(),
    }
  }, {} as Prices)
}
