import React, { useEffect, useMemo, useState } from 'react'
import { isAddressEqual, parseUnits, zeroAddress } from 'viem'
import { useAccount, useGasPrice, useWalletClient } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/router'
import Image from 'next/image'

import { LimitForm, LimitFormProps } from '../components/form/limit-form'
import OrderBook from '../components/order-book'
import { useChainContext } from '../contexts/chain-context'
import { useMarketContext } from '../contexts/trade/market-context'
import { useLimitContractContext } from '../contexts/trade/limit-contract-context'
import { useCurrencyContext } from '../contexts/currency-context'
import { isAddressesEqual } from '../utils/address'
import { aggregators } from '../chain-configs/aggregators'
import { formatUnits } from '../utils/bigint'
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
    return currencies.sort(() => Math.random() - 0.5)
  }, [currencies])

  return (
    <div className="hidden lg:block">
      <div className="absolute flex justify-center w-full h-full top-40 z-[2]">
        <svg
          width="94"
          height="94"
          viewBox="0 0 94 94"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            width="94"
            height="94"
            rx="16"
            fill="url(#paint0_linear_2221_8400)"
          />
          <path
            d="M40.2835 56.0904C39.6903 56.0904 39.0743 55.8619 38.618 55.405C37.7053 54.4912 37.7053 52.9834 38.618 52.0696L50.2313 40.4412C51.144 39.5274 52.6499 39.5274 53.5625 40.4412C54.4751 41.355 54.4751 42.8628 53.5625 43.7767L41.9491 55.405C41.4928 55.8619 40.8767 56.0904 40.2835 56.0904Z"
            fill="white"
          />
          <path
            d="M70.7658 55.1082L62.3923 46.7239C62.2783 46.6097 62.1642 46.5183 62.0729 46.4041L58.5136 49.7852C58.6277 49.8766 58.7418 49.9908 58.8558 50.0822L67.2978 58.535C68.507 59.7458 69.1003 61.3221 69.1003 62.8985C69.1003 64.4748 68.507 66.074 67.2978 67.2848C64.8793 69.7064 60.9777 69.7064 58.5592 67.2848L50.1857 58.9005C50.1401 58.8548 50.0945 58.7863 50.026 58.7406L49.5241 58.238L46.3983 62.0532C46.4895 62.1674 46.6036 62.2817 46.7177 62.373L55.0912 70.7573C59.4034 75.0751 66.4536 75.0751 70.7658 70.7573C75.0781 66.4852 75.0781 59.4488 70.7658 55.1082Z"
            fill="white"
          />
          <path
            d="M35.5838 44.3019C35.4013 44.1648 35.2415 44.0049 35.0818 43.845L26.7083 35.4607C25.4991 34.2499 24.9059 32.6735 24.9059 31.0972C24.9059 29.5208 25.4991 27.9217 26.7083 26.7109C29.1268 24.2892 33.0284 24.2892 35.4469 26.7109L43.8204 35.0951C43.866 35.1408 43.9117 35.2094 43.9801 35.2551L44.619 35.8947L48.0642 32.4451C47.836 32.1481 47.5851 31.8739 47.3113 31.5998L38.9149 23.2383C34.6027 18.9206 27.5525 18.9206 23.2403 23.2383C18.928 27.5561 18.928 34.6154 23.2403 38.9332L31.6138 47.3175C31.8876 47.5916 32.1614 47.8429 32.458 48.0714L35.9032 44.6217L35.5838 44.3019Z"
            fill="white"
          />
          <path
            opacity="0.9"
            d="M67.1609 51.498L63.67 54.9705L58.5364 49.8303L62.0044 46.335L67.1609 51.498Z"
            fill="url(#paint1_linear_2221_8400)"
          />
          <path
            opacity="0.9"
            d="M54.9314 63.7207L51.4634 67.1932L46.3298 61.9767L49.7978 58.4751L54.9314 63.7207Z"
            fill="url(#paint2_linear_2221_8400)"
          />
          <path
            opacity="0.9"
            d="M26.9362 42.6338L30.4043 39.1384L35.652 44.3929L32.1611 47.8654L26.9362 42.6338Z"
            fill="url(#paint3_linear_2221_8400)"
          />
          <path
            opacity="0.9"
            d="M39.1198 30.4127L42.6106 26.9402L47.8355 32.1079L44.3675 35.6672L39.1198 30.4127Z"
            fill="url(#paint4_linear_2221_8400)"
          />
          <path
            d="M43.8428 58.8763L35.4693 67.2606C33.0508 69.6822 29.1493 69.6822 26.7307 67.2606C25.5671 66.0955 24.9283 64.542 24.9283 62.8743C24.9283 61.2065 25.5671 59.6759 26.7307 58.5108L35.1043 50.1265C35.1727 50.0579 35.2412 49.9894 35.3324 49.9209L41.6297 43.6155C40.9224 43.4784 40.2151 43.4099 39.4621 43.4099C36.496 43.4099 33.7125 44.575 31.6134 46.654L23.2399 55.0383C21.1408 57.14 20 59.9272 20 62.8971C20 65.867 21.1636 68.6542 23.2399 70.7559C25.4074 72.9263 28.2366 74 31.0658 74C33.895 74 36.747 72.9263 38.9145 70.7559L47.2881 62.3717C49.3871 60.2699 50.5279 57.4827 50.5279 54.5128C50.5279 53.7589 50.4595 53.0279 50.3226 52.3196L44.2535 58.3965C44.1394 58.5565 44.0025 58.7164 43.8428 58.8763Z"
            fill="white"
          />
          <path
            d="M70.5376 23.3975C66.2254 19.0797 59.1752 19.0797 54.863 23.3975L46.4895 31.7818C43.7744 34.4776 42.7704 38.2699 43.4777 41.7881L49.524 35.7569C49.6609 35.5742 49.8206 35.4142 49.9803 35.2543L58.331 26.87C59.5403 25.6592 61.1146 25.0652 62.6889 25.0652C64.2632 25.0652 65.8603 25.6592 67.0696 26.87C69.4881 29.2917 69.4881 33.1982 67.0696 35.6199L58.6961 43.9813C58.6504 44.027 58.582 44.0727 58.5364 44.1412L52.1935 50.4922C52.9008 50.6293 53.6309 50.6979 54.3382 50.6979C57.1674 50.6979 60.0194 49.6241 62.1869 47.4538L70.5604 39.0695C74.8727 34.7517 74.8727 27.7153 70.5376 23.3975Z"
            fill="white"
          />
          <defs>
            <linearGradient
              id="paint0_linear_2221_8400"
              x1="89.5"
              y1="-2.61706e-06"
              x2="-2.80142e-06"
              y2="94"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#548DFF" />
              <stop offset="1" stopColor="#2D69DF" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_2221_8400"
              x1="65.4048"
              y1="53.2368"
              x2="60.2553"
              y2="48.0938"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6D8CDA" stopOpacity="0" />
              <stop offset="0.8" stopColor="#6D8CDA" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient
              id="paint2_linear_2221_8400"
              x1="53.2034"
              y1="65.4542"
              x2="48.0539"
              y2="60.3113"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6D8CDA" stopOpacity="0" />
              <stop offset="0.8" stopColor="#6D8CDA" stopOpacity="0.592157" />
            </linearGradient>
            <linearGradient
              id="paint3_linear_2221_8400"
              x1="28.7351"
              y1="40.8992"
              x2="33.9728"
              y2="46.13"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6D8CDA" stopOpacity="0" />
              <stop offset="0.8" stopColor="#6D8CDA" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient
              id="paint4_linear_2221_8400"
              x1="40.8287"
              y1="28.6714"
              x2="46.0666"
              y2="33.9024"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6D8CDA" stopOpacity="0" />
              <stop offset="0.8" stopColor="#6D8CDA" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
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
    selectedDecimalPlaces,
    setSelectedDecimalPlaces,
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
    refreshQuotesAction,
    priceImpact,
    isFetchingOnChainPrice,
  } = useTradeContext()

  const { openConnectModal } = useConnectModal()
  const { balances, prices, currencies, setCurrencies } = useCurrencyContext()
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
          amountIn > (balances[inputCurrency.address] ?? 0n)),
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
                : `Place Order`,
    }),
    [
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
        priceImpact,
        refreshQuotesAction,
      }) as SwapFormProps,
    [
      balances,
      currencies,
      inputCurrency,
      inputCurrencyAmount,
      outputCurrency,
      priceImpact,
      prices,
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
