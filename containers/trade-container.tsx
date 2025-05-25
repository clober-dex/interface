import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAddress, isAddressEqual, parseUnits, zeroAddress } from 'viem'
import { useAccount, useGasPrice, useWalletClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getQuoteToken } from '@clober/v2-sdk'
import BigNumber from 'bignumber.js'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/router'

import { LimitForm } from '../components/form/limit-form'
import OrderBook from '../components/order-book'
import { useChainContext } from '../contexts/chain-context'
import { useMarketContext } from '../contexts/trade/market-context'
import { useOpenOrderContext } from '../contexts/trade/open-order-context'
import { useLimitContractContext } from '../contexts/trade/limit-contract-context'
import { useCurrencyContext } from '../contexts/currency-context'
import { isAddressesEqual } from '../utils/address'
import { fetchQuotes } from '../apis/swap/quote'
import { aggregators } from '../chain-configs/aggregators'
import { formatUnits } from '../utils/bigint'
import { toPlacesString } from '../utils/bignumber'
import { MarketInfoCard } from '../components/card/market/market-info-card'
import { OpenOrderCardList } from '../components/card/open-order/open-order-card-list'
import { ActionButton } from '../components/button/action-button'
import { Currency } from '../model/currency'
import WarningLimitModal from '../components/modal/warning-limit-modal'
import { useTradeContext } from '../contexts/trade/trade-context'
import { SwapForm } from '../components/form/swap-form'
import { useSwapContractContext } from '../contexts/trade/swap-contract-context'
import { fetchPrice } from '../apis/price'
import { SearchSvg } from '../components/svg/search-svg'
import CheckIcon from '../components/icon/check-icon'
import { CHAIN_CONFIG } from '../chain-configs'
import { SwapRouteList } from '../components/swap-router-list'
import { Quote } from '../model/aggregator/quote'
import CloseSvg from '../components/svg/close-svg'

import { IframeChartContainer } from './chart/iframe-chart-container'
import { NativeChartContainer } from './chart/native-chart-container'

export const TradeContainer = () => {
  const router = useRouter()
  const { data: gasPrice } = useGasPrice()
  const { selectedChain } = useChainContext()
  const {
    selectedMarket,
    selectedMarketSnapshot,
    availableDecimalPlacesGroups,
    selectedDecimalPlaces,
    setSelectedDecimalPlaces,
    bids,
    asks,
    setDepthClickedIndex,
  } = useMarketContext()
  const { openOrders } = useOpenOrderContext()
  const { limit, cancels, claims } = useLimitContractContext()
  const { swap } = useSwapContractContext()
  const { address: userAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const {
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
  } = useTradeContext()
  const { openConnectModal } = useConnectModal()
  const { balances, prices, currencies, setCurrencies } = useCurrencyContext()
  const [showOrderBook, setShowOrderBook] = useState(false)
  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false)
  const [showMobileModal, setShowMobileModal] = useState(false)
  const [marketPrice, setMarketPrice] = useState(0)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [latestRefreshTime, setLatestRefreshTime] = useState(Date.now())

  const [debouncedValue, setDebouncedValue] = useState('')
  const [tab, setTab] = useState<'limit' | 'swap'>('swap')
  const [searchValue, _setSearchValue] = useState('')
  const [searchInCurrentMarket, _setSearchInCurrentMarket] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  const setSearchInCurrentMarket = useCallback((value: boolean) => {
    _setSearchInCurrentMarket(value)
    if (value) {
      _setSearchValue('')
    }
  }, [])

  const setSearchValue = useCallback(
    (value: string) => {
      _setSearchValue(value)
      if (value) {
        setSearchInCurrentMarket(false)
      }
    },
    [setSearchInCurrentMarket],
  )

  useEffect(() => {
    if (selectedChain.testnet) {
      setShowOrderBook(true)
    } else {
      setShowOrderBook(false)
    }
  }, [selectedChain.testnet])

  const previousValue = useRef({
    chain: selectedChain,
    inputCurrencyAddress: inputCurrency?.address,
    outputCurrencyAddress: outputCurrency?.address,
  })

  const [quoteCurrency, baseCurrency] = useMemo(() => {
    if (inputCurrency && outputCurrency) {
      const quote = getQuoteToken({
        chainId: selectedChain.id,
        token0: inputCurrency.address,
        token1: outputCurrency.address,
      })
      return isAddressEqual(quote, inputCurrency.address)
        ? [inputCurrency, outputCurrency]
        : [outputCurrency, inputCurrency]
    } else {
      return [undefined, undefined]
    }
  }, [inputCurrency, outputCurrency, selectedChain.id])

  const amountIn = useMemo(
    () => parseUnits(inputCurrencyAmount, inputCurrency?.decimals ?? 18),
    [inputCurrency?.decimals, inputCurrencyAmount],
  )

  const [filteredOpenOrders, claimableOpenOrders, cancellableOpenOrders] =
    useMemo(() => {
      const filteredOpenOrders = openOrders.filter((order) => {
        if (selectedMarket && searchInCurrentMarket) {
          return (
            (isAddressEqual(
              selectedMarket.base.address,
              order.inputCurrency.address,
            ) &&
              isAddressEqual(
                selectedMarket.quote.address,
                order.outputCurrency.address,
              )) ||
            (isAddressEqual(
              selectedMarket.base.address,
              order.outputCurrency.address,
            ) &&
              isAddressEqual(
                selectedMarket.quote.address,
                order.inputCurrency.address,
              ))
          )
        }
        const _searchValue = searchValue.toLowerCase()
        return (
          order.inputCurrency.symbol.toLowerCase().includes(_searchValue) ||
          order.outputCurrency.symbol.toLowerCase().includes(_searchValue) ||
          order.inputCurrency.name.toLowerCase().includes(_searchValue) ||
          order.outputCurrency.name.toLowerCase().includes(_searchValue) ||
          order.inputCurrency.address.toLowerCase().includes(_searchValue) ||
          order.outputCurrency.address.toLowerCase().includes(_searchValue)
        )
      })
      const claimableOpenOrders = filteredOpenOrders.filter(
        ({ claimable }) =>
          parseUnits(claimable.value, claimable.currency.decimals) > 0n,
      )
      const cancellableOpenOrders = filteredOpenOrders.filter(
        ({ cancelable }) =>
          parseUnits(cancelable.value, cancelable.currency.decimals) > 0n,
      )
      return [filteredOpenOrders, claimableOpenOrders, cancellableOpenOrders]
    }, [openOrders, searchInCurrentMarket, searchValue, selectedMarket])

  useEffect(() => {
    if (
      selectedMarket &&
      selectedMarket.asks.length + selectedMarket.bids.length === 0
    ) {
      setShowOrderBook(false)
    }
  }, [selectedMarket])

  // once
  useEffect(
    () => {
      const action = async () => {
        setIsFetchingQuotes(true)
        previousValue.current.chain = selectedChain
        if (inputCurrency && outputCurrency) {
          previousValue.current.inputCurrencyAddress = inputCurrency.address
          previousValue.current.outputCurrencyAddress = outputCurrency.address
          try {
            const price = await fetchPrice(
              selectedChain.id,
              inputCurrency,
              outputCurrency,
            )
            if (
              previousValue.current.chain.id !== selectedChain.id ||
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
    [inputCurrency, outputCurrency, selectedChain.id],
  )

  const setMarketRateAction = useCallback(async () => {
    if (inputCurrency && outputCurrency) {
      setIsFetchingQuotes(true)
      const price = await fetchPrice(
        selectedChain.id,
        inputCurrency,
        outputCurrency,
      )
      console.log({
        context: 'fetching price',
        price: price.toNumber(),
        chainId: selectedChain.id,
        inputCurrency: inputCurrency.symbol,
        outputCurrency: outputCurrency.symbol,
      })
      const minimumDecimalPlaces = availableDecimalPlacesGroups?.[0]?.value
      if (
        previousValue.current.chain.id !== selectedChain.id ||
        price.isZero()
      ) {
        setIsFetchingQuotes(false)
        return
      }
      setMarketPrice(price.toNumber())
      setPriceInput(
        minimumDecimalPlaces
          ? toPlacesString(price, minimumDecimalPlaces)
          : price.toFixed(),
      )
      setIsFetchingQuotes(false)
    }
  }, [
    availableDecimalPlacesGroups,
    inputCurrency,
    outputCurrency,
    selectedChain.id,
    setPriceInput,
  ])

  const marketRateDiff = (
    isBid
      ? new BigNumber(marketPrice).dividedBy(priceInput).minus(1).times(100)
      : new BigNumber(priceInput).dividedBy(marketPrice).minus(1).times(100)
  ).toNumber()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputCurrencyAmount)
    }, 500)

    return () => clearTimeout(timer)
  }, [inputCurrencyAmount])

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
      latestRefreshTime,
      debouncedValue,
    ],
    queryFn: async () => {
      if (
        gasPrice &&
        inputCurrency &&
        outputCurrency &&
        amountIn > 0n &&
        tab === 'swap' &&
        Number(debouncedValue) === Number(inputCurrencyAmount)
      ) {
        console.log({
          context: 'quote',
          chainId: selectedChain.id,
          inputCurrency: inputCurrency.symbol,
          outputCurrency: outputCurrency.symbol,
          amount: amountIn,
        })
        const { best, all } = await fetchQuotes(
          aggregators,
          inputCurrency,
          amountIn,
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
  }, [quotes.best])

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

  return (
    <>
      {showWarningModal ? (
        <WarningLimitModal
          marketPrice={marketPrice}
          priceInput={Number(priceInput)}
          marketRateDiff={marketRateDiff}
          closeModal={() => setShowWarningModal(false)}
          limit={async () => {
            if (!inputCurrency || !outputCurrency || !selectedMarket) {
              return
            }
            setShowWarningModal(false)
            await limit(
              inputCurrency,
              outputCurrency,
              inputCurrencyAmount,
              priceInput,
              selectedMarket,
            )
          }}
        />
      ) : (
        <></>
      )}

      <div className="bg-[#191d25] rounded-[22px] py-1 w-full h-10 flex sm:hidden flex-row relative text-gray-400 text-base font-bold">
        <button
          disabled={tab === 'swap'}
          onClick={() => setTab('swap')}
          className="text-sm flex flex-1 px-6 py-1.5 h-full rounded-[20px] text-gray-400 disabled:text-white disabled:bg-blue-500 justify-center items-center gap-1"
        >
          Swap
        </button>
        <button
          disabled={tab === 'limit'}
          onClick={() => setTab('limit')}
          className="text-sm flex flex-1 px-6 py-1.5 h-full rounded-[20px] text-gray-400 disabled:text-white disabled:bg-blue-500 justify-center items-center gap-1"
        >
          Limit
        </button>
      </div>

      <div className="flex flex-col w-full sm:w-fit mb-4 sm:mb-6 items-center">
        <div className="w-full max-w-[482px] items-center justify-center mb-10 hidden sm:flex bg-[#191d25] rounded-[22px] py-1 h-12 flex-row relative text-gray-400 text-base font-bold">
          <button
            disabled={tab === 'swap'}
            onClick={() => setTab('swap')}
            className="flex flex-1 px-6 py-2 rounded-[18px] text-gray-400 disabled:text-white disabled:bg-blue-500 justify-center items-center gap-1"
          >
            Swap
          </button>
          <button
            disabled={tab === 'limit'}
            onClick={() => setTab('limit')}
            className="flex flex-1 px-6 py-2 rounded-[18px] text-gray-400 disabled:text-white disabled:bg-blue-500 justify-center items-center gap-1"
          >
            Limit
          </button>
        </div>

        <div
          className={`flex flex-col w-full lg:flex-row gap-4 justify-center ${tab === 'swap' ? 'sm:flex-col-reverse' : ''}`}
        >
          <div className="flex flex-col gap-[26px] sm:gap-4 w-full lg:w-[740px]">
            {tab === 'limit' && (
              <>
                {baseCurrency && quoteCurrency && (
                  <MarketInfoCard
                    chain={selectedChain}
                    router={router}
                    baseCurrency={
                      {
                        ...baseCurrency,
                        icon: currencies.find((c) =>
                          isAddressEqual(c.address, baseCurrency.address),
                        )?.icon,
                      } as Currency
                    }
                    quoteCurrency={
                      {
                        ...quoteCurrency,
                        icon: currencies.find((c) =>
                          isAddressEqual(c.address, quoteCurrency.address),
                        )?.icon,
                      } as Currency
                    }
                    price={selectedMarketSnapshot?.price ?? 0}
                    dollarValue={selectedMarketSnapshot?.priceUSD ?? 0}
                    fdv={selectedMarketSnapshot?.fdv ?? 0}
                    marketCap={selectedMarketSnapshot?.fdv ?? 0}
                    dailyVolume={selectedMarketSnapshot?.volume24hUSD ?? 0}
                    liquidityUsd={
                      selectedMarketSnapshot?.totalValueLockedUSD ?? 0
                    }
                    websiteUrl={''}
                    twitterUrl={''}
                    telegramUrl={''}
                    isFetchingMarketSnapshot={
                      selectedMarketSnapshot === undefined
                    }
                  />
                )}

                <div className="flex flex-col h-full rounded-xl sm:rounded-2xl bg-[#171b24]">
                  <div className="flex lg:hidden w-full h-10">
                    <button
                      disabled={showOrderBook}
                      onClick={() => setShowOrderBook(true)}
                      className="flex-1 h-full px-6 py-2.5 text-gray-500 disabled:text-blue-500 disabled:border-b-2 disabled:border-solid disabled:border-b-blue-500 justify-center items-center gap-1 inline-flex"
                    >
                      <div className="text-[13px] font-semibold">
                        Order Book
                      </div>
                    </button>
                    <button
                      disabled={!showOrderBook}
                      onClick={() => setShowOrderBook(false)}
                      className="flex-1 h-full px-6 py-2.5 text-gray-500 disabled:text-blue-500 disabled:border-b-2 disabled:border-solid disabled:border-b-blue-500 justify-center items-center gap-1 inline-flex"
                    >
                      <div className="text-[13px] font-semibold">Chart</div>
                    </button>
                  </div>

                  {!showOrderBook && baseCurrency ? (
                    !selectedChain.testnet ? (
                      <IframeChartContainer
                        setShowOrderBook={setShowOrderBook}
                        baseCurrency={
                          isAddressEqual(zeroAddress, baseCurrency.address)
                            ? CHAIN_CONFIG.REFERENCE_CURRENCY
                            : baseCurrency
                        }
                        chainName={selectedChain.name.toLowerCase()}
                      />
                    ) : (
                      <NativeChartContainer
                        baseCurrency={baseCurrency}
                        quoteCurrency={quoteCurrency}
                        setShowOrderBook={setShowOrderBook}
                      />
                    )
                  ) : (
                    <></>
                  )}

                  {showOrderBook ? (
                    <OrderBook
                      market={selectedMarket}
                      bids={bids}
                      asks={asks}
                      availableDecimalPlacesGroups={
                        availableDecimalPlacesGroups ?? []
                      }
                      selectedDecimalPlaces={selectedDecimalPlaces}
                      setSelectedDecimalPlaces={setSelectedDecimalPlaces}
                      setDepthClickedIndex={
                        isFetchingQuotes ? () => {} : setDepthClickedIndex
                      }
                      setShowOrderBook={setShowOrderBook}
                      setTab={setTab}
                      className="flex flex-col px-0.5 lg:px-4 pb-4 pt-2 sm:pb-6 bg-[#171b24] rounded-b-xl sm:rounded-2xl gap-[20px] h-[300px] lg:h-full w-full"
                    />
                  ) : (
                    <></>
                  )}
                </div>
              </>
            )}

            {tab === 'swap' && (
              <>
                <div className="hidden sm:flex flex-col h-full rounded-xl sm:rounded-2xl bg-[#171b24]">
                  <SwapRouteList
                    quotes={quotes.all}
                    bestQuote={quotes.best}
                    outputCurrency={outputCurrency}
                    aggregatorNames={aggregators.map((a) => a.name)}
                    selectedQuote={selectedQuote}
                    setSelectedQuote={setSelectedQuote}
                  />
                </div>

                <div className="flex sm:hidden w-full justify-center rounded-2xl bg-[#171b24] p-5">
                  <SwapForm
                    chain={selectedChain}
                    explorerUrl={
                      selectedChain.blockExplorers?.default?.url ?? ''
                    }
                    currencies={currencies}
                    setCurrencies={setCurrencies}
                    balances={balances}
                    prices={prices}
                    showInputCurrencySelect={showInputCurrencySelect}
                    setShowInputCurrencySelect={setShowInputCurrencySelect}
                    inputCurrency={inputCurrency}
                    setInputCurrency={setInputCurrency}
                    inputCurrencyAmount={inputCurrencyAmount}
                    setInputCurrencyAmount={setInputCurrencyAmount}
                    availableInputCurrencyBalance={
                      inputCurrency
                        ? (balances[inputCurrency.address] ?? 0n)
                        : 0n
                    }
                    showOutputCurrencySelect={showOutputCurrencySelect}
                    setShowOutputCurrencySelect={setShowOutputCurrencySelect}
                    outputCurrency={outputCurrency}
                    setOutputCurrency={setOutputCurrency}
                    outputCurrencyAmount={formatUnits(
                      selectedQuote?.amountOut ?? 0n,
                      outputCurrency?.decimals ?? 18,
                    )}
                    slippageInput={slippageInput}
                    setSlippageInput={setSlippageInput}
                    aggregatorName={selectedQuote?.aggregator?.name ?? ''}
                    gasEstimateValue={
                      parseFloat(
                        formatUnits(
                          BigInt(selectedQuote?.gasLimit ?? 0n) *
                            (gasPrice ?? 0n),
                          selectedChain.nativeCurrency.decimals,
                        ),
                      ) * (prices[zeroAddress] ?? 0)
                    }
                    priceImpact={priceImpact}
                    refreshQuotesAction={() => setLatestRefreshTime(Date.now())}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col items-start gap-3">
            <div className="hidden sm:flex flex-col rounded-2xl bg-[#171b24] p-6 w-fit sm:w-[480px] h-[626px]">
              {tab === 'limit' ? (
                <LimitForm
                  chain={selectedChain}
                  explorerUrl={selectedChain.blockExplorers?.default?.url ?? ''}
                  prices={prices}
                  balances={balances}
                  currencies={currencies}
                  setCurrencies={setCurrencies}
                  priceInput={priceInput}
                  setPriceInput={setPriceInput}
                  selectedMarket={selectedMarket}
                  isBid={isBid}
                  showInputCurrencySelect={showInputCurrencySelect}
                  setShowInputCurrencySelect={setShowInputCurrencySelect}
                  inputCurrency={inputCurrency}
                  setInputCurrency={setInputCurrency}
                  inputCurrencyAmount={inputCurrencyAmount}
                  setInputCurrencyAmount={setInputCurrencyAmount}
                  availableInputCurrencyBalance={
                    inputCurrency ? (balances[inputCurrency.address] ?? 0n) : 0n
                  }
                  showOutputCurrencySelect={showOutputCurrencySelect}
                  setShowOutputCurrencySelect={setShowOutputCurrencySelect}
                  outputCurrency={outputCurrency}
                  setOutputCurrency={setOutputCurrency}
                  outputCurrencyAmount={outputCurrencyAmount}
                  setOutputCurrencyAmount={setOutputCurrencyAmount}
                  availableOutputCurrencyBalance={
                    outputCurrency
                      ? (balances[outputCurrency.address] ?? 0n)
                      : 0n
                  }
                  swapInputCurrencyAndOutputCurrency={() => {
                    setIsBid((prevState) => !prevState)
                    setDepthClickedIndex(undefined)
                    setInputCurrencyAmount(outputCurrencyAmount)

                    // swap currencies
                    const _inputCurrency = inputCurrency
                    setInputCurrency(outputCurrency)
                    setOutputCurrency(_inputCurrency)
                  }}
                  minimumDecimalPlaces={
                    availableDecimalPlacesGroups?.[0]?.value
                  }
                  marketPrice={marketPrice}
                  marketRateDiff={marketRateDiff}
                  setMarketRateAction={{
                    isLoading: isFetchingQuotes,
                    action: async () => {
                      await setMarketRateAction()
                    },
                  }}
                  closeLimitFormAction={() => setShowMobileModal(false)}
                  actionButtonProps={{
                    disabled:
                      !!walletClient &&
                      (!inputCurrency ||
                        !outputCurrency ||
                        priceInput === '' ||
                        (selectedMarket &&
                          !isAddressesEqual(
                            [inputCurrency.address, outputCurrency.address],
                            [
                              selectedMarket.base.address,
                              selectedMarket.quote.address,
                            ],
                          )) ||
                        amountIn === 0n ||
                        amountIn > (balances[inputCurrency.address] ?? 0n)),
                    onClick: async () => {
                      if (!walletClient && openConnectModal) {
                        openConnectModal()
                      }
                      if (
                        !inputCurrency ||
                        !outputCurrency ||
                        !selectedMarket
                      ) {
                        return
                      }
                      if (marketRateDiff < -2) {
                        setShowWarningModal(true)
                        return
                      }
                      await limit(
                        inputCurrency,
                        outputCurrency,
                        inputCurrencyAmount,
                        priceInput,
                        selectedMarket,
                      )
                    },
                    text: !walletClient
                      ? 'Connect wallet'
                      : !inputCurrency
                        ? 'Select input currency'
                        : !outputCurrency
                          ? 'Select output currency'
                          : amountIn === 0n
                            ? 'Enter amount'
                            : amountIn > balances[inputCurrency.address]
                              ? 'Insufficient balance'
                              : `Place Order`,
                  }}
                />
              ) : (
                <SwapForm
                  chain={selectedChain}
                  explorerUrl={selectedChain.blockExplorers?.default?.url ?? ''}
                  currencies={currencies}
                  setCurrencies={setCurrencies}
                  balances={balances}
                  prices={prices}
                  showInputCurrencySelect={showInputCurrencySelect}
                  setShowInputCurrencySelect={setShowInputCurrencySelect}
                  inputCurrency={inputCurrency}
                  setInputCurrency={setInputCurrency}
                  inputCurrencyAmount={inputCurrencyAmount}
                  setInputCurrencyAmount={setInputCurrencyAmount}
                  availableInputCurrencyBalance={
                    inputCurrency ? (balances[inputCurrency.address] ?? 0n) : 0n
                  }
                  showOutputCurrencySelect={showOutputCurrencySelect}
                  setShowOutputCurrencySelect={setShowOutputCurrencySelect}
                  outputCurrency={outputCurrency}
                  setOutputCurrency={setOutputCurrency}
                  outputCurrencyAmount={formatUnits(
                    selectedQuote?.amountOut ?? 0n,
                    outputCurrency?.decimals ?? 18,
                  )}
                  slippageInput={slippageInput}
                  setSlippageInput={setSlippageInput}
                  aggregatorName={selectedQuote?.aggregator?.name ?? ''}
                  gasEstimateValue={selectedQuote?.gasUsd ?? 0}
                  priceImpact={priceImpact}
                  refreshQuotesAction={() => setLatestRefreshTime(Date.now())}
                  closeSwapFormAction={() => setShowMobileModal(false)}
                  actionButtonProps={{
                    disabled:
                      (Number(inputCurrencyAmount) > 0 &&
                        (selectedQuote?.amountOut ?? 0n) === 0n) ||
                      !inputCurrency ||
                      !outputCurrency ||
                      amountIn === 0n ||
                      amountIn > balances[inputCurrency.address],
                    onClick: async () => {
                      if (!userAddress && openConnectModal) {
                        openConnectModal()
                      }

                      if (
                        !gasPrice ||
                        !userAddress ||
                        !inputCurrency ||
                        !outputCurrency ||
                        !inputCurrencyAmount ||
                        !selectedQuote ||
                        amountIn !== selectedQuote.amountIn ||
                        !selectedQuote.transaction
                      ) {
                        return
                      }
                      await swap(
                        inputCurrency,
                        amountIn,
                        outputCurrency,
                        selectedQuote.amountOut,
                        aggregators.find(
                          (aggregator) =>
                            aggregator.name === selectedQuote.aggregator.name,
                        )!,
                        selectedQuote.transaction,
                      )
                    },
                    text:
                      Number(inputCurrencyAmount) > 0 &&
                      (selectedQuote?.amountOut ?? 0n) === 0n
                        ? 'Fetching...'
                        : !walletClient
                          ? 'Connect wallet'
                          : !inputCurrency
                            ? 'Select input currency'
                            : !outputCurrency
                              ? 'Select output currency'
                              : amountIn === 0n
                                ? 'Enter amount'
                                : amountIn > balances[inputCurrency.address]
                                  ? 'Insufficient balance'
                                  : isAddressEqual(
                                        inputCurrency.address,
                                        zeroAddress,
                                      ) &&
                                      isAddressEqual(
                                        outputCurrency.address,
                                        CHAIN_CONFIG.REFERENCE_CURRENCY.address,
                                      )
                                    ? 'Wrap'
                                    : isAddressEqual(
                                          inputCurrency.address,
                                          CHAIN_CONFIG.REFERENCE_CURRENCY
                                            .address,
                                        ) &&
                                        isAddressEqual(
                                          outputCurrency.address,
                                          zeroAddress,
                                        )
                                      ? 'Unwrap'
                                      : `Swap`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
        {tab === 'limit' && userAddress && openOrders.length > 0 ? (
          <>
            <div className="flex flex-col w-full lg:flex-row gap-4 lg:gap-0 mt-[20px] mb-4 lg:mt-12 text-white">
              <div className="border-b-blue-500 text-[13px] lg:text-base border-solid lg:border-0 flex w-1/2 lg:w-[161px] h-[37px] px-6 lg:px-0 lg:justify-start pt-1.5 pb-2.5 border-b-2 border-[#ffc32d] justify-center items-center gap-2">
                <div className="text-white font-semibold">Open Order</div>
                <div className="flex px-2 py-0.5 lg:h-7 lg:px-2.5 lg:py-0.5 bg-blue-500/20 rounded-[17.02px] flex-col justify-center items-center">
                  <div className="text-blue-500 text-[13px] font-semibold">
                    {filteredOpenOrders.length}
                  </div>
                </div>
              </div>

              <div className="flex flex-row mb-4 gap-5 max-w-[480px] lg:max-w-full lg:ml-auto lg:flex-row-reverse">
                <div className="w-full lg:w-[246px] flex flex-col relative rounded shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <div className="relative h-4 w-4">
                      <SearchSvg />
                    </div>
                  </div>
                  <div className="inline-block">
                    <div className="invisible h-0 mx-[29px]" aria-hidden="true">
                      Search by symbol
                    </div>
                    <input
                      type="search"
                      name="open-order-search"
                      id="search"
                      autoComplete="off"
                      className="inline w-full pl-10 py-1.5 lg:py-2.5 text-white bg-transparent rounded-xl border border-solid border-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-400 flex-col placeholder:text-gray-400 text-xs sm:text-sm"
                      placeholder="Search tokens"
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                    />
                  </div>
                </div>

                <button className="flex justify-start items-center gap-2">
                  <CheckIcon
                    checked={searchInCurrentMarket}
                    onCheck={setSearchInCurrentMarket}
                    text="Current Market"
                  />
                </button>
              </div>
            </div>

            {/*pc open order card*/}
            {filteredOpenOrders.length > 0 ? (
              <div className="hidden lg:flex flex-col w-full justify-start items-center gap-4 bg-transparent mb-14">
                <div className="w-full justify-start items-end inline-flex">
                  <div className="flex text-gray-50 text-sm font-semibold">
                    <div className="flex w-[225px] ml-5">Market</div>
                    <div className="flex w-[145px]">Price</div>
                    <div className="flex w-[200px]">Amount</div>
                    <div className="flex w-[100px]">Filled</div>
                    <div className="flex w-[200px]">Claimable</div>
                  </div>
                  <div className="h-full ml-auto justify-center items-center gap-3 flex">
                    <ActionButton
                      disabled={claimableOpenOrders.length === 0}
                      onClick={async () => {
                        await claims(claimableOpenOrders)
                      }}
                      text="Claim All"
                      className="disabled:text-gray-400 text-white text-[13px] font-semibold w-[110px] h-8 px-3 py-1.5 disabled:bg-[#2b3544] bg-blue-500 rounded-[10px] justify-center items-center flex"
                    />
                    <ActionButton
                      disabled={cancellableOpenOrders.length === 0}
                      onClick={async () => {
                        await cancels(cancellableOpenOrders)
                      }}
                      text="Cancel All"
                      className="disabled:text-gray-400 text-white text-[13px] font-semibold w-[110px] h-8 px-3 py-1.5 disabled:bg-[#2b3544] bg-blue-500 rounded-[10px] justify-center items-center flex"
                    />
                  </div>
                </div>

                <OpenOrderCardList
                  userAddress={userAddress}
                  openOrders={filteredOpenOrders}
                  claims={claims}
                  cancels={cancels}
                  router={router}
                />
              </div>
            ) : (
              <></>
            )}

            {/*mobile open order card*/}
            <div className="flex lg:hidden w-full justify-center mb-28 sm:mb-0">
              <div className="flex flex-col w-full lg:w-auto h-full lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredOpenOrders.length > 0 ? (
                  <div className="flex ml-auto h-6 opacity-80 justify-start items-center gap-2">
                    <button
                      disabled={claimableOpenOrders.length === 0}
                      onClick={async () => {
                        await claims(claimableOpenOrders)
                      }}
                      className="flex flex-1 w-[95px] px-3 py-1 disabled:bg-[#2b3544] bg-[#3B82F6]/20 rounded-lg justify-center items-center disabled:text-gray-400 text-[#3B82F6] text-[13px] font-semibold"
                    >
                      Claim All
                    </button>
                    <button
                      disabled={cancellableOpenOrders.length === 0}
                      onClick={async () => {
                        await cancels(cancellableOpenOrders)
                      }}
                      className="flex flex-1 w-[95px] px-3 py-1 disabled:bg-[#2b3544] bg-[#3B82F6]/20 rounded-lg justify-center items-center disabled:text-gray-400 text-[#3B82F6] text-[13px] font-semibold"
                    >
                      Cancel All
                    </button>
                  </div>
                ) : (
                  <></>
                )}

                <OpenOrderCardList
                  userAddress={userAddress}
                  openOrders={filteredOpenOrders}
                  claims={claims}
                  cancels={cancels}
                  router={router}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="hidden sm:flex mb-28 lg:mb-2" />
        )}
      </div>

      {/*mobile fixed bottom modal*/}
      <div className="fixed flex w-full overflow-y-scroll sm:hidden bottom-0 z-[1000]">
        <div
          className={`${
            showMobileModal ? 'flex' : 'hidden'
          } w-full h-full fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm`}
          onClick={() => setShowMobileModal(false)}
        />
        <div className="w-full h-full top-0 absolute bg-[#171b24] shadow rounded-tl-2xl rounded-tr-2xl border" />
        <div className="z-[10000] w-full flex flex-col px-5 pt-5 pb-3">
          <div
            className={`${
              showMobileModal ? 'flex max-h-[560px]' : 'hidden'
            } flex-col mb-5`}
          >
            {tab === 'limit' ? (
              <LimitForm
                chain={selectedChain}
                explorerUrl={selectedChain.blockExplorers?.default?.url ?? ''}
                prices={prices}
                balances={balances}
                currencies={currencies}
                setCurrencies={setCurrencies}
                priceInput={priceInput}
                setPriceInput={setPriceInput}
                selectedMarket={selectedMarket}
                isBid={isBid}
                showInputCurrencySelect={showInputCurrencySelect}
                setShowInputCurrencySelect={setShowInputCurrencySelect}
                inputCurrency={inputCurrency}
                setInputCurrency={setInputCurrency}
                inputCurrencyAmount={inputCurrencyAmount}
                setInputCurrencyAmount={setInputCurrencyAmount}
                availableInputCurrencyBalance={
                  inputCurrency ? (balances[inputCurrency.address] ?? 0n) : 0n
                }
                showOutputCurrencySelect={showOutputCurrencySelect}
                setShowOutputCurrencySelect={setShowOutputCurrencySelect}
                outputCurrency={outputCurrency}
                setOutputCurrency={setOutputCurrency}
                outputCurrencyAmount={outputCurrencyAmount}
                setOutputCurrencyAmount={setOutputCurrencyAmount}
                availableOutputCurrencyBalance={
                  outputCurrency ? (balances[outputCurrency.address] ?? 0n) : 0n
                }
                swapInputCurrencyAndOutputCurrency={() => {
                  setIsBid((prevState) => !prevState)
                  setDepthClickedIndex(undefined)
                  setInputCurrencyAmount(outputCurrencyAmount)

                  // swap currencies
                  const _inputCurrency = inputCurrency
                  setInputCurrency(outputCurrency)
                  setOutputCurrency(_inputCurrency)
                }}
                minimumDecimalPlaces={availableDecimalPlacesGroups?.[0]?.value}
                marketPrice={marketPrice}
                marketRateDiff={marketRateDiff}
                setMarketRateAction={{
                  isLoading: isFetchingQuotes,
                  action: async () => {
                    await setMarketRateAction()
                  },
                }}
                closeLimitFormAction={() => setShowMobileModal(false)}
                actionButtonProps={{
                  disabled:
                    !!walletClient &&
                    (!inputCurrency ||
                      !outputCurrency ||
                      priceInput === '' ||
                      (selectedMarket &&
                        !isAddressesEqual(
                          [inputCurrency.address, outputCurrency.address],
                          [
                            selectedMarket.base.address,
                            selectedMarket.quote.address,
                          ],
                        )) ||
                      amountIn === 0n ||
                      amountIn > (balances[inputCurrency.address] ?? 0n)),
                  onClick: async () => {
                    if (!walletClient && openConnectModal) {
                      openConnectModal()
                    }
                    if (!inputCurrency || !outputCurrency || !selectedMarket) {
                      return
                    }
                    if (marketRateDiff < -2) {
                      setShowWarningModal(true)
                      return
                    }
                    await limit(
                      inputCurrency,
                      outputCurrency,
                      inputCurrencyAmount,
                      priceInput,
                      selectedMarket,
                    )
                  },
                  text: !walletClient
                    ? 'Connect wallet'
                    : !inputCurrency
                      ? 'Select input currency'
                      : !outputCurrency
                        ? 'Select output currency'
                        : amountIn === 0n
                          ? 'Enter amount'
                          : amountIn > balances[inputCurrency.address]
                            ? 'Insufficient balance'
                            : `Place Order`,
                }}
              />
            ) : (
              <div className="flex flex-col gap-4">
                <button
                  className="flex sm:hidden w-5 h-5 ml-auto"
                  onClick={() => setShowMobileModal(false)}
                >
                  <CloseSvg />
                </button>

                <div className="flex flex-col w-full mb-4">
                  <SwapRouteList
                    quotes={quotes.all}
                    bestQuote={quotes.best}
                    outputCurrency={outputCurrency}
                    aggregatorNames={aggregators.map((a) => a.name)}
                    selectedQuote={selectedQuote}
                    setSelectedQuote={setSelectedQuote}
                  />
                </div>

                <ActionButton
                  disabled={
                    (Number(inputCurrencyAmount) > 0 &&
                      (selectedQuote?.amountOut ?? 0n) === 0n) ||
                    !inputCurrency ||
                    !outputCurrency ||
                    amountIn === 0n ||
                    amountIn > balances[inputCurrency.address]
                  }
                  onClick={async () => {
                    if (!userAddress && openConnectModal) {
                      openConnectModal()
                    }

                    if (
                      !gasPrice ||
                      !userAddress ||
                      !inputCurrency ||
                      !outputCurrency ||
                      !inputCurrencyAmount ||
                      !selectedQuote ||
                      amountIn !== selectedQuote.amountIn ||
                      !selectedQuote.transaction
                    ) {
                      return
                    }
                    await swap(
                      inputCurrency,
                      amountIn,
                      outputCurrency,
                      selectedQuote.amountOut,
                      aggregators.find(
                        (aggregator) =>
                          aggregator.name === selectedQuote.aggregator.name,
                      )!,
                      selectedQuote.transaction,
                    )
                  }}
                  text={
                    Number(inputCurrencyAmount) > 0 &&
                    (selectedQuote?.amountOut ?? 0n) === 0n
                      ? 'Fetching...'
                      : !walletClient
                        ? 'Connect wallet'
                        : !inputCurrency
                          ? 'Select input currency'
                          : !outputCurrency
                            ? 'Select output currency'
                            : amountIn === 0n
                              ? 'Enter amount'
                              : amountIn > balances[inputCurrency.address]
                                ? 'Insufficient balance'
                                : isAddressEqual(
                                      inputCurrency.address,
                                      zeroAddress,
                                    ) &&
                                    isAddressEqual(
                                      outputCurrency.address,
                                      CHAIN_CONFIG.REFERENCE_CURRENCY.address,
                                    )
                                  ? 'Wrap'
                                  : isAddressEqual(
                                        inputCurrency.address,
                                        CHAIN_CONFIG.REFERENCE_CURRENCY.address,
                                      ) &&
                                      isAddressEqual(
                                        outputCurrency.address,
                                        zeroAddress,
                                      )
                                    ? 'Unwrap'
                                    : `Swap`
                  }
                />
              </div>
            )}
          </div>

          <button
            onClick={() => setShowMobileModal(true)}
            disabled={tab === 'swap' && amountIn === 0n}
            className={`disabled:bg-[#2b3544] disabled:text-gray-400 text-white w-full ${
              showMobileModal ? 'hidden' : 'flex'
            } h-12 bg-blue-500 rounded-xl justify-center items-center mb-5`}
          >
            <div className="grow shrink basis-0 opacity-90 text-center text-base font-semibold">
              {tab === 'limit' ? 'Make order' : 'Quotes'}
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
