import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { getAddress, isAddressEqual } from 'viem'
import CountUp from 'react-countup'
import {
  getTopUsersByNativeVolume,
  getUserDailyVolumes,
  getUserNativeVolume,
  UserVolumeSnapshot,
} from '@clober/v2-sdk'

import { useChainContext } from '../contexts/chain-context'
import { Legend } from '../components/chart/legend'
import { Loading } from '../components/loading'
import { toCommaSeparated } from '../utils/number'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { LeaderBoard } from '../components/leader-board'
import {
  fetchLiquidVaultBalanceLeaderboard,
  fetchLiquidVaultPoint,
} from '../apis/point'
import { CHAIN_CONFIG } from '../chain-configs'
import {
  fetchTradingCompetitionLeaderboard,
  fetchUserPnL,
} from '../apis/trading-competition/season1'

type HeatmapProps = {
  userDailyVolumes: UserVolumeSnapshot[]
  monthLabels?: string[]
}

const getColor = (value: number) => {
  value = Math.log10(value)
  if (value >= 6) {
    return 'bg-blue-900'
  }
  if (value >= 5) {
    return 'bg-blue-700'
  }
  if (value >= 4) {
    return 'bg-blue-600'
  }
  if (value >= 3) {
    return 'bg-blue-500'
  }
  if (value >= 2) {
    return 'bg-blue-400'
  }
  if (value >= 1) {
    return 'bg-blue-300'
  }
  return 'bg-[#2b3544]'
}

function getStartOfLastMonth(): Date {
  const lastMonth = new Date(2025, 1, 1)
  lastMonth.setHours(0, 0, 0, 0)
  return lastMonth
}

function groupSnapshotsByDay(userVolumeSnapshots: UserVolumeSnapshot[]) {
  const grouped: Record<
    string,
    {
      dailyVolumeUSD: number
      dailyVolumes: { label: string; usd: number; address: `0x${string}` }[]
      timestamp: number
    }
  > = {}

  for (const entry of userVolumeSnapshots) {
    const date = new Date(entry.timestamp * 1000)
    date.setHours(0, 0, 0, 0)
    const key = date.toISOString()

    const dailyVolumes = Object.values(entry.volume24hUSDMap)
      .map(({ currency, usd }) => ({
        label: currency.symbol,
        usd,
        address: currency.address,
      }))
      .filter(({ usd }) => usd > 0)
    grouped[key] = {
      dailyVolumeUSD: dailyVolumes.reduce((acc, { usd }) => acc + usd, 0),
      dailyVolumes,
      timestamp: entry.timestamp,
    }
  }

  return grouped
}

const getMonthLabels = (): string[] => {
  const labels: string[] = []
  const start = getStartOfLastMonth()

  for (let i = 0; i < 8; i++) {
    const month = start.toLocaleString('en-US', { month: 'short' })
    labels.push(month)
    start.setMonth(start.getMonth() + 1)
  }

  return labels
}

function Heatmap({ userDailyVolumes, monthLabels }: HeatmapProps) {
  const width = useWindowWidth()
  const months = monthLabels ?? getMonthLabels()
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hoverInfo, setHoverInfo] = useState<{
    volumes: { label: string; value: number; address: `0x${string}` }[]
    date: string
    top: number
    left: number
  } | null>(null)

  const heatmapData = useMemo(() => {
    const grouped = groupSnapshotsByDay(userDailyVolumes)
    const start = getStartOfLastMonth()
    const matrix = []

    for (let week = 0; week < 44; week++) {
      const weekData = []

      for (let day = 0; day < 7; day++) {
        const current = new Date(start)
        current.setDate(start.getDate() + week * 7 + day)
        const key = current.toISOString()

        weekData.push({
          dailyVolumeUSD: grouped[key]?.dailyVolumeUSD ?? 0,
          dailyVolumes: grouped[key]?.dailyVolumes ?? [],
          timestamp: grouped[key]?.timestamp ?? 0,
        })
      }

      matrix.push(weekData)
    }

    return matrix
  }, [userDailyVolumes])

  const startDate = useMemo(() => getStartOfLastMonth(), [])

  const tokenColorMap = useMemo(() => {
    const addresses = [
      ...new Set(
        userDailyVolumes.flatMap((item) => Object.keys(item.volume24hUSDMap)),
      ),
    ].sort()

    return {
      ...Object.fromEntries(
        addresses.map((address, index) => {
          const baseHue = (index * 47) % 360
          const hue = (baseHue + (index % 2) * 180) % 360
          return [address, `hsl(${hue}, 70%, 50%)`]
        }),
      ),
      ...{
        ['0x0000000000000000000000000000000000000000']: '#FC72FF',
        [getAddress('0xf817257fed379853cDe0fa4F97AB987181B1E5Ea')]: '#4C82FB',
      },
    }
  }, [userDailyVolumes])

  return (
    <div ref={containerRef} className="relative w-full">
      <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden">
        <div className="min-w-[800px] sm:min-w-[964px] max-w-[964px] h-[158px] sm:h-[227px] relative bg-[#18212f] rounded-3xl p-4 sm:p-6 mx-auto">
          <div className="absolute top-0 left-0 w-full h-full rounded-3xl pointer-events-none" />

          <div className="flex gap-[3px] sm:gap-[5px] mt-[24px] sm:mt-[32px]">
            {heatmapData.map((col, colIdx) => (
              <div
                key={colIdx}
                className="w-3 sm:w-4 flex flex-col gap-[3px] sm:gap-[5px]"
              >
                {col.map(({ dailyVolumes, dailyVolumeUSD }, rowIdx) => {
                  const date = new Date(startDate)
                  date.setDate(startDate.getDate() + colIdx * 7 + rowIdx)
                  const dateStr = date.toDateString()

                  return (
                    <div
                      key={rowIdx}
                      className={`${dailyVolumeUSD > 0 ? 'cursor-pointer' : ''} w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${getColor(dailyVolumeUSD)}`}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const scrollRect =
                          scrollRef.current?.getBoundingClientRect()
                        const containerRect =
                          containerRef.current?.getBoundingClientRect()

                        if (!scrollRect || !containerRect || width < 768) {
                          return
                        }

                        const offsetTop = rect.top - containerRect.top
                        const offsetLeft =
                          rect.left -
                          scrollRect.left +
                          (scrollRef.current?.scrollLeft ?? 0)

                        setHoverInfo({
                          volumes: dailyVolumes.map(
                            ({ label, usd, address }) => ({
                              label,
                              value: usd,
                              address: getAddress(address),
                            }),
                          ),
                          date: dateStr,
                          top: offsetTop + 24,
                          left: offsetLeft + rect.width / 2,
                        })
                      }}
                      onMouseLeave={() => setHoverInfo(null)}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          <div className="absolute top-[16px] sm:top-[24px] left-[16px] sm:left-[23px] flex gap-[60px] sm:gap-[78px] text-[10px] sm:text-sm text-gray-400 font-medium">
            {months.map((month) => (
              <div key={month} className="w-[40px] sm:w-[50px]">
                {month}
              </div>
            ))}
          </div>
        </div>
      </div>

      {hoverInfo &&
        hoverInfo.volumes.reduce((acc, { value }) => acc + value, 0) > 0 && (
          <div
            style={{
              position: 'absolute',
              top: hoverInfo.top,
              left: hoverInfo.left,
              transform: 'translate(-50%, -120%)',
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            <Legend
              data={[
                // {
                //   label: 'Total',
                //   color: '#3977db',
                //   value: `$${toCommaSeparated(hoverInfo.volumes.reduce((acc, { value }) => acc + value, 0).toFixed(2))}`,
                // },
                ...hoverInfo.volumes.map(({ label, value, address }) => ({
                  label,
                  color: tokenColorMap[getAddress(address)] ?? '#ffffff',
                  value: `$${toCommaSeparated(value.toFixed(2))}`,
                })),
              ]}
            />
          </div>
        )}
    </div>
  )
}

export const LeaderboardContainer = () => {
  const [tab, setTab] = useState<'vault' | 'volume' | 'competition-season1'>(
    'volume',
  )
  const { address: userAddress } = useAccount()
  const { selectedChain } = useChainContext()

  // user data
  const { data: myVaultPoint } = useQuery({
    queryKey: ['my-vault-point', selectedChain.id, userAddress],
    queryFn: async () => {
      if (!userAddress) {
        return 0
      }
      return fetchLiquidVaultPoint(selectedChain.id, userAddress)
    },
    initialData: 0,
  })

  const { data: myNativeVolume } = useQuery({
    queryKey: ['my-native-volume', selectedChain.id, userAddress],
    queryFn: async () => {
      if (!userAddress) {
        return 0
      }
      return getUserNativeVolume({
        chainId: selectedChain.id,
        userAddress,
      })
    },
    initialData: 0,
  })

  const { data: myDailyVolumes } = useQuery({
    queryKey: ['my-daily-volumes', selectedChain.id, userAddress],
    queryFn: async () => {
      if (!userAddress) {
        return []
      }
      const userDailyVolumes = await getUserDailyVolumes({
        chainId: selectedChain.id,
        userAddress,
      })
      return userDailyVolumes.filter(
        ({ volume24hUSDMap }) =>
          !Object.values(volume24hUSDMap).some(({ currency }) =>
            CHAIN_CONFIG.ANALYTICS_VOLUME_BLACKLIST.some(
              (blacklist) =>
                blacklist.timestamp === userDailyVolumes[0].timestamp &&
                isAddressEqual(blacklist.address, getAddress(currency.address)),
            ),
          ),
      )
    },
    initialData: [],
  })

  const { data: myTradingCompetitionSeason1PnL } = useQuery({
    queryKey: [
      'trading-competition-season1-user-pnl',
      selectedChain.id,
      userAddress,
    ],
    queryFn: async () => {
      if (!userAddress) {
        return 0
      }
      return fetchUserPnL(userAddress)
    },
    initialData: 0,
  })

  // leaderboards
  const { data: allUserNativeVolume } = useQuery({
    queryKey: ['native-volume-leaderboard', selectedChain.id],
    queryFn: async () => {
      const topUsers = await getTopUsersByNativeVolume({
        chainId: selectedChain.id,
      })
      return topUsers.filter(
        ({ address }) =>
          !CHAIN_CONFIG.BLACKLISTED_USERS.some((blacklist) =>
            isAddressEqual(blacklist, getAddress(address)),
          ),
      )
    },
    initialData: [],
  })

  const { data: allUserLP } = useQuery({
    queryKey: ['lp-leaderboard', selectedChain.id],
    queryFn: async () => {
      return fetchLiquidVaultBalanceLeaderboard()
    },
    initialData: [],
  })

  const { data: allUserTradingCompetitionSeason1PnL } = useQuery({
    queryKey: ['trading-competition-season1-leader-board', selectedChain.id],
    queryFn: async () => {
      return fetchTradingCompetitionLeaderboard()
    },
  })

  // ranks
  const myVolumeRank = useMemo(() => {
    if (allUserNativeVolume && userAddress) {
      const index = allUserNativeVolume.findIndex(({ address }) =>
        isAddressEqual(getAddress(address), userAddress),
      )
      return index + 1
    }
    return 0
  }, [allUserNativeVolume, userAddress])

  const myLPRank = useMemo(() => {
    if (allUserLP && userAddress) {
      const index = (allUserLP ?? []).findIndex(({ address }) =>
        isAddressEqual(getAddress(address), userAddress),
      )
      return index + 1
    }
    return 0
  }, [allUserLP, userAddress])

  const myTradingCompetitionSeason1Rank = useMemo(() => {
    if (allUserTradingCompetitionSeason1PnL && userAddress) {
      const index = Object.keys(allUserTradingCompetitionSeason1PnL).findIndex(
        (address) => isAddressEqual(getAddress(address), userAddress),
      )
      return index + 1
    }
    return 0
  }, [allUserTradingCompetitionSeason1PnL, userAddress])

  const countUpFormatter = useCallback((value: number): string => {
    return toCommaSeparated(value.toFixed(2))
  }, [])

  return (
    <div className="w-full flex items-center flex-col text-white mb-4 px-4 gap-8">
      <div className="w-full lg:w-[960px] flex flex-col sm:gap-12 items-center">
        <div className="flex w-full h-20 mt-6 sm:mt-0 sm:h-28 px-4 justify-start items-center gap-3 sm:gap-4">
          <div className="grow shrink basis-0 h-full px-6 py-4 sm:px-8 sm:py-6 bg-[rgba(96,165,250,0.10)] rounded-xl sm:rounded-2xl flex-col justify-center items-center gap-3 inline-flex bg-gray-800">
            <div className="text-center text-gray-400 text-sm sm:text-base font-semibold text-nowrap">
              Volume Point
            </div>
            <div className="self-stretch text-center text-white text-lg sm:text-2xl font-bold">
              <CountUp
                end={myNativeVolume / 10}
                formattingFn={countUpFormatter}
                preserveValue
                useEasing={false}
                duration={0.5}
              />
            </div>
          </div>

          <div className="grow shrink basis-0 h-full px-6 py-4 sm:px-8 sm:py-6 bg-[rgba(96,165,250,0.10)] rounded-xl sm:rounded-2xl flex-col justify-center items-center gap-3 inline-flex bg-gray-800">
            <div className="text-center text-gray-400 text-sm sm:text-base font-semibold text-nowrap">
              Vault Point
            </div>
            <div className="self-stretch text-center text-white text-lg sm:text-2xl font-bold">
              <CountUp
                end={myVaultPoint}
                formattingFn={countUpFormatter}
                preserveValue
                useEasing={false}
                duration={0.5}
              />
            </div>
          </div>
        </div>
      </div>

      {userAddress && <Heatmap userDailyVolumes={myDailyVolumes} />}

      <div className="w-full md:flex md:justify-center relative">
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-12 mb-4 md:w-[616px]">
          <div className="w-full flex flex-col gap-4 sm:gap-0 sm:flex-row text-white text-sm sm:text-lg font-bold">
            <span className="text-center sm:text-left">Leaderboard</span>
            <div className="flex ml-auto gap-1">
              <button
                onClick={() => setTab('volume')}
                disabled={tab === 'volume'}
                className="flex text-sm font-semibold w-full items-center justify-center px-4 sm:px-5 py-1.5 disabled:bg-blue-500/30 rounded-[10px]"
              >
                Volume
              </button>
              <button
                onClick={() => setTab('vault')}
                disabled={tab === 'vault'}
                className="flex text-sm font-semibold w-full items-center justify-center px-4 sm:px-5 py-1.5 disabled:bg-blue-500/30 rounded-[10px]"
              >
                Vault
              </button>
              <button
                onClick={() => setTab('competition-season1')}
                disabled={tab === 'competition-season1'}
                className="flex text-sm font-semibold w-full items-center justify-center px-4 sm:px-5 py-1.5 disabled:bg-blue-500/30 rounded-[10px]"
              >
                Season1
              </button>
            </div>
          </div>

          <div className="w-full py-3 sm:py-4 bg-[#1d1f27] sm:bg-[#1c1e27] rounded-xl inline-flex flex-col justify-start items-start gap-3">
            <div className="self-stretch px-4 sm:px-8 inline-flex justify-start items-start gap-1.5 sm:text-sm text-xs">
              <div className="w-16 flex justify-start items-center gap-2.5 text-gray-400">
                Rank
              </div>
              <div className="flex w-full">
                <div className="flex flex-1 justify-start items-center gap-2.5">
                  <div className="justify-start text-gray-400">User</div>
                </div>
                <div className="flex flex-1 justify-start items-center gap-2.5">
                  <div className="justify-start text-gray-400">
                    {tab === 'volume'
                      ? `Total ${CHAIN_CONFIG.CHAIN.nativeCurrency.symbol} Volume`
                      : tab === 'vault'
                        ? 'Vault Points'
                        : 'Season1 PnL'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {tab === 'volume' && (
            <>
              {allUserNativeVolume ? (
                <LeaderBoard
                  explorerUrl={selectedChain.blockExplorers?.default.url ?? ''}
                  myValue={
                    userAddress
                      ? {
                          address: userAddress,
                          rank: myVolumeRank,
                          value: `${toCommaSeparated(myNativeVolume.toFixed(4))}`,
                        }
                      : undefined
                  }
                  values={allUserNativeVolume.map(
                    ({ address, nativeVolume }, index) => ({
                      address: getAddress(address),
                      value: `${toCommaSeparated(nativeVolume.toFixed(4))}`,
                      rank: index + 1,
                    }),
                  )}
                  maxDisplayRank={1000}
                />
              ) : (
                <Loading />
              )}
            </>
          )}

          {tab === 'vault' && (
            <>
              {allUserLP ? (
                <LeaderBoard
                  explorerUrl={selectedChain.blockExplorers?.default.url ?? ''}
                  myValue={
                    userAddress
                      ? {
                          address: userAddress,
                          rank: myLPRank,
                          value: `${toCommaSeparated(myVaultPoint.toFixed(4))}`,
                        }
                      : undefined
                  }
                  values={allUserLP.map(({ address, balance }, index) => ({
                    address: getAddress(address),
                    value: `${toCommaSeparated(balance.toFixed(4))}`,
                    rank: index + 1,
                  }))}
                  maxDisplayRank={1000}
                />
              ) : (
                <Loading />
              )}
            </>
          )}

          {tab === 'competition-season1' && (
            <>
              {allUserTradingCompetitionSeason1PnL ? (
                <LeaderBoard
                  explorerUrl={selectedChain.blockExplorers?.default.url ?? ''}
                  myValue={
                    userAddress
                      ? {
                          address: userAddress,
                          rank: myTradingCompetitionSeason1Rank,
                          value: `${toCommaSeparated(myTradingCompetitionSeason1PnL.toFixed(4))}`,
                        }
                      : undefined
                  }
                  values={Object.entries(
                    allUserTradingCompetitionSeason1PnL,
                  ).map(([address, totalPnl], index) => ({
                    address: getAddress(address),
                    value: `${toCommaSeparated(totalPnl.toFixed(4))}`,
                    rank: index + 1,
                  }))}
                  maxDisplayRank={1000}
                />
              ) : (
                <Loading />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
