import React, { useEffect, useMemo, useState } from 'react'
import { getAddress, isAddressEqual, parseUnits, zeroAddress } from 'viem'
import { useAccount, useGasPrice, useWalletClient } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import { getContractAddresses, getLatestTrades, Swap } from '@clober/v2-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'

import { LimitForm, LimitFormProps } from '../components/form/limit-form'
import OrderBook from '../components/order-book'
import { useChainContext } from '../contexts/chain-context'
import { useMarketContext } from '../contexts/trade/market-context'
import { useLimitContractContext } from '../contexts/trade/limit-contract-context'
import { useCurrencyContext } from '../contexts/currency-context'
import { isAddressesEqual, shortAddress } from '../utils/address'
import { aggregators } from '../chain-configs/aggregators'
import { applyPercent, toUnitString, max } from '../utils/bigint'
import { MarketInfoCard } from '../components/card/market/market-info-card'
import { Currency } from '../model/currency'
import WarningLimitModal from '../components/modal/warning-limit-modal'
import { useTradeContext } from '../contexts/trade/trade-context'
import { SwapForm, SwapFormProps } from '../components/form/swap-form'
import { useSwapContractContext } from '../contexts/trade/swap-contract-context'
import { CHAIN_CONFIG } from '../chain-configs'
import { SwapRouteList } from '../components/swap-router-list'
import { useTransactionContext } from '../contexts/transaction-context'
import { executors } from '../chain-configs/executors'
import { formatTinyNumber } from '../utils/bignumber'
import { CurrencyIcon } from '../components/icon/currency-icon'
import { convertShortTimeAgo } from '../utils/time'
import { Chain } from '../model/chain'
import MarketSelect from '../components/selector/market-select'
import CloseSvg from '../components/svg/close-svg'
import { ActionButton } from '../components/button/action-button'

import { IframeChartContainer } from './chart/iframe-chart-container'
import { NativeChartContainer } from './chart/native-chart-container'
import { OpenOrderContainer } from './open-order-container'

const MetaAggregatorInfo = ({
  chain,
  currencies,
  latestSwaps,
}: {
  chain: Chain
  currencies: Currency[]
  latestSwaps: Swap[]
}) => {
  const shuffledCurrencies = useMemo(() => {
    return currencies
      .filter(
        (currency) =>
          currency.icon && !isAddressEqual(currency.address, zeroAddress),
      )
      .sort(() => Math.random() - 0.5)
  }, [currencies])

  return (
    <div className="hidden xl:block">
      <div className="absolute flex justify-center w-full top-[60px] z-[2]">
        <Image
          className="rounded-xl"
          src="/chain-configs/meta-aggregator-logo.svg"
          alt="Meta Aggregator"
          width={94}
          height={94}
        />
      </div>

      <div className="w-full flex justify-center absolute top-20">
        <div className="w-full md:w-[616px] overflow-x-hidden relative">
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

      <div className="absolute top-[196px] items-center justify-center w-full text-center gap-4">
        <div className="flex flex-col gap-4">
          <span className="text-blue-400 text-base font-semibold">
            One Interface. Every Route, Optimized.
          </span>
          <div className="text-[#8d94a1] text-xs font-medium leading-[18px]">
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

      <div className="absolute flex bottom-[34px] w-full px-[34px] gap-2 flex-col max-h-[174px] overflow-y-scroll">
        <AnimatePresence initial={false}>
          {latestSwaps
            .filter(
              ({ router }) =>
                CHAIN_CONFIG.ROUTER_MAP[router] !==
                `W${chain.nativeCurrency.symbol.toUpperCase()}`,
            )
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((latestSwap) => (
              <motion.div
                key={latestSwap.transaction.id}
                className="w-full flex items-center justify-between text-xs text-white text-nowrap"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <a
                  href={`${chain.blockExplorers?.default?.url}/tx/${latestSwap.transaction.id}`}
                  target="_blank"
                  className="h-7 w-full flex self-stretch px-2.5 py-[7px] bg-[#24272e] rounded-[10px] justify-start items-center gap-2"
                  rel="noopener"
                >
                  <div className="justify-start text-nowrap text-[#8d94a1] text-xs font-medium w-[144px]">
                    {shortAddress(latestSwap.transaction.from as `0x${string}`)}{' '}
                    swapped
                  </div>
                  <div className="flex justify-start items-center gap-1.5 w-fit">
                    <div className="flex justify-start items-center gap-1">
                      <CurrencyIcon
                        chain={chain}
                        currency={latestSwap.currencyIn.currency}
                        className="min-w-3.5 w-3.5 min-h-3.5 h-3.5 rounded-full"
                      />
                      <div className="justify-start text-white text-xs font-medium">
                        {formatTinyNumber(latestSwap.currencyIn.amount)}{' '}
                        <span className="text-[#8d94a1]">
                          {latestSwap.currencyIn.currency.symbol}
                        </span>
                      </div>
                    </div>

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M11.0833 7.00004L2.91659 7.00004M11.0833 7.00004L8.74992 4.66671M11.0833 7.00004L8.74992 9.33337"
                        stroke="#8D94A1"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <div className="flex justify-start items-center gap-1">
                      <CurrencyIcon
                        chain={chain}
                        currency={latestSwap.currencyOut.currency}
                        className="min-w-3.5 w-3.5 min-h-3.5 h-3.5 rounded-full"
                      />
                      <div className="justify-start text-white text-xs font-medium">
                        {formatTinyNumber(latestSwap.currencyOut.amount)}{' '}
                        <span className="text-[#8d94a1]">
                          {latestSwap.currencyOut.currency.symbol}
                        </span>
                      </div>{' '}
                    </div>
                    <div className="text-nowrap text-blue-400 text-xs font-medium">
                      via {CHAIN_CONFIG.ROUTER_MAP[latestSwap.router]}
                    </div>
                  </div>

                  <div className="flex ml-auto items-center">
                    <div className="text-[#8d94a1] text-xs font-medium">
                      {convertShortTimeAgo(latestSwap.timestamp * 1000)}
                    </div>
                  </div>
                </a>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export const TradeContainer = () => {
  const queryClient = useQueryClient()
  const { data: gasPrice } = useGasPrice()
  const { selectedChain } = useChainContext()
  const { selectedExecutorName } = useTransactionContext()
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
    marketSnapshots,
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
  const {
    balances,
    getAllowance,
    prices,
    currencies,
    setCurrencies,
    remoteChainBalances,
  } = useCurrencyContext()
  const [showMobileModal, setShowMobileModal] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showMarketSelect, setShowMarketSelect] = useState<boolean>(false)
  const [showMetaInfo, setShowMetaInfo] = useState(false)

  // Remove marketSelectRef and outside click logic (no longer needed)

  const amountIn = useMemo(
    () => parseUnits(inputCurrencyAmount, inputCurrency?.decimals ?? 18),
    [inputCurrency?.decimals, inputCurrencyAmount],
  )

  const { data: latestSwaps = [] } = useQuery<Swap[]>({
    queryKey: ['latest-swaps', selectedChain.id],
    queryFn: async () => {
      return getLatestTrades({
        chainId: selectedChain.id,
        n: 10,
        options: { rpcUrl: CHAIN_CONFIG.RPC_URL },
      })
    },
    placeholderData: [],
    refetchInterval: 5000, // checked
    refetchIntervalInBackground: true,
    select: (newData) => {
      const previous =
        queryClient.getQueryData<Swap[]>(['latest-swaps', selectedChain.id]) ??
        []

      const seen = new Set<string>()
      const combined = [...newData, ...previous]

      return combined.filter((swap) => {
        if (seen.has(swap.transaction.id)) {
          return false
        }
        seen.add(swap.transaction.id)
        return true
      })
    },
  })

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
      text: (() => {
        if (!walletClient) {
          return 'Connect wallet'
        }
        if (!inputCurrency) {
          return 'Select input currency'
        }
        if (!outputCurrency) {
          return 'Select output currency'
        }
        if (amountIn === 0n) {
          return 'Enter amount'
        }

        const balance = balances[inputCurrency.address] ?? 0n
        if (amountIn > balance) {
          return 'Insufficient balance'
        }

        const controller = getContractAddresses({
          chainId: selectedChain.id,
        }).Controller
        const allowance = getAllowance(controller, inputCurrency)
        if (amountIn > allowance) {
          return `Max Approve ${inputCurrency.symbol}`
        }

        return 'Place Order'
      })(),
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
        amountIn >
          balances[inputCurrency.address] +
            (remoteChainBalances[inputCurrency.address]?.total ?? 0n),
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
      text: (() => {
        if (
          Number(inputCurrencyAmount) > 0 &&
          (selectedQuote?.amountOut ?? 0n) === 0n
        ) {
          return 'Fetching...'
        }

        if (!walletClient) {
          return 'Connect wallet'
        }
        if (!inputCurrency) {
          return 'Select input currency'
        }
        if (!outputCurrency) {
          return 'Select output currency'
        }
        if (amountIn === 0n) {
          return 'Enter amount'
        }

        const balance =
          balances[inputCurrency.address] +
          (remoteChainBalances[inputCurrency.address]?.total ?? 0n)
        if (amountIn > balance) {
          return 'Insufficient balance'
        }

        const ref = CHAIN_CONFIG.REFERENCE_CURRENCY.address
        const input = inputCurrency.address
        const output = outputCurrency.address

        if (isAddressEqual(input, zeroAddress) && isAddressEqual(output, ref)) {
          return 'Wrap'
        }

        if (isAddressEqual(input, ref) && isAddressEqual(output, zeroAddress)) {
          return 'Unwrap'
        }

        const allowanceTarget = selectedExecutorName
          ? getAddress(
              executors.find((e) => e.name === selectedExecutorName)
                ?.contract ||
                CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES
                  .AggregatorRouterGateway,
            )
          : CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway

        const allowance = getAllowance(allowanceTarget, inputCurrency)
        if (amountIn > allowance) {
          return `Max Approve ${inputCurrency.symbol}`
        }

        return 'Swap'
      })(),
    }),
    [
      inputCurrencyAmount,
      selectedQuote,
      inputCurrency,
      outputCurrency,
      amountIn,
      balances,
      remoteChainBalances,
      userAddress,
      openConnectModal,
      gasPrice,
      swap,
      walletClient,
      selectedExecutorName,
      getAllowance,
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
          ? balances[inputCurrency.address] +
            (remoteChainBalances[inputCurrency.address]?.total ?? 0n)
          : 0n,
        showOutputCurrencySelect,
        setShowOutputCurrencySelect,
        outputCurrency,
        setOutputCurrency,
        outputCurrencyAmount: toUnitString(
          max((selectedQuote?.amountOut ?? 0n) - (quotes.best?.fee ?? 0n), 0n),
          outputCurrency?.decimals ?? 18,
        ),
        minimumReceivedAmount: toUnitString(
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
        selectedExecutorName,
        gasEstimateValue: selectedQuote?.gasUsd ?? 0,
        priceImpact,
        isRefreshing,
        refreshQuotesAction,
      }) as SwapFormProps,
    [
      selectedExecutorName,
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
          onClose={() => setShowWarningModal(false)}
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

      <div className="bg-[#191d25] rounded-[22px] py-1 w-full max-w-[248px] h-10 flex md:hidden flex-row relative text-blue-300 text-base font-semibold">
        <button
          disabled={tab === 'swap'}
          onClick={() => setTab('swap')}
          className="text-sm flex flex-1 px-[15px] py-1.5 h-full rounded-[20px] text-[#8d94a1] disabled:text-blue-300 disabled:bg-blue-500/40 justify-center items-center gap-1"
        >
          Swap
        </button>
        <button
          disabled={tab === 'limit'}
          onClick={() => setTab('limit')}
          className="text-sm flex flex-1 px-[15px] py-1.5 h-full rounded-[20px] text-[#8d94a1] disabled:text-blue-300 disabled:bg-blue-500/40 justify-center items-center gap-1"
        >
          Limit
        </button>
      </div>

      <div className="flex flex-col w-full md:w-fit mb-4 md:mb-6 items-center gap-[17px]">
        <div className="w-full md:max-w-[324px] items-center justify-center mb-10 hidden md:flex bg-[#191d25] py-1 h-10 md:h-12 flex-row relative text-[#8d94a1] text-base font-semibold rounded-3xl">
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
          className={`flex flex-col w-full xl:flex-row gap-4 justify-center ${tab === 'swap' ? 'md:flex-col-reverse' : ''}`}
        >
          {tab === 'limit' && (
            <div className="relative flex flex-col gap-[26px] md:gap-4 w-full xl:w-[740px]">
              {baseCurrency && quoteCurrency && (
                <>
                  <MarketInfoCard
                    chain={selectedChain}
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
                    priceChange24h={selectedMarketSnapshot?.priceChange24h || 0}
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
                    showMarketSelect={showMarketSelect}
                    setShowMarketSelect={setShowMarketSelect}
                  />

                  {showMarketSelect ? (
                    <>
                      <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowMarketSelect(false)}
                      />
                      <div className="z-[10000] bg-[#191d25] rounded-t-2xl border border-[#272930] overflow-y-auto sm:absolute sm:top-[66px] sm:left-0 sm:w-[382px] sm:h-[481px] fixed bottom-0 left-0 w-full h-[70%] sm:rounded-2xl">
                        <MarketSelect
                          chain={selectedChain}
                          onMarketSelect={(market) => {
                            if (
                              !(
                                inputCurrency?.address &&
                                isAddressEqual(
                                  market.quote.address,
                                  inputCurrency?.address,
                                ) &&
                                outputCurrency?.address &&
                                isAddressEqual(
                                  market.base.address,
                                  outputCurrency?.address,
                                )
                              )
                            ) {
                              setInputCurrency(market.quote)
                              setOutputCurrency(market.base)
                            }
                            setShowMarketSelect(false)
                          }}
                          markets={marketSnapshots}
                        />
                      </div>
                    </>
                  ) : (
                    <></>
                  )}
                </>
              )}

              <div className="flex flex-col h-full rounded-xl md:rounded-2xl">
                {!showOrderBook && baseCurrency && quoteCurrency ? (
                  !selectedChain.testnet && selectedTokenInfo?.pairAddress ? (
                    <IframeChartContainer
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
                    className="flex flex-col px-0.5 xl:px-4 pb-4 pt-2 md:pb-6 bg-[#16181d] rounded-b-xl md:rounded-2xl gap-[20px] h-[300px] xl:h-[481px] w-full xl:outline xl:outline-1 xl:outline-offset-[-1px] xl:outline-[#272930] overflow-y-hidden"
                  />
                ) : (
                  <></>
                )}
              </div>
            </div>
          )}

          {tab === 'swap' && (
            <div className="flex flex-col gap-[26px] md:gap-4 w-full xl:w-[620px]">
              <div className="relative hidden md:flex flex-col xl:h-[572px] rounded-xl md:rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#272930] bg-[#16181d]">
                {showMetaInfo ? (
                  <MetaAggregatorInfo
                    chain={selectedChain}
                    currencies={currencies}
                    latestSwaps={latestSwaps}
                  />
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

              <div className="flex mb-16 md:mb-0 max-h-[560px] md:hidden w-full justify-center md:rounded-2xl md:bg-[#17181e] md:p-5">
                <SwapForm {...swapFormProps} />
              </div>
            </div>
          )}

          {/*only tablet or pc*/}
          {tab === 'limit' ? (
            <div className="hidden md:flex flex-col rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#272930] bg-[#16181d] py-5 w-[480px] xl:w-[420px] h-[571px]">
              <LimitForm {...limitFormProps} />
            </div>
          ) : (
            <div className="hidden md:flex flex-col w-[480px] xl:w-[420px] h-fit">
              <SwapForm
                {...swapFormProps}
                actionButtonProps={swapActionButtonProps}
              />
            </div>
          )}
        </div>

        {tab === 'limit' && userAddress ? (
          <OpenOrderContainer
            chainId={selectedChain.id}
            selectedMarket={selectedMarket}
          />
        ) : (
          <div className="hidden md:flex mb-28 xl:mb-2" />
        )}
      </div>

      {/*mobile modal*/}
      <div className="fixed flex w-full overflow-y-scroll md:hidden bottom-0 z-[1000]">
        <div
          className={`${
            showMobileModal ? 'flex' : 'hidden'
          } w-full h-full fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm`}
          onClick={() => setShowMobileModal(false)}
        />
        <div className="w-full h-full top-0 absolute bg-[#17181e] shadow rounded-tl-2xl rounded-tr-2xl border" />
        <div
          className={`z-[10000] w-full flex flex-col ${
            showMobileModal ? '' : 'px-5 sm:px-5 pt-3'
          }`}
        >
          <div
            className={`${
              showMobileModal ? 'flex max-h-[560px] mt-5' : 'hidden'
            } flex-col mb-5`}
          >
            {tab === 'limit' ? (
              <LimitForm {...limitFormProps} />
            ) : (
              <div className="flex md:hidden flex-col gap-4 px-5">
                <div className="flex flex-row gap-1 justify-start text-white text-[13px] font-semibold">
                  Swap {inputCurrency?.symbol ?? ''}{' '}
                  <span className="text-[#8690a5]">&#8594; </span>
                  {outputCurrency?.symbol ?? ''}
                  <button
                    className="flex sm:hidden w-3 sm:w-4 h-3 sm:h-3 ml-auto"
                    onClick={() => setShowMobileModal(false)}
                  >
                    <CloseSvg />
                  </button>
                </div>

                <div className="flex flex-col w-full mb-4 max-h-[400px] sm:mb-4 overflow-y-auto">
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
            } h-12 sm:h-14 bg-blue-500 rounded-xl justify-center items-center mb-5`}
          >
            <div className="grow shrink basis-0 opacity-90 text-center text-base font-bold">
              {tab === 'limit' ? 'Make order' : 'Quotes'}
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
