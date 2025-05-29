import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getMarket,
  getMarketId,
  getMarketSnapshot,
  getQuoteToken,
  Market,
  MarketSnapshot,
} from '@clober/v2-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { getAddress, isAddressEqual } from 'viem'
import { useGasPrice } from 'wagmi'

import { isMarketEqual } from '../../utils/market'
import { isOrderBookEqual, parseDepth } from '../../utils/order-book'
import { formatToCloberPriceString, getPriceDecimals } from '../../utils/prices'
import {
  Decimals,
  DEFAULT_DECIMAL_PLACE_GROUP_LENGTH,
} from '../../model/decimals'
import { useChainContext } from '../chain-context'
import { CHAIN_CONFIG } from '../../chain-configs'
import { fetchPrice } from '../../apis/price'
import { Currency } from '../../model/currency'
import { fetchTokenInfo } from '../../apis/token'
import { TokenInfo } from '../../model/token-info'

import { useTradeContext } from './trade-context'

type MarketContext = {
  selectedMarket?: Market
  selectedMarketSnapshot: MarketSnapshot | undefined | null
  selectedTokenInfo: TokenInfo | undefined | null
  setSelectedMarket: (market: Market | undefined) => void
  selectedDecimalPlaces: Decimals | undefined
  onChainPrice: number
  setSelectedDecimalPlaces: (decimalPlaces: Decimals | undefined) => void
  availableDecimalPlacesGroups: Decimals[] | null
  depthClickedIndex:
    | {
        isBid: boolean
        index: number
      }
    | undefined
  setDepthClickedIndex: (
    depthClickedIndex:
      | {
          isBid: boolean
          index: number
        }
      | undefined,
  ) => void
  bids: {
    price: string
    size: string
  }[]
  asks: {
    price: string
    size: string
  }[]
  setMarketRateAction: () => Promise<void>
  priceDeviationPercent: number
  quoteCurrency: Currency | undefined
  baseCurrency: Currency | undefined
}

const Context = React.createContext<MarketContext>({
  selectedMarket: {} as Market,
  selectedMarketSnapshot: {} as MarketSnapshot,
  selectedTokenInfo: undefined,
  setSelectedMarket: (_) => _,
  selectedDecimalPlaces: undefined,
  setSelectedDecimalPlaces: () => {},
  onChainPrice: 0,
  availableDecimalPlacesGroups: null,
  depthClickedIndex: undefined,
  setDepthClickedIndex: () => {},
  bids: [],
  asks: [],
  setMarketRateAction: async () => {
    return Promise.resolve()
  },
  priceDeviationPercent: 0,
  quoteCurrency: undefined,
  baseCurrency: undefined,
})

export const MarketProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { data: gasPrice } = useGasPrice()
  const { selectedChain } = useChainContext()
  const queryClient = useQueryClient()
  const {
    isBid,
    setPriceInput,
    priceInput,
    inputCurrency,
    outputCurrency,
    setIsFetchingOnChainPrice,
  } = useTradeContext()

  const previousValue = useRef({
    inputCurrencyAddress: inputCurrency?.address,
    outputCurrencyAddress: outputCurrency?.address,
  })

  const [onChainPrice, setOnChainPrice] = useState(0)
  const [selectedDecimalPlaces, setSelectedDecimalPlaces] = useState<
    Decimals | undefined
  >(undefined)
  const [selectedMarket, setSelectedMarket] = useState<Market | undefined>(
    undefined,
  )
  const [selectedMarketSnapshot, setSelectedMarketSnapshot] = useState<
    // null means market is not found, undefined means market is loading
    MarketSnapshot | undefined | null
  >(undefined)
  const [selectedTokenInfo, setSelectedTokenInfo] = useState<
    // null means market is not found, undefined means market is loading
    TokenInfo | undefined | null
  >(undefined)
  const [depthClickedIndex, setDepthClickedIndex] = useState<
    | {
        isBid: boolean
        index: number
      }
    | undefined
  >(undefined)

  const priceDeviationPercent = useMemo(
    () =>
      (isBid
        ? new BigNumber(onChainPrice).dividedBy(priceInput).minus(1).times(100)
        : new BigNumber(priceInput).dividedBy(onChainPrice).minus(1).times(100)
      ).toNumber(),
    [isBid, onChainPrice, priceInput],
  )

  const [quoteCurrency, baseCurrency, marketId] = useMemo(() => {
    if (inputCurrency && outputCurrency) {
      const quote = getQuoteToken({
        chainId: selectedChain.id,
        token0: inputCurrency.address,
        token1: outputCurrency.address,
      })
      const [quoteCurrency, baseCurrency] = isAddressEqual(
        quote,
        inputCurrency.address,
      )
        ? [inputCurrency, outputCurrency]
        : [outputCurrency, inputCurrency]
      return [
        quoteCurrency,
        baseCurrency,
        getMarketId(selectedChain.id, [
          quoteCurrency.address,
          baseCurrency.address,
        ]).marketId,
      ]
    } else {
      return [undefined, undefined, '']
    }
  }, [inputCurrency, outputCurrency, selectedChain.id])

  const { data } = useQuery({
    queryKey: ['market', selectedChain.id, marketId],
    queryFn: async () => {
      if (baseCurrency?.address && quoteCurrency?.address) {
        const queryKeys = queryClient
          .getQueryCache()
          .getAll()
          .map((query) => query.queryKey)
          .filter((key) => key[0] === 'market')
        for (const key of queryKeys) {
          if (key[2] && key[2] !== marketId) {
            queryClient.removeQueries({ queryKey: key })
          }
        }
        const [market, marketSnapshot, tokenInfo] = await Promise.all([
          getMarket({
            chainId: selectedChain.id,
            token0: getAddress(baseCurrency.address),
            token1: getAddress(quoteCurrency.address),
            options: {
              rpcUrl: CHAIN_CONFIG.RPC_URL,
              useSubgraph: false,
            },
          }),
          getMarketSnapshot({
            chainId: selectedChain.id,
            token0: getAddress(baseCurrency.address),
            token1: getAddress(quoteCurrency.address),
          }),
          fetchTokenInfo({
            chain: selectedChain,
            base: baseCurrency.address,
            quote: quoteCurrency.address,
          }),
        ])
        return { market, marketSnapshot, tokenInfo }
      } else {
        return null
      }
    },
    initialData: null,
    refetchInterval: 2000, // checked
    refetchIntervalInBackground: true,
  })

  const availableDecimalPlacesGroups = useMemo(() => {
    return selectedMarket &&
      selectedMarket.bids.length + selectedMarket.asks.length > 0
      ? (Array.from(Array(DEFAULT_DECIMAL_PLACE_GROUP_LENGTH).keys())
          .map((i) => {
            const minPrice = Math.min(
              Number(
                selectedMarket.bids.sort(
                  (a, b) => Number(b.price) - Number(a.price),
                )[0]?.price ?? Number.MAX_VALUE,
              ),
              Number(
                selectedMarket.asks.sort(
                  (a, b) => Number(a.price) - Number(b.price),
                )[0]?.price ?? Number.MAX_VALUE,
              ),
            )
            const decimalPlaces = getPriceDecimals(minPrice)
            const label = (10 ** (i - decimalPlaces)).toFixed(
              Math.max(decimalPlaces - i, 0),
            )
            if (new BigNumber(minPrice).gt(label)) {
              return {
                label,
                value: decimalPlaces - i,
              }
            }
          })
          .filter((x) => x) as Decimals[])
      : null
  }, [selectedMarket])

  const [bids, asks] = useMemo(
    () =>
      selectedMarket && selectedDecimalPlaces
        ? [
            parseDepth(
              selectedChain.id,
              true,
              selectedMarket,
              selectedDecimalPlaces,
            ),
            parseDepth(
              selectedChain.id,
              false,
              selectedMarket,
              selectedDecimalPlaces,
            ),
          ]
        : [[], []],
    [selectedChain.id, selectedDecimalPlaces, selectedMarket],
  )

  const setMarketRateAction = useCallback(async () => {
    if (inputCurrency && outputCurrency && gasPrice) {
      try {
        setIsFetchingOnChainPrice(true)
        const price = await fetchPrice(
          selectedChain.id,
          inputCurrency,
          outputCurrency,
          gasPrice,
        )
        const minimumDecimalPlaces = availableDecimalPlacesGroups?.[0]?.value
        if (price.isZero()) {
          setIsFetchingOnChainPrice(false)
          return
        }
        setOnChainPrice(price.toNumber())
        setPriceInput(
          formatToCloberPriceString(
            selectedChain.id,
            price.toString(),
            inputCurrency,
            outputCurrency,
            isBid,
            minimumDecimalPlaces,
          ),
        )
      } catch (e) {
        console.error(`Failed to fetch price: ${e}`)
      } finally {
        setIsFetchingOnChainPrice(false)
      }
    }
  }, [
    availableDecimalPlacesGroups,
    gasPrice,
    inputCurrency,
    isBid,
    outputCurrency,
    selectedChain.id,
    setIsFetchingOnChainPrice,
    setPriceInput,
  ])

  // update selectedMarket and selectedMarketSnapshot when market data changes
  useEffect(() => {
    if (!data?.market) {
      setSelectedDecimalPlaces(undefined)
      setSelectedMarket(undefined)
      setSelectedMarketSnapshot(undefined)
      setSelectedTokenInfo(undefined)
    } else if (!isMarketEqual(selectedMarket, data.market)) {
      setSelectedDecimalPlaces(undefined)
      setSelectedMarket(data.market)
      if (data.marketSnapshot !== undefined) {
        setSelectedMarketSnapshot(data.marketSnapshot)
      }
      if (data.tokenInfo !== undefined) {
        setSelectedTokenInfo(data.tokenInfo)
      }
    } else if (
      selectedMarket &&
      data.market &&
      isMarketEqual(selectedMarket, data.market) &&
      (!isOrderBookEqual(selectedMarket?.asks ?? [], data.market?.asks ?? []) ||
        !isOrderBookEqual(selectedMarket?.bids ?? [], data.market?.bids ?? []))
    ) {
      setSelectedMarket(data.market)
      if (data.marketSnapshot) {
        setSelectedMarketSnapshot(data.marketSnapshot)
      }
      if (data.tokenInfo) {
        setSelectedTokenInfo(data.tokenInfo)
      }
    }
  }, [data, selectedMarket])

  // once
  // on initial load or currency change, fetch the current market price and initialize price input
  useEffect(
    () => {
      const action = async () => {
        if (inputCurrency && outputCurrency && gasPrice) {
          previousValue.current.inputCurrencyAddress = inputCurrency.address
          previousValue.current.outputCurrencyAddress = outputCurrency.address
          try {
            setIsFetchingOnChainPrice(true)
            const price = await fetchPrice(
              selectedChain.id,
              inputCurrency,
              outputCurrency,
              gasPrice,
            )
            if (
              !isAddressEqual(
                previousValue.current.inputCurrencyAddress,
                inputCurrency.address,
              ) ||
              !isAddressEqual(
                previousValue.current.outputCurrencyAddress,
                outputCurrency.address,
              ) ||
              price.isZero()
            ) {
              setIsFetchingOnChainPrice(false)
              return
            }
            setOnChainPrice(price.toNumber())
            setPriceInput(
              formatToCloberPriceString(
                selectedChain.id,
                price.toString(),
                inputCurrency,
                outputCurrency,
                isBid,
              ),
            )
          } catch (e) {
            console.error(`Failed to fetch price: ${e}`)
          } finally {
            setIsFetchingOnChainPrice(false)
          }
        }
      }

      setDepthClickedIndex(undefined)
      setPriceInput('')
      setOnChainPrice(0)

      action()
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputCurrency, outputCurrency, selectedChain.id, gasPrice === undefined],
  )

  // once
  // when availableDecimalPlacesGroups is populated, set the first one as the default selectedDecimalPlaces
  useEffect(() => {
    if (
      !availableDecimalPlacesGroups ||
      availableDecimalPlacesGroups.length === 0
    ) {
      setSelectedDecimalPlaces(undefined)
      return
    }
    setSelectedDecimalPlaces(availableDecimalPlacesGroups[0])
  }, [availableDecimalPlacesGroups])

  // when user clicks a depth level, update price input to the clicked level and reset the clicked state
  useEffect(() => {
    if (depthClickedIndex && inputCurrency && outputCurrency) {
      if (depthClickedIndex.isBid && bids[depthClickedIndex.index]) {
        setPriceInput(bids[depthClickedIndex.index].price)
        setDepthClickedIndex(undefined)
      } else if (!depthClickedIndex.isBid && asks[depthClickedIndex.index]) {
        setPriceInput(asks[depthClickedIndex.index].price)
        setDepthClickedIndex(undefined)
      }
    }
  }, [
    asks,
    bids,
    depthClickedIndex,
    inputCurrency,
    outputCurrency,
    setPriceInput,
  ])

  return (
    <Context.Provider
      value={{
        selectedMarket,
        selectedMarketSnapshot,
        selectedTokenInfo,
        setSelectedMarket,
        selectedDecimalPlaces,
        setSelectedDecimalPlaces,
        onChainPrice,
        availableDecimalPlacesGroups,
        depthClickedIndex,
        setDepthClickedIndex,
        bids,
        asks,
        setMarketRateAction,
        priceDeviationPercent,
        quoteCurrency,
        baseCurrency,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useMarketContext = () => React.useContext(Context) as MarketContext
