import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAddress, isAddressEqual, parseUnits } from 'viem'
import { getQuoteToken } from '@clober/v2-sdk'
import { useAccount, useDisconnect, useGasPrice } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'

import { Currency } from '../../model/currency'
import {
  fetchCurrenciesDone,
  fetchCurrency,
  getCurrencyAddress,
  LOCAL_STORAGE_INPUT_CURRENCY_KEY,
  LOCAL_STORAGE_OUTPUT_CURRENCY_KEY,
} from '../../utils/currency'
import { getQueryParams } from '../../utils/url'
import { useChainContext } from '../chain-context'
import { useCurrencyContext } from '../currency-context'
import { CHAIN_CONFIG } from '../../chain-configs'
import { Quote } from '../../model/aggregator/quote'
import { fetchQuotesLive } from '../../apis/swap/quote'
import { aggregators } from '../../chain-configs/aggregators'
import { formatUnits } from '../../utils/bigint'
import {
  calculateInputCurrencyAmountString,
  calculateOutputCurrencyAmountString,
} from '../../utils/order-book'

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
  isRefreshing: boolean
  refreshQuotesAction: () => void
  priceImpact: number
  isFetchingOnChainPrice: boolean
  setIsFetchingOnChainPrice: (isFetching: boolean) => void
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
  isRefreshing: false,
  refreshQuotesAction: () => {},
  priceImpact: 0,
  isFetchingOnChainPrice: false,
  setIsFetchingOnChainPrice: () => {},
})

const TRADE_SLIPPAGE_KEY = (chainId: number) => `trade-slippage-${chainId}`
export const TRADE_TAB_KEY = 'trade-tab'

export const TradeProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { disconnectAsync } = useDisconnect()
  const { data: gasPrice } = useGasPrice()
  const { address: userAddress } = useAccount()
  const { selectedChain } = useChainContext()
  const previousChain = useRef({
    chain: selectedChain,
  })
  const { chainId } = useAccount()
  const { whitelistCurrencies, setCurrencies, prices, balances, getAllowance } =
    useCurrencyContext()

  const [isBid, setIsBid] = useState(true)
  const [tab, _setTab] = useState<'limit' | 'swap'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TRADE_TAB_KEY)
      if (stored === 'limit' || stored === 'swap') {
        return stored
      }
    }
    return CHAIN_CONFIG.IS_SWAP_DEFAULT ? 'swap' : 'limit'
  })
  const [isFetchingOnChainPrice, setIsFetchingOnChainPrice] = useState(false)
  const [quotes, setQuotes] = useState<{
    best: Quote | null
    all: Quote[]
  }>({
    best: null,
    all: [],
  })
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [debouncedValue, setDebouncedValue] = useState('')
  const previousValues = useRef({
    priceInput,
    outputCurrencyAmount,
    inputCurrencyAmount,
  })

  const setTab = useCallback((tab: 'limit' | 'swap') => {
    _setTab(tab)
    localStorage.setItem(TRADE_TAB_KEY, tab)
  }, [])

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

  const refreshQuotesAction = useCallback(() => {
    if (isRefreshing) {
      return
    }

    setIsRefreshing(true)
    setLatestQuotesRefreshTime(Date.now())

    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }, [isRefreshing])

  const { inputCurrencyAddress, outputCurrencyAddress } = getCurrencyAddress(
    'trade',
    selectedChain,
  )

  const priceImpact = useMemo(() => {
    if (
      selectedQuote &&
      selectedQuote.amountIn > 0n &&
      selectedQuote.amountOut > 0n &&
      inputCurrency &&
      outputCurrency &&
      prices[inputCurrency.address] &&
      prices[outputCurrency.address]
    ) {
      const amountIn = Number(
        formatUnits(selectedQuote.amountIn, inputCurrency.decimals),
      )
      const amountOut = Number(
        formatUnits(selectedQuote.amountOut, outputCurrency.decimals),
      )
      const inputValue = amountIn * prices[inputCurrency.address]
      const outputValue = amountOut * prices[outputCurrency.address]
      return inputValue > outputValue
        ? ((outputValue - inputValue) / inputValue) * 100
        : 0
    }
    return Number.NaN
  }, [inputCurrency, outputCurrency, prices, selectedQuote])

  const setSlippageInput = useCallback(
    (slippage: string) => {
      localStorage.setItem(TRADE_SLIPPAGE_KEY(selectedChain.id), slippage)
      _setSlippageInput(slippage)
    },
    [selectedChain.id],
  )

  useQuery({
    queryKey: [
      'quotes',
      inputCurrency?.address,
      outputCurrency?.address,
      Number(debouncedValue),
      slippageInput,
      userAddress,
      selectedChain.id,
      tab,
      latestQuotesRefreshTime,
    ],
    queryFn: async () => {
      if (
        gasPrice &&
        inputCurrency &&
        outputCurrency &&
        Number(debouncedValue) > 0 &&
        tab === 'swap'
      ) {
        const amountIn = parseUnits(inputCurrencyAmount, inputCurrency.decimals)
        const insufficientFunds = balances[inputCurrency.address] < amountIn
        const insufficientAllowance =
          getAllowance(
            CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
            inputCurrency,
          ) < amountIn
        await fetchQuotesLive(
          aggregators,
          inputCurrency,
          amountIn,
          outputCurrency,
          parseFloat(slippageInput),
          gasPrice,
          prices,
          insufficientFunds || insufficientAllowance ? undefined : userAddress,
          setQuotes,
        )
      }
      return null
    },
    refetchOnWindowFocus: false,
  })

  // when the best quote updates, set it as the selected quote
  useEffect(() => {
    if (quotes.best) {
      setSelectedQuote(quotes.best)
    } else {
      setSelectedQuote(null)
    }
  }, [quotes.best, setSelectedQuote])

  // debounce inputCurrencyAmount for 500ms to avoid unnecessary quote fetches while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputCurrencyAmount)
    }, 500)

    setQuotes({
      best: null,
      all: [],
    })

    return () => clearTimeout(timer)
  }, [inputCurrencyAmount])

  // load slippage setting from localStorage on mount
  useEffect(() => {
    const slippage = localStorage.getItem(TRADE_SLIPPAGE_KEY(selectedChain.id))
    if (slippage) {
      _setSlippageInput(slippage)
    }
  }, [selectedChain.id])

  // initialize input/output currencies and bid direction based on URL query or localStorage
  // if the chain in the query is different from the connected one, disconnect and reload
  // also removes the input/outputCurrency params from the URL after setup
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

  // keep inputCurrencyAmount and outputCurrencyAmount in sync when one changes, using priceInput as reference
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
        isRefreshing,
        refreshQuotesAction,
        priceImpact,
        isFetchingOnChainPrice,
        setIsFetchingOnChainPrice,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useTradeContext = () => React.useContext(Context) as TradeContext
