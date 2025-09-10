import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FixedSizeGrid as Grid, FixedSizeList as List } from 'react-window'
import {
  getMarketSnapshots,
  MarketSnapshot as SdkMarketSnapshot,
} from '@clober/v2-sdk'
import { isAddressEqual } from 'viem'

import { MarketDailySnapshotCard } from '../components/card/market/market-daily-snapshot-card'
import { useChainContext } from '../contexts/chain-context'
import { TriangleDownSvg } from '../components/svg/triangle-down-svg'
import { useTransactionContext } from '../contexts/transaction-context'
import { Chain } from '../model/chain'
import { Loading } from '../components/loading'
import { CHAIN_CONFIG } from '../chain-configs'
import { useCurrencyContext } from '../contexts/currency-context'
import { currentTimestampInSeconds } from '../utils/date'
import { useWindowHeight } from '../hooks/useWindowHeight'
import { Toast } from '../components/toast'
import { ClipboardSvg } from '../components/svg/clipboard-svg'
import { SearchSvg } from '../components/svg/search-svg'

const MOBILE_ROW_HEIGHT = 195

type Column =
  | 'market'
  | 'age'
  | 'price'
  | 'daily-volume'
  | 'fdv'
  | 'daily-change'
  | 'verified'

type SortOption =
  | 'none'
  | 'market-desc'
  | 'market-asc'
  | 'age-desc'
  | 'age-asc'
  | 'price-desc'
  | 'price-asc'
  | 'daily-volume-desc'
  | 'daily-volume-asc'
  | 'fdv-desc'
  | 'fdv-asc'
  | 'daily-change-desc'
  | 'daily-change-asc'
  | 'verified-desc'
  | 'verified-asc'

type MarketSnapshot = SdkMarketSnapshot & {
  isBidTaken: boolean
  isAskTaken: boolean
  verified: boolean
}

const TriangleDown = ({
  column,
  sortOption,
}: {
  column: Column
  sortOption: SortOption
}) => {
  return sortOption === `${column}-asc` ? (
    <TriangleDownSvg className="rotate-180" />
  ) : sortOption === `${column}-desc` ? (
    <TriangleDownSvg />
  ) : (
    <></>
  )
}

const LOCAL_STORAGE_MARKET_SNAPSHOTS_KEY = (chain: Chain) =>
  `market-snapshots-${chain.id}`

const MarketSnapshotListRow = ({
  index,
  style,
  data,
}: {
  index: number
  style: React.CSSProperties
  data: {
    items: MarketSnapshot[]
    chain: Chain
    setIsCopyToast: (isCopyToast: boolean) => void
  }
}) => {
  const marketSnapshot = data.items[index]
  if (!marketSnapshot) {
    return null
  }

  return (
    <div style={style}>
      <MarketDailySnapshotCard
        chain={data.chain}
        baseCurrency={marketSnapshot.base}
        quoteCurrency={marketSnapshot.quote}
        createAt={marketSnapshot.createdAtTimestamp}
        price={marketSnapshot.priceUSD}
        dailyVolume={marketSnapshot.volume24hUSD}
        fdv={marketSnapshot.fdv}
        dailyChange={marketSnapshot.priceChange24h * 100}
        verified={marketSnapshot.verified}
        isBidTaken={marketSnapshot.isBidTaken || false}
        isAskTaken={marketSnapshot.isAskTaken || false}
        setIsCopyToast={data.setIsCopyToast}
      />
    </div>
  )
}

const MarketSnapshotGridCell = ({
  columnIndex,
  rowIndex,
  style,
  data,
}: {
  columnIndex: number
  rowIndex: number
  style: React.CSSProperties
  data: {
    items: MarketSnapshot[]
    columnCount: number
    chain: Chain
    setIsCopyToast: (isCopyToast: boolean) => void
  }
}) => {
  const index = rowIndex * data.columnCount + columnIndex
  const marketSnapshot = data.items[index]
  if (!marketSnapshot) {
    return null
  }

  const gapStyle =
    columnIndex === 0
      ? { paddingRight: 6 }
      : columnIndex === 1
        ? { paddingLeft: 6 }
        : {}

  return (
    <div style={{ ...style, ...gapStyle }}>
      <MarketDailySnapshotCard
        chain={data.chain}
        baseCurrency={marketSnapshot.base}
        quoteCurrency={marketSnapshot.quote}
        createAt={marketSnapshot.createdAtTimestamp}
        price={marketSnapshot.priceUSD}
        dailyVolume={marketSnapshot.volume24hUSD}
        fdv={marketSnapshot.fdv}
        dailyChange={marketSnapshot.priceChange24h * 100}
        verified={marketSnapshot.verified}
        isBidTaken={marketSnapshot.isBidTaken || false}
        isAskTaken={marketSnapshot.isAskTaken || false}
        setIsCopyToast={data.setIsCopyToast}
      />
    </div>
  )
}

export const DiscoverContainer = () => {
  const height = useWindowHeight()
  const { selectedChain } = useChainContext()
  const { currencies } = useCurrencyContext()
  const { lastIndexedBlockNumber } = useTransactionContext()
  const prevMarketSnapshots = useRef<MarketSnapshot[]>([])
  const prevSubgraphBlockNumber = useRef<number>(0)
  const [isCopyToast, setIsCopyToast] = useState(false)

  const [searchValue, setSearchValue] = React.useState('')
  const [sortOption, setSortOption] = useState<SortOption>('none')

  useEffect(() => {
    const storedMarketSnapshots = localStorage.getItem(
      LOCAL_STORAGE_MARKET_SNAPSHOTS_KEY(selectedChain),
    )
    if (storedMarketSnapshots) {
      const now = currentTimestampInSeconds()
      prevMarketSnapshots.current = (
        JSON.parse(storedMarketSnapshots) as MarketSnapshot[]
      ).map((marketSnapshot) => ({
        ...marketSnapshot,
        askBookUpdatedAt: now,
        bidBookUpdatedAt: now,
        isBidTaken: false,
        isAskTaken: false,
        verified: false,
      }))
    }
  }, [selectedChain])

  const isVerifiedMarket = useCallback(
    (marketSnapshot: SdkMarketSnapshot) => {
      return !!(
        currencies.find((currency) =>
          isAddressEqual(currency.address, marketSnapshot.base.address),
        ) &&
        currencies.find((currency) =>
          isAddressEqual(currency.address, marketSnapshot.quote.address),
        )
      )
    },
    [currencies],
  )

  const { data: marketSnapshots } = useQuery({
    queryKey: ['market-snapshots', selectedChain.id],
    queryFn: async () => {
      if (lastIndexedBlockNumber === 0) {
        return [] as MarketSnapshot[]
      }
      if (prevSubgraphBlockNumber.current !== lastIndexedBlockNumber) {
        const marketSnapshots = await getMarketSnapshots({
          chainId: selectedChain.id,
          options: {
            rpcUrl: CHAIN_CONFIG.RPC_URL,
          },
        })
        const newMarketSnapshots: MarketSnapshot[] = marketSnapshots.map(
          (marketSnapshot) => {
            const prevMarketSnapshot = prevMarketSnapshots.current.find(
              (snapshot) =>
                isAddressEqual(
                  snapshot.base.address,
                  marketSnapshot.base.address,
                ) &&
                isAddressEqual(
                  snapshot.quote.address,
                  marketSnapshot.quote.address,
                ),
            )
            return {
              ...marketSnapshot,
              isBidTaken:
                (prevMarketSnapshot &&
                  prevMarketSnapshot.bidBookUpdatedAt <
                    marketSnapshot.bidBookUpdatedAt) ||
                false,
              isAskTaken:
                (prevMarketSnapshot &&
                  prevMarketSnapshot.askBookUpdatedAt <
                    marketSnapshot.askBookUpdatedAt) ||
                false,
              verified: isVerifiedMarket(marketSnapshot),
            }
          },
        )
        prevMarketSnapshots.current = marketSnapshots.map((marketSnapshot) => ({
          ...marketSnapshot,
          isBidTaken: false,
          isAskTaken: false,
          verified: isVerifiedMarket(marketSnapshot),
        }))
        prevSubgraphBlockNumber.current = lastIndexedBlockNumber
        localStorage.setItem(
          LOCAL_STORAGE_MARKET_SNAPSHOTS_KEY(selectedChain),
          JSON.stringify(marketSnapshots),
        )
        return newMarketSnapshots
      }
      return prevMarketSnapshots.current
    },
    refetchInterval: 1000, // checked
    refetchIntervalInBackground: true,
  })

  const filteredMarketSnapshots = useMemo(() => {
    return (marketSnapshots ?? prevMarketSnapshots.current ?? [])
      .filter(
        (marketSnapshot) =>
          marketSnapshot.base.symbol
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          marketSnapshot.quote.symbol
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          marketSnapshot.base.name
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          marketSnapshot.quote.name
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          marketSnapshot.base.address
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          marketSnapshot.quote.address
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          `${marketSnapshot.base.name}${marketSnapshot.quote.name}`
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          `${marketSnapshot.base.symbol}${marketSnapshot.quote.symbol}`
            .toLowerCase()
            .includes(searchValue.toLowerCase()),
      )
      .sort((a, b) => {
        if (sortOption === 'none') {
          return (
            b.volume24hUSD - a.volume24hUSD ||
            b.totalValueLockedUSD - a.totalValueLockedUSD
          )
        } else if (sortOption === 'market-asc') {
          return a.base.symbol.localeCompare(b.base.symbol)
        } else if (sortOption === 'market-desc') {
          return b.base.symbol.localeCompare(a.base.symbol)
        } else if (sortOption === 'age-asc') {
          return a.createdAtTimestamp - b.createdAtTimestamp
        } else if (sortOption === 'age-desc') {
          return b.createdAtTimestamp - a.createdAtTimestamp
        } else if (sortOption === 'price-asc') {
          return a.price - b.price
        } else if (sortOption === 'price-desc') {
          return b.price - a.price
        } else if (sortOption === 'daily-volume-asc') {
          return a.volume24hUSD - b.volume24hUSD
        } else if (sortOption === 'daily-volume-desc') {
          return b.volume24hUSD - a.volume24hUSD
        } else if (sortOption === 'fdv-asc') {
          return a.fdv - b.fdv
        } else if (sortOption === 'fdv-desc') {
          return b.fdv - a.fdv
        } else if (sortOption === 'daily-change-asc') {
          return a.priceChange24h - b.priceChange24h
        } else if (sortOption === 'daily-change-desc') {
          return b.priceChange24h - a.priceChange24h
        } else if (sortOption === 'verified-asc') {
          return a.verified ? -1 : 1
        } else if (sortOption === 'verified-desc') {
          return b.verified ? -1 : 1
        }
        return 0
      })
  }, [marketSnapshots, searchValue, sortOption])

  const sort = useCallback(
    (column: Column) => {
      if (sortOption === 'none') {
        setSortOption(`${column}-desc` as SortOption)
      } else if (sortOption === `${column}-desc`) {
        setSortOption(`${column}-asc` as SortOption)
      } else if (sortOption === `${column}-asc`) {
        setSortOption(`${column}-desc` as SortOption)
      } else {
        setSortOption(`${column}-desc` as SortOption)
      }
    },
    [sortOption],
  )

  const listItemData = useMemo(
    () => ({
      items: filteredMarketSnapshots,
      chain: selectedChain,
      isCopyToast,
      setIsCopyToast,
    }),
    [filteredMarketSnapshots, isCopyToast, selectedChain],
  )

  const gridItemData = useMemo(
    () => ({
      items: filteredMarketSnapshots,
      columnCount: 2,
      chain: selectedChain,
      isCopyToast,
      setIsCopyToast,
    }),
    [filteredMarketSnapshots, isCopyToast, selectedChain],
  )

  return (
    <>
      <div className="absolute top-0 left-0 w-full lg:flex hidden justify-center items-center h-[60px] text-white z-[1000]">
        <div className="z-[1000] w-[360px] flex flex-col relative rounded-[10px] shadow-sm bg-[#24272e] outline outline-1 outline-offset-[-1px] outline-[#39393b]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center p-3">
            <div className="relative h-4 w-4">
              <SearchSvg />
            </div>
          </div>
          <div className="inline-block">
            <div className="invisible h-0 mx-[29px]" aria-hidden="true">
              Search markets
            </div>
            <input
              type="search"
              name="token-search"
              id="search"
              autoComplete="off"
              className="focus:outline-none focus-visible:outline-none focus:ring-1 focus:rounded-[10px] focus:ring-gray-400 inline w-full rounded-md border-0 pl-9 py-3 bg-gray-800 placeholder:text-gray-500 text-xs sm:text-sm text-white h-9"
              placeholder="Search markets"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="text-white mb-4 flex w-full lg:w-[1200px] flex-col mt-[26px] sm:mt-[44px] md:mt-[26px] px-4 md:px-0 gap-5 lg:gap-8">
        <div className="max-w-[360px] w-full flex lg:hidden flex-col relative rounded-[10px] shadow-sm bg-[#24272e] outline outline-1 outline-offset-[-1px] outline-[#39393b]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center p-3">
            <div className="relative h-4 w-4">
              <SearchSvg />
            </div>
          </div>
          <div className="inline-block">
            <div className="invisible h-0 mx-[29px]" aria-hidden="true">
              Search markets
            </div>
            <input
              type="search"
              name="token-search"
              id="search"
              autoComplete="off"
              className="focus:outline-none focus-visible:outline-none focus:ring-1 focus:rounded-[10px] focus:ring-gray-400 inline w-full rounded-md border-0 pl-9 py-3 bg-gray-800 placeholder:text-gray-500 text-xs sm:text-sm text-white h-9"
              placeholder="Search markets"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
        </div>

        <Toast
          isCopyToast={isCopyToast}
          setIsCopyToast={setIsCopyToast}
          durationInMs={1300}
        >
          <div className="w-[240px] items-center justify-center flex flex-row gap-1.5 text-white text-sm font-semibold">
            <ClipboardSvg />
            Address copied to clipboard
          </div>
        </Toast>

        <div className="text-[#8d94a1] text-sm font-medium absolute hidden lg:flex top-[84px] w-[1200px] py-2.5 px-4 justify-start items-center gap-4 z-[1] h-10 bg-[#222223] border-b border-[#2d2d2e] lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930] lg:rounded-tl-lg lg:rounded-tr-lg">
          <button
            onClick={() => sort('market')}
            className="w-[410px] flex items-center hover:underline cursor-pointer flex-row gap-0.5"
          >
            Market
            <TriangleDown column="market" sortOption={sortOption} />
          </button>
          <button
            onClick={() => sort('age')}
            className="w-[170px] flex items-center hover:underline cursor-pointer flex-row gap-0.5"
          >
            Age
            <TriangleDown column="age" sortOption={sortOption} />
          </button>
          <button
            onClick={() => sort('price')}
            className="w-[150px] flex items-center hover:underline cursor-pointer flex-row gap-0.5"
          >
            Price
            <TriangleDown column="price" sortOption={sortOption} />
          </button>
          <button
            onClick={() => sort('daily-volume')}
            className="flex flex-row gap-1.5 w-[170px] text-sm font-semibold hover:underline cursor-pointer"
          >
            24h Volume
          </button>
          <button
            onClick={() => sort('fdv')}
            className="w-[160px] flex items-center hover:underline cursor-pointer flex-row gap-0.5"
          >
            FDV
            <TriangleDown column="fdv" sortOption={sortOption} />
          </button>
          <button
            onClick={() => sort('daily-change')}
            className="w-[140px] flex items-center hover:underline cursor-pointer flex-row gap-0.5"
          >
            24h Change
            <TriangleDown column="daily-change" sortOption={sortOption} />
          </button>
          <button
            onClick={() => sort('verified')}
            className="flex items-center hover:underline cursor-pointer flex-row gap-0.5"
          >
            Verified
            <TriangleDown column="verified" sortOption={sortOption} />
          </button>
        </div>

        <div className="flex flex-col w-full h-full gap-6">
          {filteredMarketSnapshots.length === 0 && (
            <Loading className="mt-36 sm:mt-48" />
          )}

          <div className="relative flex w-full lg:w-[1200px] h-full mb-6">
            <div className="relative flex w-full h-full mb-6 rounded-2xl">
              {/* desktop: 1-column list */}
              {filteredMarketSnapshots.length > 0 && (
                <div className="hidden lg:block w-full overflow-hidden mt-10 bg-[#17181e] outline outline-1 outline-offset-[-1px] outline-[#272930]">
                  <List
                    height={Math.floor(height - 200)}
                    itemCount={filteredMarketSnapshots.length}
                    itemSize={37 + 12 * 2}
                    width={1200}
                    itemKey={(index) => `desktop-${index}`}
                    itemData={listItemData}
                  >
                    {MarketSnapshotListRow}
                  </List>
                </div>
              )}

              {/* tablet: 2-column grid (md~lg) */}
              <div className="hidden md:block lg:hidden overflow-hidden max-w-full">
                <Grid
                  columnCount={2}
                  columnWidth={Math.floor(
                    (window.innerWidth - 24 * 2) / 2 - 36,
                  )}
                  height={height}
                  rowCount={Math.ceil(filteredMarketSnapshots.length / 2)}
                  rowHeight={MOBILE_ROW_HEIGHT + 12}
                  width={window.innerWidth - 24 * 2}
                  itemKey={({ columnIndex, rowIndex }) =>
                    `tablet-${rowIndex}-${columnIndex}`
                  }
                  itemData={gridItemData}
                >
                  {MarketSnapshotGridCell}
                </Grid>
              </div>

              {/* mobile: 1-column list */}
              <div className="block md:hidden w-full overflow-hidden">
                <List
                  height={height - 20}
                  itemCount={filteredMarketSnapshots.length}
                  itemSize={MOBILE_ROW_HEIGHT + 12}
                  width="100%"
                  itemKey={(index) => `mobile-${index}`}
                  itemData={listItemData}
                >
                  {MarketSnapshotListRow}
                </List>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
