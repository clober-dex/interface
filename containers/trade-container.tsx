import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAddress, isAddressEqual, parseUnits, zeroAddress } from 'viem'
import { useAccount, useGasPrice, useWalletClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getQuoteToken } from '@clober/v2-sdk'
import BigNumber from 'bignumber.js'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/router'

import { LimitForm, LimitFormProps } from '../components/form/limit-form'
import OrderBook from '../components/order-book'
import { useChainContext } from '../contexts/chain-context'
import { useMarketContext } from '../contexts/trade/market-context'
import { useLimitContractContext } from '../contexts/trade/limit-contract-context'
import { useCurrencyContext } from '../contexts/currency-context'
import { isAddressesEqual } from '../utils/address'
import { fetchQuotes } from '../apis/swap/quote'
import { aggregators } from '../chain-configs/aggregators'
import { formatUnits } from '../utils/bigint'
import { toPlacesString } from '../utils/bignumber'
import { MarketInfoCard } from '../components/card/market/market-info-card'
import { ActionButton } from '../components/button/action-button'
import { Currency } from '../model/currency'
import WarningLimitModal from '../components/modal/warning-limit-modal'
import { useTradeContext } from '../contexts/trade/trade-context'
import { SwapForm, SwapFormProps } from '../components/form/swap-form'
import { useSwapContractContext } from '../contexts/trade/swap-contract-context'
import { fetchPrice } from '../apis/price'
import { CHAIN_CONFIG } from '../chain-configs'
import { SwapRouteList } from '../components/swap-router-list'
import { Quote } from '../model/aggregator/quote'
import CloseSvg from '../components/svg/close-svg'

import { IframeChartContainer } from './chart/iframe-chart-container'
import { NativeChartContainer } from './chart/native-chart-container'
import { OpenOrderContainer } from './open-order-container'

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
  const { limit } = useLimitContractContext()
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
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

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

  const marketRateDiff = useMemo(
    () =>
      (isBid
        ? new BigNumber(marketPrice).dividedBy(priceInput).minus(1).times(100)
        : new BigNumber(priceInput).dividedBy(marketPrice).minus(1).times(100)
      ).toNumber(),
    [isBid, marketPrice, priceInput],
  )

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

  const limitActionButtonProps = useMemo(
    () => ({
      disabled:
        !!walletClient &&
        (!inputCurrency ||
          !outputCurrency ||
          priceInput === '' ||
          (selectedMarket &&
            !isAddressesEqual(
              [inputCurrency.address, outputCurrency.address],
              [selectedMarket.base.address, selectedMarket.quote.address],
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
    }),
    [
      amountIn,
      balances,
      inputCurrency,
      inputCurrencyAmount,
      limit,
      marketRateDiff,
      openConnectModal,
      outputCurrency,
      priceInput,
      selectedMarket,
      walletClient,
    ],
  )

  const limitFormProps = useMemo(
    () =>
      ({
        chain: selectedChain,
        explorerUrl: selectedChain.blockExplorers?.default?.url ?? '',
        prices,
        balances,
        currencies,
        setCurrencies,
        priceInput,
        setPriceInput,
        selectedMarket,
        isBid,
        showInputCurrencySelect,
        setShowInputCurrencySelect,
        inputCurrency,
        setInputCurrency,
        inputCurrencyAmount,
        setInputCurrencyAmount,
        availableInputCurrencyBalance: inputCurrency
          ? (balances[inputCurrency.address] ?? 0n)
          : 0n,
        showOutputCurrencySelect,
        setShowOutputCurrencySelect,
        outputCurrency,
        setOutputCurrency,
        outputCurrencyAmount,
        setOutputCurrencyAmount,
        availableOutputCurrencyBalance: outputCurrency
          ? (balances[outputCurrency.address] ?? 0n)
          : 0n,
        swapInputCurrencyAndOutputCurrency: () => {
          setIsBid((prevState) => !prevState)
          setDepthClickedIndex(undefined)
          setInputCurrencyAmount(outputCurrencyAmount)

          // swap currencies
          const _inputCurrency = inputCurrency
          setInputCurrency(outputCurrency)
          setOutputCurrency(_inputCurrency)
        },
        minimumDecimalPlaces: availableDecimalPlacesGroups?.[0]?.value,
        marketPrice,
        marketRateDiff,
        setMarketRateAction: {
          isLoading: isFetchingQuotes,
          action: async () => {
            await setMarketRateAction()
          },
        },
        closeLimitFormAction: () => setShowMobileModal(false),
        actionButtonProps: limitActionButtonProps,
      }) as LimitFormProps,
    [
      availableDecimalPlacesGroups,
      balances,
      currencies,
      inputCurrency,
      inputCurrencyAmount,
      isBid,
      isFetchingQuotes,
      limitActionButtonProps,
      marketPrice,
      marketRateDiff,
      outputCurrency,
      outputCurrencyAmount,
      priceInput,
      prices,
      selectedChain,
      selectedMarket,
      setCurrencies,
      setDepthClickedIndex,
      setInputCurrency,
      setInputCurrencyAmount,
      setIsBid,
      setMarketRateAction,
      setOutputCurrency,
      setOutputCurrencyAmount,
      setPriceInput,
      setShowInputCurrencySelect,
      setShowOutputCurrencySelect,
      showInputCurrencySelect,
      showOutputCurrencySelect,
    ],
  )

  const swapActionButtonProps = useMemo(
    () => ({
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
            (aggregator) => aggregator.name === selectedQuote.aggregator.name,
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
                    : isAddressEqual(inputCurrency.address, zeroAddress) &&
                        isAddressEqual(
                          outputCurrency.address,
                          CHAIN_CONFIG.REFERENCE_CURRENCY.address,
                        )
                      ? 'Wrap'
                      : isAddressEqual(
                            inputCurrency.address,
                            CHAIN_CONFIG.REFERENCE_CURRENCY.address,
                          ) &&
                          isAddressEqual(outputCurrency.address, zeroAddress)
                        ? 'Unwrap'
                        : `Swap`,
    }),
    [
      amountIn,
      balances,
      gasPrice,
      inputCurrency,
      inputCurrencyAmount,
      openConnectModal,
      outputCurrency,
      selectedQuote,
      swap,
      userAddress,
      walletClient,
    ],
  )

  const swapFormProps = useMemo(
    () =>
      ({
        chain: selectedChain,
        explorerUrl: selectedChain.blockExplorers?.default?.url ?? '',
        currencies,
        setCurrencies,
        balances,
        prices,
        showInputCurrencySelect,
        setShowInputCurrencySelect,
        inputCurrency,
        setInputCurrency,
        inputCurrencyAmount,
        setInputCurrencyAmount,
        availableInputCurrencyBalance: inputCurrency
          ? (balances[inputCurrency.address] ?? 0n)
          : 0n,
        showOutputCurrencySelect,
        setShowOutputCurrencySelect,
        outputCurrency,
        setOutputCurrency,
        outputCurrencyAmount: formatUnits(
          selectedQuote?.amountOut ?? 0n,
          outputCurrency?.decimals ?? 18,
        ),
        slippageInput,
        setSlippageInput,
        aggregatorName: selectedQuote?.aggregator?.name ?? '',
        gasEstimateValue: selectedQuote?.gasUsd ?? 0,
        priceImpact: priceImpact,
        refreshQuotesAction: () => setLatestRefreshTime(Date.now()),
      }) as SwapFormProps,
    [
      balances,
      currencies,
      inputCurrency,
      inputCurrencyAmount,
      outputCurrency,
      priceImpact,
      prices,
      selectedChain,
      selectedQuote?.aggregator?.name,
      selectedQuote?.amountOut,
      selectedQuote?.gasUsd,
      setCurrencies,
      setInputCurrency,
      setInputCurrencyAmount,
      setOutputCurrency,
      setShowInputCurrencySelect,
      setShowOutputCurrencySelect,
      setSlippageInput,
      showInputCurrencySelect,
      showOutputCurrencySelect,
      slippageInput,
    ],
  )

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
                  <SwapForm {...swapFormProps} />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col items-start gap-3">
            <div className="hidden sm:flex flex-col rounded-2xl bg-[#171b24] p-6 w-fit sm:w-[480px] h-[626px]">
              {tab === 'limit' ? (
                <LimitForm {...limitFormProps} />
              ) : (
                <SwapForm
                  {...swapFormProps}
                  closeSwapFormAction={() => setShowMobileModal(false)}
                  actionButtonProps={swapActionButtonProps}
                />
              )}
            </div>
          </div>
        </div>

        {tab === 'limit' && userAddress ? (
          <OpenOrderContainer selectedMarket={selectedMarket} />
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
              <LimitForm {...limitFormProps} />
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

                <ActionButton {...swapActionButtonProps} />
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
