import React, { useEffect, useMemo, useState } from 'react'
import { getAddress, isAddressEqual, parseUnits, zeroAddress } from 'viem'
import { useAccount, useGasPrice, useWalletClient } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { getContractAddresses } from '@clober/v2-sdk'

import { LimitForm, LimitFormProps } from '../components/form/limit-form'
import OrderBook from '../components/order-book'
import { useChainContext } from '../contexts/chain-context'
import { useMarketContext } from '../contexts/trade/market-context'
import { useLimitContractContext } from '../contexts/trade/limit-contract-context'
import { useCurrencyContext } from '../contexts/currency-context'
import { isAddressesEqual } from '../utils/address'
import { aggregators } from '../chain-configs/aggregators'
import { applyPercent, formatUnits, max } from '../utils/bigint'
import { MarketInfoCard } from '../components/card/market/market-info-card'
import { Currency } from '../model/currency'
import WarningLimitModal from '../components/modal/warning-limit-modal'
import { useTradeContext } from '../contexts/trade/trade-context'
import { SwapForm, SwapFormProps } from '../components/form/swap-form'
import { useSwapContractContext } from '../contexts/trade/swap-contract-context'
import { CHAIN_CONFIG } from '../chain-configs'
import { SwapRouteList } from '../components/swap-router-list'
import { MobileFixedModal } from '../components/modal/mobile-fixed-modal'

import { IframeChartContainer } from './chart/iframe-chart-container'
import { NativeChartContainer } from './chart/native-chart-container'
import { OpenOrderContainer } from './open-order-container'

const MetaAggregatorInfo = ({ currencies }: { currencies: Currency[] }) => {
  const shuffledCurrencies = useMemo(() => {
    return currencies
      .filter(
        (currency) =>
          currency.icon && !isAddressEqual(currency.address, zeroAddress),
      )
      .sort(() => Math.random() - 0.5)
  }, [currencies])

  return (
    <div className="hidden lg:block">
      <div className="absolute flex justify-center w-full top-40 z-[2]">
        <Image
          className="rounded-xl"
          src="/chain-configs/meta-aggregator-logo.svg"
          alt="Meta Aggregator"
          width={94}
          height={94}
        />
      </div>

      <div className="w-full flex justify-center absolute top-1/4">
        <div className="w-full md:w-[616px] overflow-x-hidden mt-4 sm:mt-8 relative">
          <div className="flex w-max animate-marquee items-center">
            {shuffledCurrencies.map((currency, i) => {
              return (
                <button
                  key={`icon-${i}`}
                  className="group relative flex flex-col items-center mx-10 z-[10]"
                >
                  <div className="justify-center items-center flex w-[54px] h-[54px] transition-transform duration-300 transform group-hover:scale-125 bg-gray-800 rounded-xl shadow-[0px_4px_4px_0px_rgba(19,21,25,0.40)]">
                    <Image
                      className="flex rounded-full"
                      alt={`${currency.address}-${i}`}
                      src={currency.icon || '/unknown.svg'}
                      width={28}
                      height={28}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-[30%] items-center justify-center w-full text-center gap-4">
        <div className="flex flex-col gap-4">
          <span className="text-center justify-center text-blue-400 text-lg font-bold leading-normal">
            One Interface. Every Route, Optimized.
          </span>
          <div className="self-stretch text-center justify-start text-Gray-300 text-[13px] font-light">
            {CHAIN_CONFIG.DEX_NAME} intelligently scans across multiple DEX
            aggregators
            <br />
            in real time to deliver the best execution for your trade.
            <br />
            No need to compare paths manually.
            <br />
            {CHAIN_CONFIG.DEX_NAME} finds the most efficient route for you,
            behind the scenes.
          </div>
        </div>
      </div>
    </div>
  )
}

export const TradeContainer = () => {
  const router = useRouter()
  const { data: gasPrice } = useGasPrice()
  const { selectedChain } = useChainContext()
  const {
    selectedMarket,
    selectedMarketSnapshot,
    selectedTokenInfo,
    availableDecimalPlacesGroups,
    bids,
    asks,
    depthClickedIndex,
    setDepthClickedIndex,
    onChainPrice,
    setMarketRateAction,
    priceDeviationPercent,
    quoteCurrency,
    baseCurrency,
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
  } = useTradeContext()

  const { openConnectModal } = useConnectModal()
  const { balances, getAllowance, prices, currencies, setCurrencies } =
    useCurrencyContext()
  const [showMobileModal, setShowMobileModal] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)

  const [showMetaInfo, setShowMetaInfo] = useState(false)

  const amountIn = useMemo(
    () => parseUnits(inputCurrencyAmount, inputCurrency?.decimals ?? 18),
    [inputCurrency?.decimals, inputCurrencyAmount],
  )

  useEffect(() => {
    if (tab === 'swap' && amountIn === 0n) {
      const timer = setTimeout(() => {
        setShowMetaInfo(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setShowMetaInfo(false)
    }
  }, [amountIn, tab])

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
          amountIn > balances[inputCurrency.address]),
      onClick: async () => {
        if (!walletClient && openConnectModal) {
          openConnectModal()
        }
        if (!inputCurrency || !outputCurrency || !selectedMarket) {
          return
        }
        if (priceDeviationPercent < -2) {
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
                : amountIn >
                    getAllowance(
                      getContractAddresses({ chainId: selectedChain.id })
                        .Controller,
                      inputCurrency,
                    )
                  ? `Max Approve ${inputCurrency.symbol}`
                  : `Place Order`,
    }),
    [
      getAllowance,
      selectedChain.id,
      amountIn,
      balances,
      inputCurrency,
      inputCurrencyAmount,
      limit,
      priceDeviationPercent,
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
        depthClickedIndex,
        showInputCurrencySelect,
        setShowInputCurrencySelect,
        inputCurrency,
        setInputCurrency,
        inputCurrencyAmount,
        setInputCurrencyAmount,
        availableInputCurrencyBalance: inputCurrency
          ? balances[inputCurrency.address]
          : 0n,
        showOutputCurrencySelect,
        setShowOutputCurrencySelect,
        outputCurrency,
        setOutputCurrency,
        outputCurrencyAmount,
        setOutputCurrencyAmount,
        availableOutputCurrencyBalance: outputCurrency
          ? balances[outputCurrency.address]
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
        onChainPrice,
        priceDeviationPercent,
        setMarketRateAction: {
          isLoading: isFetchingOnChainPrice,
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
      depthClickedIndex,
      inputCurrency,
      inputCurrencyAmount,
      isBid,
      isFetchingOnChainPrice,
      limitActionButtonProps,
      onChainPrice,
      priceDeviationPercent,
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
          selectedQuote.amountOut - selectedQuote.fee,
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
                    : amountIn >
                        getAllowance(
                          CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES
                            .AggregatorRouterGateway,
                          inputCurrency,
                        )
                      ? `Max Approve ${inputCurrency.symbol}`
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
      getAllowance,
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
          ? balances[inputCurrency.address]
          : 0n,
        showOutputCurrencySelect,
        setShowOutputCurrencySelect,
        outputCurrency,
        setOutputCurrency,
        outputCurrencyAmount: formatUnits(
          max((selectedQuote?.amountOut ?? 0n) - (quotes.best?.fee ?? 0n), 0n),
          outputCurrency?.decimals ?? 18,
        ),
        minimumReceivedAmount: formatUnits(
          applyPercent(
            max(
              (selectedQuote?.amountOut ?? 0n) - (quotes.best?.fee ?? 0n),
              0n,
            ),
            100 - Number(slippageInput),
          ),
          outputCurrency?.decimals ?? 18,
        ),
        slippageInput,
        setSlippageInput,
        aggregatorName: selectedQuote?.aggregator?.name ?? '',
        gasEstimateValue: selectedQuote?.gasUsd ?? 0,
        priceImpact,
        isRefreshing,
        refreshQuotesAction,
      }) as SwapFormProps,
    [
      quotes.best?.fee,
      balances,
      currencies,
      inputCurrency,
      inputCurrencyAmount,
      outputCurrency,
      priceImpact,
      prices,
      isRefreshing,
      refreshQuotesAction,
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
      slippageInput,
      setSlippageInput,
      showInputCurrencySelect,
      showOutputCurrencySelect,
    ],
  )

  return (
    <>
      {showWarningModal ? (
        <WarningLimitModal
          onChainPrice={onChainPrice}
          priceInput={priceInput}
          priceDeviationPercent={priceDeviationPercent}
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
                    price={
                      selectedTokenInfo?.price ||
                      selectedMarketSnapshot?.price ||
                      0
                    }
                    dollarValue={
                      selectedTokenInfo?.priceUsd ||
                      selectedMarketSnapshot?.priceUSD ||
                      0
                    }
                    fdv={
                      selectedTokenInfo?.fdv || selectedMarketSnapshot?.fdv || 0
                    }
                    marketCap={
                      selectedTokenInfo?.marketCap ||
                      selectedMarketSnapshot?.fdv ||
                      0
                    }
                    dailyVolume={
                      selectedTokenInfo?.volume24hUSD ||
                      selectedMarketSnapshot?.volume24hUSD ||
                      0
                    }
                    liquidityUsd={
                      selectedTokenInfo?.totalValueLockedUSD ||
                      selectedMarketSnapshot?.totalValueLockedUSD ||
                      0
                    }
                    websiteUrl={selectedTokenInfo?.website ?? ''}
                    twitterUrl={selectedTokenInfo?.twitter ?? ''}
                    telegramUrl={selectedTokenInfo?.telegram ?? ''}
                    isFetchingMarketSnapshot={
                      selectedMarketSnapshot === undefined ||
                      selectedTokenInfo === undefined
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

                  {!showOrderBook && baseCurrency && quoteCurrency ? (
                    !selectedChain.testnet && selectedTokenInfo?.pairAddress ? (
                      <IframeChartContainer
                        setShowOrderBook={setShowOrderBook}
                        pairAddress={getAddress(selectedTokenInfo.pairAddress)}
                        chainId={selectedChain.id}
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
                      setDepthClickedIndex={
                        isFetchingOnChainPrice ? () => {} : setDepthClickedIndex
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
                <div className="relative hidden sm:flex flex-col h-full rounded-xl sm:rounded-2xl bg-[#171b24]">
                  {showMetaInfo ? (
                    <MetaAggregatorInfo currencies={currencies} />
                  ) : (
                    <SwapRouteList
                      quotes={quotes.all}
                      bestQuote={quotes.best}
                      outputCurrency={outputCurrency}
                      aggregatorNames={aggregators.map((a) => a.name)}
                      selectedQuote={selectedQuote}
                      setSelectedQuote={setSelectedQuote}
                    />
                  )}
                </div>

                <div className="flex max-h-[560px] sm:hidden w-full justify-center rounded-2xl bg-[#171b24] p-5">
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
          <OpenOrderContainer
            chainId={selectedChain.id}
            selectedMarket={selectedMarket}
          />
        ) : (
          <div className="hidden sm:flex mb-28 lg:mb-2" />
        )}
      </div>

      <MobileFixedModal
        tab={tab}
        disabled={tab === 'swap' && amountIn === 0n}
        quotes={quotes}
        outputCurrency={outputCurrency}
        showMobileModal={showMobileModal}
        setShowMobileModal={setShowMobileModal}
        selectedQuote={selectedQuote}
        setSelectedQuote={setSelectedQuote}
        limitFormProps={limitFormProps}
        swapActionButtonProps={swapActionButtonProps}
      />
    </>
  )
}
