import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getMarket,
  getMarketId,
  getMarketSnapshot,
  Market,
  MarketSnapshot,
} from '@clober/v2-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { getAddress, isAddressEqual } from 'viem'
import { useGasPrice } from 'wagmi'

import { isMarketEqual } from '../../utils/market'
import {
  calculateInputCurrencyAmountString,
  calculateOutputCurrencyAmountString,
  isOrderBookEqual,
  parseDepth,
} from '../../utils/order-book'
import { getPriceDecimals } from '../../utils/prices'
import {
  Decimals,
  DEFAULT_DECIMAL_PLACE_GROUP_LENGTH,
} from '../../model/decimals'
import { useChainContext } from '../chain-context'
import { getCurrencyAddress } from '../../utils/currency'
import { formatSignificantString } from '../../utils/bignumber'
import { CHAIN_CONFIG } from '../../chain-configs'
import { fetchPrice } from '../../apis/price'

import { useTradeContext } from './trade-context'

type MarketContext = {
  selectedMarket?: Market
  selectedMarketSnapshot?: MarketSnapshot
  setSelectedMarket: (market: Market | undefined) => void
  selectedDecimalPlaces: Decimals | undefined
  isFetchingQuotes: boolean
  marketPrice: number
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
}

const Context = React.createContext<MarketContext>({
  selectedMarket: {} as Market,
  selectedMarketSnapshot: {} as MarketSnapshot,
  setSelectedMarket: (_) => _,
  selectedDecimalPlaces: undefined,
  setSelectedDecimalPlaces: () => {},
  isFetchingQuotes: false,
  marketPrice: 0,
  availableDecimalPlacesGroups: null,
  depthClickedIndex: undefined,
  setDepthClickedIndex: () => {},
  bids: [],
  asks: [],
  setMarketRateAction: async () => {
    return Promise.resolve()
  },
})

export const MarketProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { data: gasPrice } = useGasPrice()
  const { selectedChain } = useChainContext()
  const queryClient = useQueryClient()
  const {
    isBid,
    setPriceInput,
    priceInput,
    outputCurrencyAmount,
    inputCurrencyAmount,
    inputCurrency,
    outputCurrency,
    setInputCurrencyAmount,
    setOutputCurrencyAmount,
  } = useTradeContext()

  const previousValue = useRef({
    inputCurrencyAddress: inputCurrency?.address,
    outputCurrencyAddress: outputCurrency?.address,
  })

  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false)
  const [marketPrice, setMarketPrice] = useState(0)
  const [selectedDecimalPlaces, setSelectedDecimalPlaces] = useState<
    Decimals | undefined
  >(undefined)
  const [selectedMarket, setSelectedMarket] = useState<Market | undefined>(
    undefined,
  )
  const [selectedMarketSnapshot, setSelectedMarketSnapshot] = useState<
    MarketSnapshot | undefined
  >(undefined)
  const [depthClickedIndex, setDepthClickedIndex] = useState<
    | {
        isBid: boolean
        index: number
      }
    | undefined
  >(undefined)

  const { inputCurrencyAddress, outputCurrencyAddress } = getCurrencyAddress(
    'trade',
    selectedChain,
  )
  const marketId =
    inputCurrencyAddress && outputCurrencyAddress
      ? getMarketId(selectedChain.id, [
          getAddress(inputCurrencyAddress),
          getAddress(outputCurrencyAddress),
        ]).marketId
      : ''
  const { data } = useQuery({
    queryKey: ['market', selectedChain.id, marketId],
    queryFn: async () => {
      if (inputCurrencyAddress && outputCurrencyAddress) {
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
        const [market, marketSnapshot] = await Promise.all([
          getMarket({
            chainId: selectedChain.id,
            token0: getAddress(inputCurrencyAddress),
            token1: getAddress(outputCurrencyAddress),
            options: {
              rpcUrl: CHAIN_CONFIG.RPC_URL,
              useSubgraph: false,
            },
          }),
          getMarketSnapshot({
            chainId: selectedChain.id,
            token0: getAddress(inputCurrencyAddress),
            token1: getAddress(outputCurrencyAddress),
          }),
        ])
        return { market, marketSnapshot }
      } else {
        return null
      }
    },
    initialData: null,
    refetchInterval: 2000, // checked
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (!data?.market) {
      setSelectedDecimalPlaces(undefined)
      setSelectedMarket(undefined)
      setSelectedMarketSnapshot(undefined)
    } else if (!isMarketEqual(selectedMarket, data.market)) {
      setSelectedDecimalPlaces(undefined)
      setSelectedMarket(data.market)
      if (data.marketSnapshot) {
        setSelectedMarketSnapshot(data.marketSnapshot)
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
    }
  }, [data, selectedMarket])

  // once
  useEffect(
    () => {
      const action = async () => {
        setIsFetchingQuotes(true)
        if (inputCurrency && outputCurrency && gasPrice) {
          previousValue.current.inputCurrencyAddress = inputCurrency.address
          previousValue.current.outputCurrencyAddress = outputCurrency.address
          try {
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
              return
            }
            console.log({
              context: 'limit',
              price: price.toNumber(),
              chainId: selectedChain.id,
              inputCurrency: inputCurrency.symbol,
              outputCurrency: outputCurrency.symbol,
              gasPrice: gasPrice.toString(),
            })
            setMarketPrice(price.toNumber())
            setPriceInput(price.toNumber().toString())
            setIsFetchingQuotes(false)
          } catch (e) {
            console.error(`Failed to fetch price: ${e}`)
          }
        }
      }

      setDepthClickedIndex(undefined)
      setPriceInput('')
      setMarketPrice(0)

      action()
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputCurrency, outputCurrency, selectedChain.id, gasPrice === undefined],
  )

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

  // once
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

  // When depthClickedIndex is changed, reset the priceInput
  useEffect(() => {
    console.log('availableDecimalPlacesGroups', availableDecimalPlacesGroups)
    if (
      !availableDecimalPlacesGroups ||
      availableDecimalPlacesGroups.length === 0
    ) {
      return
    }
    const minimumDecimalPlaces = availableDecimalPlacesGroups[0].value

    if (depthClickedIndex && inputCurrency && outputCurrency) {
      if (depthClickedIndex.isBid && bids[depthClickedIndex.index]) {
        setPriceInput(
          formatSignificantString(
            bids[depthClickedIndex.index].price,
            minimumDecimalPlaces,
          ),
        )
        setDepthClickedIndex(undefined)
      } else if (!depthClickedIndex.isBid && asks[depthClickedIndex.index]) {
        setPriceInput(
          formatSignificantString(
            asks[depthClickedIndex.index].price,
            minimumDecimalPlaces,
          ),
        )
        setDepthClickedIndex(undefined)
      }
    }
  }, [
    availableDecimalPlacesGroups,
    asks,
    bids,
    depthClickedIndex,
    setPriceInput,
    inputCurrency,
    outputCurrency,
    selectedChain.id,
  ])

  const previousValues = useRef({
    priceInput,
    outputCurrencyAmount,
    inputCurrencyAmount,
  })

  useEffect(() => {
    if (!outputCurrency?.decimals || !inputCurrency?.decimals) {
      return
    }

    // when setting `outputCurrencyAmount` first time
    if (
      (new BigNumber(inputCurrencyAmount).isNaN() ||
        new BigNumber(inputCurrencyAmount).isZero()) &&
      !new BigNumber(priceInput).isNaN() &&
      !new BigNumber(priceInput).isZero() &&
      !new BigNumber(outputCurrencyAmount).isNaN() &&
      !new BigNumber(outputCurrencyAmount).isZero() &&
      previousValues.current.outputCurrencyAmount !== outputCurrencyAmount
    ) {
      const inputCurrencyAmount = calculateInputCurrencyAmountString(
        isBid,
        outputCurrencyAmount,
        priceInput,
        inputCurrency.decimals,
      )
      setInputCurrencyAmount(inputCurrencyAmount)
      previousValues.current = {
        priceInput,
        outputCurrencyAmount,
        inputCurrencyAmount,
      }
      return
    }

    // `priceInput` is changed -> `outputCurrencyAmount` will be changed
    if (previousValues.current.priceInput !== priceInput) {
      const outputCurrencyAmount = calculateOutputCurrencyAmountString(
        isBid,
        inputCurrencyAmount,
        priceInput,
        outputCurrency.decimals,
      )
      setOutputCurrencyAmount(outputCurrencyAmount)
      previousValues.current = {
        priceInput,
        outputCurrencyAmount,
        inputCurrencyAmount,
      }
    }
    // `outputCurrencyAmount` is changed -> `inputCurrencyAmount` will be changed
    else if (
      previousValues.current.outputCurrencyAmount !== outputCurrencyAmount
    ) {
      const inputCurrencyAmount = calculateInputCurrencyAmountString(
        isBid,
        outputCurrencyAmount,
        priceInput,
        inputCurrency.decimals,
      )
      setInputCurrencyAmount(inputCurrencyAmount)
      previousValues.current = {
        priceInput,
        outputCurrencyAmount,
        inputCurrencyAmount,
      }
    }
    // `inputCurrencyAmount` is changed -> `outputCurrencyAmount` will be changed
    else if (
      previousValues.current.inputCurrencyAmount !== inputCurrencyAmount
    ) {
      const outputCurrencyAmount = calculateOutputCurrencyAmountString(
        isBid,
        inputCurrencyAmount,
        priceInput,
        outputCurrency.decimals,
      )
      setOutputCurrencyAmount(outputCurrencyAmount)
      previousValues.current = {
        priceInput,
        outputCurrencyAmount,
        inputCurrencyAmount,
      }
    }
  }, [
    inputCurrency?.decimals,
    outputCurrency?.decimals,
    inputCurrencyAmount,
    isBid,
    outputCurrencyAmount,
    priceInput,
    setInputCurrencyAmount,
    setOutputCurrencyAmount,
  ])

  const setMarketRateAction = useCallback(async () => {
    if (inputCurrency && outputCurrency && gasPrice) {
      setIsFetchingQuotes(true)
      const price = await fetchPrice(
        selectedChain.id,
        inputCurrency,
        outputCurrency,
        gasPrice,
      )
      console.log({
        context: 'fetching price for market rate',
        price: price.toNumber(),
        chainId: selectedChain.id,
        inputCurrency: inputCurrency.symbol,
        outputCurrency: outputCurrency.symbol,
        gasPrice: gasPrice.toString(),
      })
      const minimumDecimalPlaces = availableDecimalPlacesGroups?.[0]?.value
      if (price.isZero()) {
        setIsFetchingQuotes(false)
        return
      }
      setMarketPrice(price.toNumber())
      setPriceInput(
        minimumDecimalPlaces
          ? formatSignificantString(price, minimumDecimalPlaces)
          : price.toFixed(),
      )
      setIsFetchingQuotes(false)
    }
  }, [
    availableDecimalPlacesGroups,
    gasPrice,
    inputCurrency,
    outputCurrency,
    selectedChain.id,
    setPriceInput,
  ])

  return (
    <Context.Provider
      value={{
        selectedMarket,
        selectedMarketSnapshot,
        setSelectedMarket,
        selectedDecimalPlaces,
        setSelectedDecimalPlaces,
        isFetchingQuotes,
        marketPrice,
        availableDecimalPlacesGroups,
        depthClickedIndex,
        setDepthClickedIndex,
        bids,
        asks,
        setMarketRateAction,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useMarketContext = () => React.useContext(Context) as MarketContext
