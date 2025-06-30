import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWalletClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { parseUnits, zeroAddress } from 'viem'
import { getContractAddresses, removeLiquidity } from '@clober/v2-sdk'
import BigNumber from 'bignumber.js'
import { Tooltip } from 'react-tooltip'

import { useChainContext } from '../../contexts/chain-context'
import { useCurrencyContext } from '../../contexts/currency-context'
import { usePoolContractContext } from '../../contexts/pool/pool-contract-context'
import { usePoolContext } from '../../contexts/pool/pool-context'
import { CurrencyIcon } from '../../components/icon/currency-icon'
import {
  formatPreciseAmountString,
  formatWithCommas,
} from '../../utils/bignumber'
import { QuestionMarkSvg } from '../../components/svg/question-mark-svg'
import { AddLiquidityForm } from '../../components/form/pool/add-liquidity-form'
import { RemoveLiquidityForm } from '../../components/form/pool/remove-liquidity-form'
import { Pool, PoolSnapshot } from '../../model/pool'
import { CHAIN_CONFIG } from '../../chain-configs'

import { PoolChartContainer } from './pool-chart-container'

type PerformanceHistory = {
  timestamp: number
  pi: number
  rpi: number
}

const isInvalidAmount = (amount: string) => {
  const parsedAmount = new BigNumber(amount)
  return parsedAmount.isNaN() || !parsedAmount.isFinite()
}

export const PoolManagerContainer = ({
  pool,
  poolSnapshot,
}: {
  pool: Pool
  poolSnapshot: PoolSnapshot
}) => {
  const [tab, setTab] = React.useState<'add-liquidity' | 'remove-liquidity'>(
    'add-liquidity',
  )
  const router = useRouter()
  const { data: walletClient } = useWalletClient()
  const { selectedChain } = useChainContext()
  const { balances, prices, getAllowance } = useCurrencyContext()
  const {
    currency0Amount,
    setCurrency0Amount,
    currency1Amount,
    setCurrency1Amount,
    disableSwap,
    setDisableSwap,
    slippageInput,
    setSlippageInput,
    lpCurrencyAmount,
    setLpCurrencyAmount,
    lpBalances,
  } = usePoolContext()
  const { mint, burn } = usePoolContractContext()
  const [showRPI, setShowRPI] = useState(true)
  const previousValues = useRef({
    currency0Amount,
    currency1Amount,
  })

  const { data: receiveLpAmount } = useQuery({
    queryKey: [
      'calculate-receive-lp-amount',
      selectedChain.id,
      pool.key,
      currency0Amount,
      currency1Amount,
      disableSwap,
      slippageInput,
      tab,
    ],
    queryFn: async () => {
      if (tab === 'remove-liquidity') {
        return 0n
      }
      if (Number(currency0Amount) === 0 && Number(currency1Amount) === 0) {
        return 0n
      }
      const totalInputUsdValue = new BigNumber(
        isInvalidAmount(currency0Amount) ? 0 : currency0Amount,
      )
        .times(prices[pool.currencyA.address])
        .plus(
          new BigNumber(
            isInvalidAmount(currency1Amount) ? 0 : currency1Amount,
          ).times(prices[pool.currencyB.address]),
        )
      return parseUnits(
        totalInputUsdValue
          .div(pool.lpPriceUSD)
          .toFixed(pool.lpCurrency.decimals),
        pool.lpCurrency.decimals,
      )
    },
    initialData: 0n,
  })

  const { data: receiveCurrencies } = useQuery({
    queryKey: [
      'calculate-receive-currencies',
      selectedChain.id,
      pool.key,
      lpCurrencyAmount,
      slippageInput,
      prices,
      tab,
    ],
    queryFn: async () => {
      if (tab === 'add-liquidity' || Number(lpCurrencyAmount) === 0) {
        return []
      }
      const { result } = await removeLiquidity({
        chainId: selectedChain.id,
        userAddress: zeroAddress,
        token0: pool.currencyA.address,
        token1: pool.currencyB.address,
        salt: pool.salt,
        amount: lpCurrencyAmount,
        options: {
          useSubgraph: false,
          gasLimit: 1_000_000n,
          slippage: Number(slippageInput),
        },
      })
      return [result.currencyA, result.currencyB]
    },
    initialData: [],
  })

  const isNoLiquidity = useMemo(
    () =>
      pool.liquidityA.total.value === '0' &&
      pool.liquidityB.total.value === '0',
    [pool],
  )

  const performanceHistories = useMemo(() => {
    return selectedChain.testnet
      ? []
      : (poolSnapshot.performanceHistories
          .sort((a, b) => a.timestamp - b.timestamp)
          .map(({ timestamp, priceAUSD, priceBUSD, lpPriceUSD }) => {
            const onHoldUSDValuePerLp =
              (Number(poolSnapshot.initialLPInfo.currencyA.value) * priceAUSD +
                Number(poolSnapshot.initialLPInfo.currencyB.value) *
                  priceBUSD) /
              Number(poolSnapshot.initialLPInfo.lpToken.value)

            if (onHoldUSDValuePerLp === 0) {
              return null
            }
            return {
              timestamp,
              pi:
                Number(lpPriceUSD) /
                Number(poolSnapshot.initialLPInfo.lpPriceUSD),
              rpi: Number(lpPriceUSD) / onHoldUSDValuePerLp,
            }
          })
          .filter((item) => item !== null) as PerformanceHistory[])
  }, [
    poolSnapshot.initialLPInfo.lpPriceUSD,
    poolSnapshot.initialLPInfo.lpToken.value,
    poolSnapshot.initialLPInfo.currencyA.value,
    poolSnapshot.initialLPInfo.currencyB.value,
    poolSnapshot.performanceHistories,
    selectedChain.testnet,
  ])

  useEffect(() => {
    setDisableSwap(isNoLiquidity)
  }, [isNoLiquidity, setDisableSwap])

  useEffect(() => {
    setCurrency0Amount('')
    setCurrency1Amount('')
  }, [setCurrency0Amount, setCurrency1Amount, disableSwap])

  useEffect(
    () => {
      if (disableSwap && !isNoLiquidity) {
        // when change currency0Amount
        if (previousValues.current.currency0Amount !== currency0Amount) {
          const _currency1Amount = new BigNumber(currency0Amount)
            .div(pool.liquidityA.total.value)
            .times(pool.liquidityB.total.value)
            .toFixed()
          setCurrency1Amount(
            isInvalidAmount(_currency1Amount) ? '0' : _currency1Amount,
          )
          previousValues.current = {
            currency0Amount,
            currency1Amount: isInvalidAmount(_currency1Amount)
              ? '0'
              : _currency1Amount,
          }
        }
        // when change currency1Amount
        else if (previousValues.current.currency1Amount !== currency1Amount) {
          const _currency0Amount = new BigNumber(currency1Amount)
            .div(pool.liquidityB.total.value)
            .times(pool.liquidityA.total.value)
            .toFixed()
          setCurrency0Amount(
            isInvalidAmount(_currency0Amount) ? '0' : _currency0Amount,
          )
          previousValues.current = {
            currency0Amount: isInvalidAmount(_currency0Amount)
              ? '0'
              : _currency0Amount,
            currency1Amount,
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency0Amount, currency1Amount],
  )

  const ratioA = useMemo(
    () =>
      Math.floor(
        new BigNumber(pool.liquidityA.total.value)
          .times(prices[pool.currencyA.address])
          .div(pool.totalSupply.value)
          .div(pool.lpPriceUSD)
          .times(100)
          .toNumber(),
      ),
    [prices, pool],
  )

  return (
    <div className="flex w-full h-full justify-center mt-8 mb-[30px] md:mb-20">
      <div className="w-full lg:w-[992px] h-full flex flex-col items-start gap-8 md:gap-12 px-2 sm:px-4 lg:px-0">
        <div className="flex w-full h-full items-center">
          <button
            onClick={() => router.push('/earn')}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              fill="none"
              className="mr-auto w-6 h-6 md:w-8 md:h-8"
            >
              <path
                d="M6.66699 16.0003H25.3337M6.66699 16.0003L12.0003 21.3337M6.66699 16.0003L12.0003 10.667"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="flex w-full items-center justify-center">
            <div className="flex items-center justify-center relative w-full h-full gap-2 md:gap-4">
              <div className="w-10 h-6 md:w-14 md:h-8 shrink-0 relative">
                <CurrencyIcon
                  chain={selectedChain}
                  currency={pool.currencyB}
                  className="w-6 h-6 md:w-8 md:h-8 absolute left-0 top-0 z-[1] rounded-full"
                />
                <CurrencyIcon
                  chain={selectedChain}
                  currency={pool.currencyA}
                  className="w-6 h-6 md:w-8 md:h-8 absolute left-4 md:left-6 top-0 rounded-full"
                />
              </div>

              <div className="flex justify-center items-start gap-1 md:gap-2">
                <div className="text-center text-white md:text-3xl font-bold">
                  {pool.currencyB.symbol}
                </div>
                <div className="text-center text-white md:text-3xl font-bold">
                  -
                </div>
                <div className="text-center text-white md:text-3xl font-bold">
                  {pool.currencyA.symbol}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 self-stretch text-white">
          <div className="flex flex-col w-full sm:w-[480px] items-start gap-8 md:gap-12">
            <div className="flex flex-col item-st gap-3 md:gap-4 self-stretch">
              <div className="text-white text-sm md:text-base font-bold">
                Reserve
              </div>
              <div className="self-stretch px-2.5 py-4 sm:p-4 bg-[#171b24] rounded-xl flex flex-col justify-center items-center gap-3 sm:gap-3.5">
                <div className="self-stretch w-full h-full inline-flex justify-start items-center gap-1">
                  <div
                    style={{
                      width: `${ratioA}%`,
                    }}
                    className="h-1.5 bg-blue-500 rounded-tl rounded-bl"
                  />
                  <div
                    style={{
                      width: `${100 - ratioA}%`,
                    }}
                    className="h-1.5 bg-cyan-400 rounded-tr rounded-br"
                  />
                </div>

                <div className="self-stretch inline-flex justify-between items-center">
                  <div className="flex flex-1 justify-center gap-2 md:gap-4">
                    <div className="flex items-center gap-1 md:gap-2">
                      <CurrencyIcon
                        chain={selectedChain}
                        currency={pool.currencyA}
                        className="w-5 h-5 md:w-6 md:h-6 rounded-full"
                      />
                    </div>
                    <div className="text-blue-500 text-sm md:text-lg font-bold flex flex-col text-left items-center h-full">
                      {formatWithCommas(
                        formatPreciseAmountString(
                          pool.liquidityA.total.value.toString(),
                          prices[pool.currencyA.address],
                        ),
                      )}
                      <span className="text-gray-400 font-medium text-sm">
                        ($
                        {formatWithCommas(
                          new BigNumber(pool.liquidityA.total.value)
                            .times(prices[pool.currencyA.address])
                            .toFixed(2),
                        )}
                        )
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 justify-center gap-2 md:gap-4">
                    <div className="flex items-center gap-1 md:gap-2">
                      <CurrencyIcon
                        chain={selectedChain}
                        currency={pool.currencyB}
                        className="w-5 h-5 md:w-6 md:h-6 rounded-full"
                      />
                    </div>
                    <div className="text-cyan-400 text-sm md:text-lg font-bold flex flex-col text-left items-center h-full">
                      {formatWithCommas(
                        formatPreciseAmountString(
                          pool.liquidityB.total.value.toString(),
                          prices[pool.currencyB.address],
                        ),
                      )}
                      <span className="text-gray-400 font-medium text-sm">
                        ($
                        {formatWithCommas(
                          new BigNumber(pool.liquidityB.total.value)
                            .times(prices[pool.currencyB.address])
                            .toFixed(2),
                        )}
                        )
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex sm:hidden flex-col item-st gap-3 md:gap-4 self-stretch">
              <div className="flex flex-row gap-2">
                <div className="text-white text-sm md:text-base font-bold">
                  Relative Price Index(RPI)
                </div>
                <div className="flex mr-auto justify-center items-center">
                  <QuestionMarkSvg
                    data-tooltip-id="rpi-info"
                    data-tooltip-place="bottom-end"
                    data-tooltip-html={`Relative Price Index (RPI) measures the historical performance of the ${CHAIN_CONFIG.DEX_NAME} Liquidity Vault compared to a reference portfolio. The reference portfolio represents the value of assets if they had been held without any active management from the initial point. RPI effectively indicates how well the vault has performed relative to a passive “just hold” strategy.`}
                    className="w-3 h-3"
                  />
                  <Tooltip
                    id="rpi-info"
                    className="max-w-[300px] bg-gray-950 !opacity-100 z-[100]"
                    clickable
                  />
                </div>
              </div>
              <div className="text-sm font-semibold flex h-14 px-8 py-4 bg-gray-800 rounded-xl justify-center items-center gap-8 md:gap-12">
                {(showRPI
                  ? (performanceHistories?.[performanceHistories.length - 1]
                      ?.rpi ?? 0)
                  : (performanceHistories?.[performanceHistories.length - 1]
                      ?.pi ?? 0)
                ).toFixed(4)}
              </div>
            </div>
            <div className="flex-col items-start gap-3 md:gap-4 self-stretch hidden sm:flex">
              <div className="flex flex-col gap-0.5">
                <div className="text-white text-sm md:text-base font-bold flex flex-row gap-1 items-center justify-center">
                  <button onClick={() => setShowRPI(!showRPI)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="12"
                      viewBox="0 0 13 12"
                      fill="none"
                    >
                      <g clipPath="url(#clip0_164_5640)">
                        <path
                          d="M10.6304 8.5H1.63037M10.6304 8.5L9.13037 10M10.6304 8.5L9.13037 7M3.13037 5L1.63037 3.5M1.63037 3.5L3.13037 2M1.63037 3.5H10.6304"
                          stroke="#3B82F6"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_164_5640">
                          <rect
                            width="12"
                            height="12"
                            fill="white"
                            transform="translate(0.130371)"
                          />
                        </clipPath>
                      </defs>
                    </svg>
                  </button>
                  Historical Performance
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex text-gray-500 text-xs md:text-sm">
                    {showRPI
                      ? 'Relative Price Index(RPI)'
                      : 'Performance Index (PI)'}
                  </div>
                  <div className="flex mr-auto justify-center items-center z-50">
                    <QuestionMarkSvg
                      data-tooltip-id="index-info"
                      data-tooltip-place="bottom-end"
                      data-tooltip-html={
                        showRPI
                          ? `Relative Price Index (RPI) measures the historical performance of the ${CHAIN_CONFIG.DEX_NAME} Liquidity Vault compared to a reference portfolio. The reference portfolio represents the value of assets if they had been held without any active management from the initial point. RPI effectively indicates how well the vault has performed relative to a passive “just hold” strategy.`
                          : `Performance Index (PI) shows the relative value of your portfolio over time, starting at 1. A value above 1 indicates growth, while a value below 1 indicates a decrease. PI provides a snapshot of how the assets have performed since the initial measurement.`
                      }
                      className="w-3 h-3"
                    />
                    <Tooltip
                      id="index-info"
                      className="max-w-[300px] bg-gray-950 !opacity-100 z-[100]"
                      clickable
                    />
                  </div>
                </div>
              </div>
              <PoolChartContainer
                historicalPriceIndex={performanceHistories.sort(
                  (a, b) => a.timestamp - b.timestamp,
                )}
                showRPI={showRPI}
              />
            </div>
          </div>
          <div className="h-full md:h-[576px] flex flex-col w-full sm:w-[480px] justify-start items-start gap-4">
            <div className="w-full sm:h-14 p-1.5 sm:px-2 rounded-xl md:rounded-2xl border-2 border-slate-400 border-solid justify-center items-center inline-flex">
              <button
                disabled={tab === 'add-liquidity'}
                onClick={() => setTab('add-liquidity')}
                className="whitespace-nowrap flex-1 h-8 sm:h-10 px-4 sm:px-6 py-1.5 sm:py-4 disabled:bg-slate-700 rounded-xl justify-center items-center gap-1 sm:gap-2 flex"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="w-4 h-4 md:w-5 md:h-5"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM11 6C11 5.44772 10.5523 5 10 5C9.44772 5 9 5.44772 9 6V9H6C5.44772 9 5 9.44772 5 10C5 10.5523 5.44772 11 6 11H9V14C9 14.5523 9.44772 15 10 15C10.5523 15 11 14.5523 11 14V11H14C14.5523 11 15 10.5523 15 10C15 9.44772 14.5523 9 14 9H11V6Z"
                    fill="white"
                  />
                </svg>
                <div className="opacity-90 text-center text-gray-400 text-sm md:text-base font-bold">
                  Add Liquidity
                </div>
              </button>
              <button
                disabled={tab === 'remove-liquidity'}
                onClick={() => setTab('remove-liquidity')}
                className="whitespace-nowrap flex-1 h-8 sm:h-10 px-4 sm:px-6 py-1.5 sm:py-4 disabled:bg-slate-700 rounded-xl justify-center items-center gap-1 sm:gap-2 flex"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="w-4 h-4 md:w-5 md:h-5"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM6 9C5.44772 9 5 9.44772 5 10C5 10.5523 5.44772 11 6 11H14C14.5523 11 15 10.5523 15 10C15 9.44772 14.5523 9 14 9H6Z"
                    fill="#9CA3AF"
                  />
                </svg>
                <div className="opacity-90 text-center text-gray-400 text-sm md:text-base font-bold">
                  Remove Liquidity
                </div>
              </button>
            </div>
            <div className="p-6 bg-gray-900 rounded-2xl border flex-col justify-start items-start gap-6 md:gap-8 flex w-full">
              {tab === 'add-liquidity' ? (
                <AddLiquidityForm
                  chain={selectedChain}
                  pool={pool}
                  prices={prices}
                  currency0Amount={currency0Amount}
                  setCurrency0Amount={setCurrency0Amount}
                  availableCurrency0Balance={balances[pool.currencyA.address]}
                  currency1Amount={currency1Amount}
                  setCurrency1Amount={setCurrency1Amount}
                  availableCurrency1Balance={balances[pool.currencyB.address]}
                  disableSwap={disableSwap}
                  setDisableSwap={setDisableSwap}
                  disableDisableSwap={isNoLiquidity}
                  slippageInput={slippageInput}
                  setSlippageInput={setSlippageInput}
                  receiveLpCurrencyAmount={receiveLpAmount}
                  isCalculatingReceiveLpAmount={
                    (disableSwap &&
                      Number(currency0Amount) > 0 &&
                      Number(currency1Amount) > 0 &&
                      receiveLpAmount === 0n) ||
                    (!disableSwap &&
                      Number(currency0Amount) + Number(currency1Amount) > 0 &&
                      receiveLpAmount === 0n)
                  }
                  actionButtonProps={{
                    disabled:
                      !walletClient ||
                      (Number(currency0Amount) === 0 &&
                        Number(currency1Amount) === 0) ||
                      parseUnits(currency0Amount, pool.currencyA.decimals) >
                        balances[pool.currencyA.address] ||
                      parseUnits(currency1Amount, pool.currencyB.decimals) >
                        balances[pool.currencyB.address] ||
                      (disableSwap &&
                        (Number(currency0Amount) === 0 ||
                          Number(currency1Amount) === 0)),
                    onClick: async () => {
                      await mint(
                        pool.currencyA,
                        pool.currencyB,
                        pool.salt,
                        currency0Amount,
                        currency1Amount,
                        !isNoLiquidity ? disableSwap : true,
                        Number(slippageInput),
                      )
                    },
                    text: !walletClient
                      ? 'Connect wallet'
                      : Number(currency0Amount) === 0 &&
                          Number(currency1Amount) === 0
                        ? 'Enter amount'
                        : parseUnits(currency0Amount, pool.currencyA.decimals) >
                            balances[pool.currencyA.address]
                          ? `Insufficient ${pool.currencyA.symbol} balance`
                          : parseUnits(
                                currency0Amount,
                                pool.currencyA.decimals,
                              ) >
                              getAllowance(
                                getContractAddresses({
                                  chainId: selectedChain.id,
                                }).Minter,
                                pool.currencyA,
                              )
                            ? `Max Approve ${pool.currencyA.symbol}`
                            : parseUnits(
                                  currency1Amount,
                                  pool.currencyB.decimals,
                                ) > balances[pool.currencyB.address]
                              ? `Insufficient ${pool.currencyB.symbol} balance`
                              : parseUnits(
                                    currency1Amount,
                                    pool.currencyB.decimals,
                                  ) >
                                  getAllowance(
                                    getContractAddresses({
                                      chainId: selectedChain.id,
                                    }).Minter,
                                    pool.currencyB,
                                  )
                                ? `Max Approve ${pool.currencyB.symbol}`
                                : disableSwap &&
                                    (Number(currency0Amount) === 0 ||
                                      Number(currency1Amount) === 0)
                                  ? `Enter amount`
                                  : `Add Liquidity`,
                  }}
                />
              ) : (
                <RemoveLiquidityForm
                  chain={selectedChain}
                  pool={pool}
                  prices={{
                    ...prices,
                    [pool.lpCurrency.address]: pool.lpPriceUSD,
                  }}
                  lpCurrencyAmount={lpCurrencyAmount}
                  setLpCurrencyAmount={setLpCurrencyAmount}
                  availableLpCurrencyBalance={lpBalances[pool.key]}
                  receiveCurrencies={
                    receiveCurrencies.length === 2
                      ? [
                          {
                            currency: receiveCurrencies[0].currency,
                            amount: parseUnits(
                              receiveCurrencies[0].amount,
                              receiveCurrencies[0].currency.decimals,
                            ),
                          },
                          {
                            currency: receiveCurrencies[1].currency,
                            amount: parseUnits(
                              receiveCurrencies[1].amount,
                              receiveCurrencies[1].currency.decimals,
                            ),
                          },
                        ]
                      : [
                          {
                            currency: pool.currencyA,
                            amount: 0n,
                          },
                          {
                            currency: pool.currencyB,
                            amount: 0n,
                          },
                        ]
                  }
                  slippageInput={slippageInput}
                  setSlippageInput={setSlippageInput}
                  isCalculatingReceiveCurrencies={
                    Number(lpCurrencyAmount) > 0 &&
                    receiveCurrencies.length === 0
                  }
                  actionButtonProps={{
                    disabled:
                      !walletClient ||
                      Number(lpCurrencyAmount) === 0 ||
                      parseUnits(lpCurrencyAmount, 18) > lpBalances[pool.key],
                    onClick: async () => {
                      await burn(
                        pool.currencyA,
                        pool.currencyB,
                        pool.salt,
                        lpCurrencyAmount,
                        slippageInput,
                      )
                    },
                    text: !walletClient
                      ? 'Connect wallet'
                      : Number(lpCurrencyAmount) === 0
                        ? 'Enter amount'
                        : parseUnits(lpCurrencyAmount, 18) >
                            lpBalances[pool.key]
                          ? `Insufficient ${pool.lpCurrency.symbol} balance`
                          : `Remove Liquidity`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
