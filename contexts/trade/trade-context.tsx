import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAddress, isAddress, isAddressEqual, parseUnits } from 'viem'
import { getQuoteToken } from '@clober/v2-sdk'
import { useAccount, useDisconnect, useGasPrice } from 'wagmi'
import { useQuery } from '@tanstack/react-query'

import { Currency } from '../../model/currency'
import {
  fetchCurrenciesDone,
  fetchCurrency,
  LOCAL_STORAGE_INPUT_CURRENCY_KEY,
  LOCAL_STORAGE_OUTPUT_CURRENCY_KEY,
} from '../../utils/currency'
import { getQueryParams } from '../../utils/url'
import { useChainContext } from '../chain-context'
import { useCurrencyContext } from '../currency-context'
import { CHAIN_CONFIG } from '../../chain-configs'
import { Quote } from '../../model/aggregator/quote'
import { fetchQuotes } from '../../apis/swap/quote'
import { aggregators } from '../../chain-configs/aggregators'
import { formatUnits } from '../../utils/bigint'

type TradeContext = {
  isBid: boolean
  setIsBid: (isBid: (prevState: boolean) => boolean) => void
  showInputCurrencySelect: boolean
  setShowInputCurrencySelect: (showInputCurrencySelect: boolean) => void
  inputCurrency: Currency | undefined
  setInputCurrency: (currency: Currency | undefined) => void
  inputCurrencyAmount: string
  setInputCurrencyAmount: (amount: string) => void
  showOutputCurrencySelect: boolean
  setShowOutputCurrencySelect: (showOutputCurrencySelect: boolean) => void
  outputCurrency: Currency | undefined
  setOutputCurrency: (currency: Currency | undefined) => void
  outputCurrencyAmount: string
  setOutputCurrencyAmount: (amount: string) => void
  priceInput: string
  setPriceInput: (priceInput: string) => void
  slippageInput: string
  setSlippageInput: (slippage: string) => void
  showOrderBook: boolean
  setShowOrderBook: (showOrderBook: boolean) => void
  selectedQuote: Quote | null
  setSelectedQuote: (quote: Quote | null) => void
  tab: 'limit' | 'swap'
  setTab: (tab: 'limit' | 'swap') => void
  quotes: {
    best: Quote | null
    all: Quote[]
  }
  refreshQuotesAction: () => void
  priceImpact: number
  isFetchingQuotes: boolean
  setIsFetchingQuotes: (isFetching: boolean) => void
}

const Context = React.createContext<TradeContext>({
  isBid: true,
  setIsBid: () => {},
  showInputCurrencySelect: false,
  setShowInputCurrencySelect: () => {},
  inputCurrency: undefined,
  setInputCurrency: () => {},
  inputCurrencyAmount: '',
  setInputCurrencyAmount: () => {},
  showOutputCurrencySelect: false,
  setShowOutputCurrencySelect: () => {},
  outputCurrency: undefined,
  setOutputCurrency: () => {},
  outputCurrencyAmount: '',
  setOutputCurrencyAmount: () => {},
  priceInput: '',
  setPriceInput: () => {},
  slippageInput: '1',
  setSlippageInput: () => {},
  showOrderBook: true,
  setShowOrderBook: () => {},
  selectedQuote: null,
  setSelectedQuote: () => {},
  tab: 'limit',
  setTab: () => {},
  quotes: { best: null, all: [] },
  refreshQuotesAction: () => {},
  priceImpact: 0,
  isFetchingQuotes: false,
  setIsFetchingQuotes: () => {},
})

export const TRADE_SLIPPAGE_KEY = 'trade-slippage'

export const TradeProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { disconnectAsync } = useDisconnect()
  const { data: gasPrice } = useGasPrice()
  const { address: userAddress } = useAccount()
  const { selectedChain } = useChainContext()
  const previousChain = useRef({
    chain: selectedChain,
  })
  const { chainId } = useAccount()
  const { whitelistCurrencies, setCurrencies, prices } = useCurrencyContext()

  const [isBid, setIsBid] = useState(true)
  const [tab, setTab] = useState<'limit' | 'swap'>(
    CHAIN_CONFIG.IS_SWAP_DEFAULT ? 'swap' : 'limit',
  )
  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [showOrderBook, setShowOrderBook] = useState(true)
  const [showInputCurrencySelect, setShowInputCurrencySelect] = useState(false)
  const [inputCurrency, _setInputCurrency] = useState<Currency | undefined>(
    undefined,
  )
  const [inputCurrencyAmount, setInputCurrencyAmount] = useState('')

  const [showOutputCurrencySelect, setShowOutputCurrencySelect] =
    useState(false)
  const [outputCurrency, _setOutputCurrency] = useState<Currency | undefined>(
    undefined,
  )
  const [outputCurrencyAmount, setOutputCurrencyAmount] = useState('')

  const [priceInput, setPriceInput] = useState('')
  const [slippageInput, _setSlippageInput] = useState('0.5')
  const [latestQuotesRefreshTime, setLatestQuotesRefreshTime] = useState(
    Date.now(),
  )
  const [debouncedValue, setDebouncedValue] = useState('')

  const setInputCurrency = useCallback(
    (currency: Currency | undefined) => {
      currency = currency
        ? {
            ...currency,
            address: getAddress(currency.address),
          }
        : undefined
      if (currency) {
        localStorage.setItem(
          LOCAL_STORAGE_INPUT_CURRENCY_KEY('trade', selectedChain),
          currency.address,
        )
      }
      _setInputCurrency(currency)
    },
    [selectedChain],
  )

  const setOutputCurrency = useCallback(
    (currency: Currency | undefined) => {
      currency = currency
        ? {
            ...currency,
            address: getAddress(currency.address),
          }
        : undefined
      if (currency) {
        localStorage.setItem(
          LOCAL_STORAGE_OUTPUT_CURRENCY_KEY('trade', selectedChain),
          currency.address,
        )
      }
      _setOutputCurrency(currency)
    },
    [selectedChain],
  )

  const refreshQuotesAction = useCallback(
    () => setLatestQuotesRefreshTime(Date.now()),
    [],
  )

  const [inputCurrencyAddress, outputCurrencyAddress] = [
    getQueryParams()?.inputCurrency ??
      localStorage.getItem(
        LOCAL_STORAGE_INPUT_CURRENCY_KEY('trade', selectedChain),
      ),
    getQueryParams()?.outputCurrency ??
      localStorage.getItem(
        LOCAL_STORAGE_OUTPUT_CURRENCY_KEY('trade', selectedChain),
      ),
  ].map((address) => (isAddress(address) ? getAddress(address) : address))

  const priceImpact = useMemo(() => {
    if (
      selectedQuote &&
      selectedQuote.amountIn > 0n &&
      selectedQuote.amountOut > 0n &&
      inputCurrency &&
      outputCurrency &&
      prices[getAddress(inputCurrency.address)] &&
      prices[getAddress(outputCurrency.address)]
    ) {
      const amountIn = Number(
        formatUnits(selectedQuote.amountIn, inputCurrency.decimals),
      )
      const amountOut = Number(
        formatUnits(selectedQuote.amountOut, outputCurrency.decimals),
      )
      const inputValue = amountIn * prices[getAddress(inputCurrency.address)]
      const outputValue = amountOut * prices[getAddress(outputCurrency.address)]
      return inputValue > outputValue
        ? ((outputValue - inputValue) / inputValue) * 100
        : 0
    }
    return Number.NaN
  }, [inputCurrency, outputCurrency, prices, selectedQuote])

  const setSlippageInput = useCallback((slippage: string) => {
    localStorage.setItem(TRADE_SLIPPAGE_KEY, slippage)
    _setSlippageInput(slippage)
  }, [])

  const { data: quotes } = useQuery({
    queryKey: [
      'quotes',
      inputCurrency?.address,
      outputCurrency?.address,
      Number(inputCurrencyAmount),
      slippageInput,
      userAddress,
      selectedChain.id,
      tab,
      latestQuotesRefreshTime,
      debouncedValue,
    ],
    queryFn: async () => {
      if (
        gasPrice &&
        inputCurrency &&
        outputCurrency &&
        Number(inputCurrencyAmount) > 0 &&
        tab === 'swap' &&
        Number(debouncedValue) === Number(inputCurrencyAmount)
      ) {
        const { best, all } = await fetchQuotes(
          aggregators,
          inputCurrency,
          parseUnits(inputCurrencyAmount, inputCurrency.decimals),
          outputCurrency,
          parseFloat(slippageInput),
          gasPrice,
          prices,
          userAddress,
        )
        return { best, all }
      }
      return { best: null, all: [] }
    },
    initialData: { best: null, all: [] },
  })

  useEffect(() => {
    if (quotes.best) {
      setSelectedQuote(quotes.best)
    } else {
      setSelectedQuote(null)
    }
  }, [quotes.best, setSelectedQuote])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputCurrencyAmount)
    }, 500)

    return () => clearTimeout(timer)
  }, [inputCurrencyAmount])

  useEffect(() => {
    const slippage = localStorage.getItem(TRADE_SLIPPAGE_KEY)
    if (slippage) {
      _setSlippageInput(slippage)
    }
  }, [])

  useEffect(
    () => {
      const action = async () => {
        previousChain.current.chain = selectedChain
        if (
          getQueryParams()?.inputCurrency &&
          getQueryParams()?.outputCurrency &&
          getQueryParams()?.chain
        ) {
          if (chainId && chainId !== selectedChain.id) {
            try {
              await disconnectAsync()
              window.location.reload()
            } catch (e) {
              console.error('disconnectAsync error', e)
            }
          }
        } else if (!fetchCurrenciesDone(whitelistCurrencies)) {
          return
        }
        const _inputCurrency = inputCurrencyAddress
          ? (whitelistCurrencies.find((currency) =>
              isAddressEqual(
                currency.address,
                getAddress(inputCurrencyAddress),
              ),
            ) ??
            (await fetchCurrency(
              selectedChain,
              getAddress(inputCurrencyAddress),
            )))
          : CHAIN_CONFIG.DEFAULT_INPUT_CURRENCY
        const _outputCurrency = outputCurrencyAddress
          ? (whitelistCurrencies.find((currency) =>
              isAddressEqual(
                currency.address,
                getAddress(outputCurrencyAddress),
              ),
            ) ??
            (await fetchCurrency(
              selectedChain,
              getAddress(outputCurrencyAddress),
            )))
          : CHAIN_CONFIG.DEFAULT_OUTPUT_CURRENCY

        if (previousChain.current.chain.id !== selectedChain.id) {
          return
        }

        if (_inputCurrency) {
          setInputCurrency(_inputCurrency)
        }
        if (_outputCurrency) {
          setOutputCurrency(_outputCurrency)
        }

        if (_inputCurrency && _outputCurrency) {
          const quote = getQuoteToken({
            chainId: selectedChain.id,
            token0: _inputCurrency.address,
            token1: _outputCurrency.address,
          })
          if (isAddressEqual(quote, _inputCurrency.address)) {
            setIsBid(true)
          } else {
            setIsBid(false)
          }
          // remove only `inputCurrency` and `outputCurrency` query params
          const newUrl = new URL(window.location.href)
          if (
            newUrl.searchParams.has('inputCurrency') ||
            newUrl.searchParams.has('outputCurrency')
          ) {
            newUrl.searchParams.delete('inputCurrency')
            newUrl.searchParams.delete('outputCurrency')
            window.history.pushState(
              {},
              '',
              `${newUrl.pathname}${newUrl.search}`,
            )
          }
        } else {
          setIsBid(true)
        }
      }
      if (window.location.href.includes('/trade')) {
        action()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      disconnectAsync,
      selectedChain,
      setCurrencies,
      setInputCurrency,
      setOutputCurrency,
      whitelistCurrencies,
      window.location.href,
      inputCurrencyAddress,
      outputCurrencyAddress,
      chainId,
    ],
  )

  return (
    <Context.Provider
      value={{
        isBid,
        setIsBid,
        showInputCurrencySelect,
        setShowInputCurrencySelect,
        inputCurrency,
        setInputCurrency,
        inputCurrencyAmount,
        setInputCurrencyAmount,
        showOutputCurrencySelect,
        setShowOutputCurrencySelect,
        outputCurrency,
        setOutputCurrency,
        outputCurrencyAmount,
        setOutputCurrencyAmount,
        priceInput,
        setPriceInput,
        slippageInput,
        setSlippageInput,
        showOrderBook,
        setShowOrderBook,
        selectedQuote,
        setSelectedQuote,
        tab,
        setTab,
        quotes,
        refreshQuotesAction,
        priceImpact,
        isFetchingQuotes,
        setIsFetchingQuotes,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useTradeContext = () => React.useContext(Context) as TradeContext
