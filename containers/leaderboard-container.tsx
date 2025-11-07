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
import { useWindowWidth } from '../hooks/useWindowWidth'
import { LeaderBoard } from '../components/leader-board'
import {
  fetchLiquidVaultBalanceLeaderboard,
  fetchLiquidVaultPoint,
} from '../apis/point'
import { CHAIN_CONFIG } from '../chain-configs'
import { TradingCompetition } from '../apis/trading-competition'
import { formatWithCommas } from '../utils/bignumber'

const BONUS_ADDRESSES = [
  '0xDE9638F6297053B90f0Fe13A022ADe5bE7F8d813',
  '0xb9dae0ccf36d2ab2f76ef2d361c89b44015a69a2',
  '0xa032d9816b83cf9ca5f90a26da65fd571a3c7416',
  '0xb30e2fBcfc78eD6dd67B8b15AD7d150809087805',
  '0x0b41789436edcc1796c9b95e16a0d6047f5bf88c',
  '0xc79f35f1c9fb8472347026e1c6f38d6f810312f6',
  '0xa3250a7c0d8babcc423d6746ce667aa2a01a20a1',
  '0x8D2A950b4DC57Aa9D2Fd014ca45D935c6C6D72Ad',
  '0x5ee7d599a01874c98b85747736dc545d3159faab',
  '0xbE6737f7fDd835aC2BD545e1936b81e0b9CBAB35',
]

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
        [CHAIN_CONFIG.DEFAULT_STABLE_COIN_CURRENCY.address]: '#4C82FB',
      },
    }
  }, [userDailyVolumes])

  return (
    <div ref={containerRef} className="relative w-full">
      <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden">
        <div className="min-w-[800px] sm:min-w-[964px] max-w-[964px] h-[158px] sm:h-[227px] relative bg-neutral-900 rounded-3xl p-4 sm:p-6 mx-auto lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
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
                {
                  label: new Date(hoverInfo.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  }),
                } as any,
                ...hoverInfo.volumes.map(({ label, value, address }) => ({
                  label,
                  color: tokenColorMap[getAddress(address)] ?? '#ffffff',
                  value: `$${formatWithCommas(value.toFixed(2))}`,
                })),
              ]}
            />
          </div>
        )}
    </div>
  )
}

export const LeaderboardContainer = () => {
  const [tab, setTab] = useState<
    'vault' | 'volume' | 'competition-season1' | 'competition-season2'
  >('volume')
  const { address: userAddress } = useAccount()
  const { selectedChain } = useChainContext()
  const tradingCompetitionSeason1 = new TradingCompetition({
    subgraphEndpoint:
      CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.TRADING_COMPETITION_SEASON1,
    seasonEndTimestamp: 1747353600,
    blacklistedUserAddresses: [
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      '0xFC5899D93df81CA11583BEE03865b7B13cE093A7',
      '0x605fCbDCba6C99b70A0028593a61CA9205e93739',
      '0x255EC4A7dfefeed4889DbEB03d7aC06ADcCc2D24',
    ],
  })

  const tradingCompetitionSeason2 = new TradingCompetition({
    subgraphEndpoint:
      CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.TRADING_COMPETITION_SEASON2,
    seasonEndTimestamp: 1756684800,
    blacklistedUserAddresses: ['0x5F79EE8f8fA862E98201120d83c4eC39D9468D49'],
  })

  // user data
  const {
    data: { points: myVaultPoint, lpBalance: myVaultLpBalance },
  } = useQuery({
    queryKey: ['my-vault-point', selectedChain.id, userAddress],
    queryFn: async () => {
      if (!userAddress) {
        return { points: 0, lpBalance: 0 }
      }
      return fetchLiquidVaultPoint(userAddress)
    },
    initialData: { points: 0, lpBalance: 0 },
  }) as {
    data: {
      points: number
      lpBalance: number
    }
  }

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
        return null
      }
      return tradingCompetitionSeason1.getUserPnL({
        userAddress,
      })
    },
    initialData: null,
  })

  const { data: myTradingCompetitionSeason2PnL } = useQuery({
    queryKey: [
      'trading-competition-season2-user-pnl',
      selectedChain.id,
      userAddress,
    ],
    queryFn: async () => {
      if (!userAddress) {
        return null
      }
      return tradingCompetitionSeason2.getUserPnL({
        userAddress,
      })
    },
    initialData: null,
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
      return tradingCompetitionSeason1.getTradingCompetitionLeaderboard({
        maxUsers: 1000,
      })
    },
  })

  const { data: allUserTradingCompetitionSeason2PnL } = useQuery({
    queryKey: ['trading-competition-season2-leader-board', selectedChain.id],
    queryFn: async () => {
      return tradingCompetitionSeason2.getTradingCompetitionLeaderboard({
        maxUsers: 1000,
      })
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

  const myTradingCompetitionSeason2Rank = useMemo(() => {
    if (allUserTradingCompetitionSeason2PnL && userAddress) {
      const index = Object.keys(allUserTradingCompetitionSeason2PnL).findIndex(
        (address) => isAddressEqual(getAddress(address), userAddress),
      )
      return index + 1
    }
    return 0
  }, [allUserTradingCompetitionSeason2PnL, userAddress])

  const countUpFormatter = useCallback((value: number): string => {
    return formatWithCommas(value.toFixed(2))
  }, [])

  return (
    <div className="w-full flex items-center flex-col text-white px-4 gap-8 mt-16 md:mt-12">
      <div className="w-full lg:w-[960px] flex flex-col sm:gap-12 items-center">
        {userAddress && (
          <div className="flex w-full h-20 mt-14 sm:mt-0 sm:h-28 px-4 justify-start items-center gap-3 sm:gap-4">
            <div className="grow shrink basis-0 h-full px-6 py-4 sm:px-8 sm:py-6 bg-neutral-900 rounded-xl sm:rounded-2xl flex-col justify-center items-center gap-3 inline-flex lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
              <div className="text-center text-gray-400 text-xs sm:text-sm font-medium text-nowrap">
                Volume Point
              </div>
              <div className="self-stretch text-center text-white text-base sm:text-xl font-semibold">
                <CountUp
                  end={
                    myNativeVolume / 10 +
                    (BONUS_ADDRESSES.some((addr) =>
                      isAddressEqual(addr as `0x${string}`, userAddress),
                    )
                      ? 1000
                      : 0)
                  }
                  formattingFn={countUpFormatter}
                  preserveValue
                  useEasing={false}
                  duration={0.5}
                />
              </div>
            </div>

            <div className="grow shrink basis-0 h-full px-6 py-4 sm:px-8 sm:py-6 bg-neutral-900 rounded-xl sm:rounded-2xl flex-col justify-center items-center gap-3 inline-flex lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
              <div className="text-center text-gray-400 text-xs sm:text-sm font-medium text-nowrap">
                Vault Point
              </div>
              <div className="self-stretch text-center text-white text-base sm:text-xl font-semibold">
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
        )}
      </div>

      {userAddress && <Heatmap userDailyVolumes={myDailyVolumes} />}

      <div className="w-full md:flex md:justify-center relative">
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-12 mb-4 md:w-[616px]">
          <div className="w-full flex flex-col gap-4 sm:gap-0 sm:flex-row text-white text-sm sm:text-base font-semibold">
            <span className="text-center sm:text-left">Leaderboard</span>
            <div className="flex ml-auto gap-1">
              <button
                onClick={() => setTab('volume')}
                disabled={tab === 'volume'}
                className="flex text-xs sm:text-sm font-medium w-full items-center justify-center px-4 sm:px-5 py-1.5 disabled:bg-blue-500/30 rounded-[10px]"
              >
                Volume
              </button>
              <button
                onClick={() => setTab('vault')}
                disabled={tab === 'vault'}
                className="flex text-xs sm:text-sm font-medium w-full items-center justify-center px-4 sm:px-5 py-1.5 disabled:bg-blue-500/30 rounded-[10px]"
              >
                Vault
              </button>
              <button
                onClick={() => setTab('competition-season1')}
                disabled={tab === 'competition-season1'}
                className="flex text-xs sm:text-sm font-medium w-full items-center justify-center px-4 sm:px-5 py-1.5 disabled:bg-blue-500/30 rounded-[10px]"
              >
                Season1
              </button>
              <button
                onClick={() => setTab('competition-season2')}
                disabled={tab === 'competition-season2'}
                className="flex text-sm font-medium w-full items-center justify-center px-4 sm:px-5 py-1.5 disabled:bg-blue-500/30 rounded-[10px]"
              >
                Season2
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
                        ? 'Lp Balance'
                        : 'PnL'}
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
                          value: `${formatWithCommas(myNativeVolume.toFixed(4))}`,
                        }
                      : undefined
                  }
                  values={allUserNativeVolume.map(
                    ({ address, nativeVolume }, index) => ({
                      address: getAddress(address),
                      value: `${formatWithCommas(nativeVolume.toFixed(4))}`,
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
                          value: `${formatWithCommas(myVaultLpBalance.toFixed(4))}`,
                        }
                      : undefined
                  }
                  values={allUserLP.map(({ address, balance }, index) => ({
                    address: getAddress(address),
                    value: `${formatWithCommas(balance.toFixed(4))}`,
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
                          value: `${formatWithCommas((myTradingCompetitionSeason1PnL?.totalPnl ?? 0).toFixed(4))}`,
                        }
                      : undefined
                  }
                  values={Object.entries(
                    allUserTradingCompetitionSeason1PnL,
                  ).map(([address, { totalPnl }], index) => ({
                    address: getAddress(address),
                    value: `${formatWithCommas(totalPnl.toFixed(4))}`,
                    rank: index + 1,
                  }))}
                  maxDisplayRank={1000}
                />
              ) : (
                <Loading />
              )}
            </>
          )}

          {tab === 'competition-season2' && (
            <>
              {allUserTradingCompetitionSeason2PnL ? (
                <LeaderBoard
                  explorerUrl={selectedChain.blockExplorers?.default.url ?? ''}
                  myValue={
                    userAddress
                      ? {
                          address: userAddress,
                          rank: myTradingCompetitionSeason2Rank,
                          value: `${formatWithCommas((myTradingCompetitionSeason2PnL?.totalPnl ?? 0).toFixed(4))}`,
                        }
                      : undefined
                  }
                  values={Object.entries(
                    allUserTradingCompetitionSeason2PnL,
                  ).map(([address, { totalPnl }], index) => ({
                    address: getAddress(address),
                    value: `${formatWithCommas(totalPnl.toFixed(4))}`,
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
