import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAddress, isAddressEqual } from 'viem'
import { UTCTimestamp } from 'lightweight-charts'
import { getProtocolAnalytics } from '@clober/v2-sdk'
import {
  AnalyticsSnapshot,
  AnalyticsSummary,
} from '@clober/v2-sdk/dist/types/entities/analytics/types'

import { useChainContext } from '../contexts/chain-context'
import { HistogramChart } from '../components/chart/histogram-chart'
import { Loading } from '../components/loading'
import { CHAIN_CONFIG } from '../chain-configs'
import RestrictedPageGuard from '../containers/restricted-page-guard'
import { getStartOfTodayTimestampInSeconds } from '../utils/date'
import { Currency } from '../model/currency'

const buildCurrencyLabel = (currency: Currency): string =>
  `${currency.symbol}(${currency.address.slice(2, 6)})`

export default function Analytics() {
  const { selectedChain } = useChainContext()

  const { data: analytics } = useQuery({
    queryKey: ['analytics', selectedChain.id],
    queryFn: async () => {
      const protocolAnalytics = await getProtocolAnalytics({
        chainId: selectedChain.id,
      })
      const startOfTodayTimestampInSeconds = getStartOfTodayTimestampInSeconds()
      const analyticsSnapshots: AnalyticsSnapshot[] =
        protocolAnalytics.analyticsSnapshots
          .filter((item) => item.timestamp !== startOfTodayTimestampInSeconds)
          .map((item) => {
            const volume24hUSDMap = Object.fromEntries(
              Object.entries(item.volume24hUSDMap).filter(
                ([address]) =>
                  !CHAIN_CONFIG.ANALYTICS_VOLUME_BLACKLIST.some(
                    (blacklist) =>
                      blacklist.timestamp === item.timestamp &&
                      isAddressEqual(blacklist.address, getAddress(address)),
                  ),
              ),
            )
            const protocolFees24hUSDMap = Object.fromEntries(
              Object.entries(item.protocolFees24hUSDMap).filter(
                ([address]) =>
                  !CHAIN_CONFIG.ANALYTICS_VOLUME_BLACKLIST.some(
                    (blacklist) =>
                      blacklist.timestamp === item.timestamp &&
                      isAddressEqual(blacklist.address, getAddress(address)),
                  ),
              ),
            )
            const totalValueLockedUSDMap = Object.fromEntries(
              Object.entries(item.totalValueLockedUSDMap).filter(
                ([address]) =>
                  !CHAIN_CONFIG.ANALYTICS_VOLUME_BLACKLIST.some(
                    (blacklist) =>
                      blacklist.timestamp === item.timestamp &&
                      isAddressEqual(blacklist.address, getAddress(address)),
                  ),
              ),
            )
            return {
              ...item,
              volume24hUSD: Object.values(volume24hUSDMap).reduce(
                (acc, { usd }) => acc + usd,
                0,
              ),
              volume24hUSDMap,
              protocolFees24hUSD: Object.values(protocolFees24hUSDMap).reduce(
                (acc, { usd }) => acc + usd,
                0,
              ),
              protocolFees24hUSDMap,
              totalValueLockedUSD: Object.values(totalValueLockedUSDMap).reduce(
                (acc, { usd }) => acc + usd,
                0,
              ),
              totalValueLockedUSDMap,
            }
          })
      return {
        accumulatedUniqueUsers: protocolAnalytics.accumulatedUniqueUsers,
        accumulatedUniqueTransactions:
          protocolAnalytics.accumulatedUniqueTransactions,
        accumulatedVolumeUSD: analyticsSnapshots.reduce(
          (acc, item) => acc + item.volume24hUSD,
          0,
        ),
        accumulatedProtocolFeesUSD: analyticsSnapshots.reduce(
          (acc, item) => acc + item.protocolFees24hUSD,
          0,
        ),
        analyticsSnapshots,
      }
    },
    initialData: null,
  }) as {
    data: AnalyticsSummary | null
  }

  const uniqueCurrencies = useMemo(() => {
    const currencies = (analytics?.analyticsSnapshots ?? []).flatMap((item) =>
      Object.values(item.volume24hUSDMap).map(({ currency }) => currency),
    )
    return currencies.filter(
      (currency, index, self) =>
        index ===
        self.findIndex((c) => isAddressEqual(c.address, currency.address)),
    )
  }, [analytics])

  const tokenColorMap = useMemo(() => {
    return {
      ...Object.fromEntries(
        uniqueCurrencies.map((currency, index) => {
          const baseHue = (index * 47) % 360
          const hue = (baseHue + (index % 2) * 240) % 360
          return [getAddress(currency.address), `hsl(${hue}, 70%, 50%)`]
        }),
      ),
      ...{
        ['0x0000000000000000000000000000000000000000']: '#FC72FF',
        [getAddress('0xf817257fed379853cDe0fa4F97AB987181B1E5Ea')]: '#4C82FB',
      },
    }
  }, [uniqueCurrencies]) as Record<`0x${string}`, string>

  const transactionTypeColorMap = useMemo(() => {
    const transactionTypes = [
      ...new Set(
        (analytics?.analyticsSnapshots ?? []).flatMap((item) =>
          Object.keys(item.transactionTypeCounts).map((type) => type),
        ),
      ),
    ].sort()

    return Object.fromEntries(
      transactionTypes.map((type, index) => {
        const baseHue = (index * 47) % 360
        const hue = (baseHue + (index % 2) * 180) % 360
        return [type, `hsl(${hue}, 70%, 50%)`]
      }),
    )
  }, [analytics])

  return (
    <RestrictedPageGuard>
      {analytics && (
        <div className="flex flex-col w-full h-full items-center justify-center gap-8 px-16 pb-16">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <div className="text-white text-sm md:text-base font-bold">
                Daily Volume
              </div>

              <div className="flex w-[350px] sm:w-[1016px]">
                <HistogramChart
                  prefix={'$'}
                  data={(analytics?.analyticsSnapshots ?? [])
                    .map((item) => {
                      return {
                        time: item.timestamp as UTCTimestamp,
                        values: {
                          ...Object.fromEntries(
                            Object.entries(item.volume24hUSDMap).map(
                              ([, { currency, usd }]) =>
                                [buildCurrencyLabel(currency), usd] as [
                                  string,
                                  number,
                                ],
                            ),
                          ),
                        },
                      }
                    })
                    .sort((a, b) => a.time - b.time)}
                  colors={
                    Object.entries(tokenColorMap)
                      .map(([address, color]) => {
                        const currency = uniqueCurrencies.find((currency) =>
                          isAddressEqual(
                            getAddress(currency.address),
                            getAddress(address),
                          ),
                        )
                        if (!currency) {
                          return null
                        }
                        return {
                          label: buildCurrencyLabel(currency),
                          color,
                        }
                      })
                      .filter(
                        (item): item is { label: string; color: string } =>
                          !!item,
                      )
                      .sort() as { label: string; color: string }[]
                  }
                  defaultValue={analytics?.accumulatedVolumeUSD ?? 0}
                  height={312}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col flex-1">
              <div className="text-white text-sm md:text-base font-bold">
                Daily Active Wallets
              </div>

              <div className="flex w-[350px] sm:w-[500px]">
                <HistogramChart
                  data={(analytics?.analyticsSnapshots ?? []).map((item) => ({
                    time: item.timestamp as UTCTimestamp,
                    values: {
                      Returning: item.activeUsers - item.firstTimeUsers,
                      New: item.firstTimeUsers,
                    },
                  }))}
                  colors={[
                    { label: 'New', color: '#40DE7A' },
                    { label: 'Returning', color: '#3B82F6' },
                  ]}
                  defaultValue={analytics?.accumulatedUniqueUsers ?? 0}
                  height={312}
                />
              </div>
            </div>

            <div className="flex flex-col flex-1">
              <div className="text-white text-sm md:text-base font-bold">
                Daily Transactions
              </div>

              <div className="flex w-[350px] sm:w-[500px]">
                <HistogramChart
                  data={(analytics?.analyticsSnapshots ?? []).map((item) => ({
                    time: item.timestamp as UTCTimestamp,
                    values: {
                      ...Object.fromEntries(
                        Object.entries(item.transactionTypeCounts)
                          .map(
                            ([type, count]) =>
                              [type, count] as [string, number],
                          )
                          .filter(([type]) => type !== 'Unknown'),
                      ),
                    },
                  }))}
                  colors={Object.entries(transactionTypeColorMap)
                    .filter(([type]) => type !== 'Unknown')
                    .map(([type, color]) => ({
                      label: type,
                      color,
                    }))}
                  defaultValue={analytics?.accumulatedUniqueTransactions ?? 0}
                  height={312}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <div className="text-white text-sm md:text-base font-bold">
                Daily Protocol Fees
              </div>

              <div className="flex w-[350px] sm:w-[1016px]">
                <HistogramChart
                  prefix={'$'}
                  data={(analytics?.analyticsSnapshots ?? [])
                    .map((item) => {
                      return {
                        time: item.timestamp as UTCTimestamp,
                        values: {
                          ...Object.fromEntries(
                            Object.entries(item.protocolFees24hUSDMap).map(
                              ([, { currency, usd }]) =>
                                [buildCurrencyLabel(currency), usd] as [
                                  string,
                                  number,
                                ],
                            ),
                          ),
                        },
                      }
                    })
                    .sort((a, b) => a.time - b.time)}
                  colors={
                    Object.entries(tokenColorMap)
                      .map(([address, color]) => {
                        const currency = uniqueCurrencies.find((currency) =>
                          isAddressEqual(
                            getAddress(currency.address),
                            getAddress(address),
                          ),
                        )
                        if (!currency) {
                          return null
                        }
                        return {
                          label: buildCurrencyLabel(currency),
                          color,
                        }
                      })
                      .filter(
                        (item): item is { label: string; color: string } =>
                          !!item,
                      )
                      .sort() as { label: string; color: string }[]
                  }
                  defaultValue={analytics?.accumulatedProtocolFeesUSD ?? 0}
                  height={312}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <div className="text-white text-sm md:text-base font-bold">
                Daily TVL
              </div>

              <div className="flex w-[350px] sm:w-[1016px]">
                <HistogramChart
                  prefix={'$'}
                  data={(analytics?.analyticsSnapshots ?? [])
                    .map((item) => {
                      return {
                        time: item.timestamp as UTCTimestamp,
                        values: {
                          ...Object.fromEntries(
                            Object.entries(item.totalValueLockedUSDMap).map(
                              ([, { currency, usd }]) =>
                                [buildCurrencyLabel(currency), usd] as [
                                  string,
                                  number,
                                ],
                            ),
                          ),
                        },
                      }
                    })
                    .sort((a, b) => a.time - b.time)}
                  colors={
                    Object.entries(tokenColorMap)
                      .map(([address, color]) => {
                        const currency = uniqueCurrencies.find((currency) =>
                          isAddressEqual(
                            getAddress(currency.address),
                            getAddress(address),
                          ),
                        )
                        if (!currency) {
                          return null
                        }
                        return {
                          label: buildCurrencyLabel(currency),
                          color,
                        }
                      })
                      .filter(
                        (item): item is { label: string; color: string } =>
                          !!item,
                      )
                      .sort() as { label: string; color: string }[]
                  }
                  defaultValue={
                    analytics && analytics.analyticsSnapshots
                      ? analytics.analyticsSnapshots[
                          analytics.analyticsSnapshots.length - 1
                        ].totalValueLockedUSD
                      : 0
                  }
                  height={312}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <div className="text-white text-sm md:text-base font-bold">
                Daily Vault TVL
              </div>

              <div className="flex w-[350px] sm:w-[1016px]">
                <HistogramChart
                  prefix={'$'}
                  data={(analytics?.analyticsSnapshots ?? [])
                    .map((item) => {
                      return {
                        time: item.timestamp as UTCTimestamp,
                        values: {
                          ...Object.fromEntries(
                            Object.entries(item.poolTotalValueLockedUSDMap).map(
                              ([, { currency, usd }]) =>
                                [buildCurrencyLabel(currency), usd] as [
                                  string,
                                  number,
                                ],
                            ),
                          ),
                        },
                      }
                    })
                    .sort((a, b) => a.time - b.time)}
                  colors={
                    Object.entries(tokenColorMap)
                      .map(([address, color]) => {
                        const currency = uniqueCurrencies.find((currency) =>
                          isAddressEqual(
                            getAddress(currency.address),
                            getAddress(address),
                          ),
                        )
                        if (!currency) {
                          return null
                        }
                        return {
                          label: buildCurrencyLabel(currency),
                          color,
                        }
                      })
                      .filter(
                        (item): item is { label: string; color: string } =>
                          !!item,
                      )
                      .sort() as { label: string; color: string }[]
                  }
                  defaultValue={
                    analytics && analytics.analyticsSnapshots
                      ? analytics.analyticsSnapshots[
                          analytics.analyticsSnapshots.length - 1
                        ].poolTotalValueLockedUSD
                      : 0
                  }
                  height={312}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!analytics && <Loading />}

      <div className="flex sm:mb-[400px]" />
    </RestrictedPageGuard>
  )
}
