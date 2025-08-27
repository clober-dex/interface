import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tooltip } from 'react-tooltip'
import { FixedSizeGrid as Grid, FixedSizeList as List } from 'react-window'
import {
  getMarketSnapshots,
  MarketSnapshot as SdkMarketSnapshot,
} from '@clober/v2-sdk'
import { isAddressEqual } from 'viem'

import { MarketDailySnapshotCard } from '../components/card/market/market-daily-snapshot-card'
import { useChainContext } from '../contexts/chain-context'
import { SearchSvg } from '../components/svg/search-svg'
import { QuestionMarkSvg } from '../components/svg/question-mark-svg'
import { TriangleDownSvg } from '../components/svg/triangle-down-svg'
import { useTransactionContext } from '../contexts/transaction-context'
import { Chain } from '../model/chain'
import { Loading } from '../components/loading'
import { CHAIN_CONFIG } from '../chain-configs'
import { useCurrencyContext } from '../contexts/currency-context'
import { currentTimestampInSeconds } from '../utils/date'
import { useWindowHeight } from '../hooks/useWindowHeight'

const MOBILE_ROW_HEIGHT = 168

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
    }),
    [filteredMarketSnapshots, selectedChain],
  )

  const gridItemData = useMemo(
    () => ({
      items: filteredMarketSnapshots,
      columnCount: 2,
      chain: selectedChain,
    }),
    [filteredMarketSnapshots, selectedChain],
  )

  return (
    <div className="text-white mb-4 flex w-full lg:w-[1072px]  flex-col items-center mt-6 lg:mt-8 px-4 lg:px-0 gap-4 lg:gap-8">
      {/*<div className="flex max-w-[480px] lg:max-w-full mr-auto w-full lg:w-[432px] flex-col relative rounded shadow-sm">*/}
      {/*  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">*/}
      {/*    <div className="relative h-4 w-4">*/}
      {/*      <SearchSvg />*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*  <div className="inline-block">*/}
      {/*    <div className="invisible h-0 mx-[29px]" aria-hidden="true">*/}
      {/*      Search by markets*/}
      {/*    </div>*/}
      {/*    <input*/}
      {/*      type="search"*/}
      {/*      name="discover-search"*/}
      {/*      id="search"*/}
      {/*      autoComplete="off"*/}
      {/*      className="inline w-full pl-10 py-2 lg:py-3 text-white bg-gray-800 rounded-xl border border-solid border-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-400 flex-col placeholder:text-gray-400 text-xs sm:text-sm"*/}
      {/*      placeholder="Search markets"*/}
      {/*      value={searchValue}*/}
      {/*      onChange={(event) => setSearchValue(event.target.value)}*/}
      {/*    />*/}
      {/*  </div>*/}
      {/*</div>*/}

      <div className="flex flex-col w-full h-full gap-6">
        <div className="hidden lg:flex self-stretch px-4 justify-start items-center gap-4">
          <button
            onClick={() => sort('market')}
            className="w-[330px] flex items-center gap-1 text-sm font-semibold hover:underline cursor-pointer"
          >
            Market
            <TriangleDown column="market" sortOption={sortOption} />
          </button>
          <button
            onClick={() => sort('age')}
            className="w-[180px] flex items-center gap-1 text-sm font-semibold hover:underline cursor-pointer"
          >
            Age
            <TriangleDown column="age" sortOption={sortOption} />
          </button>
          <button
            onClick={() => sort('price')}
            className="w-[150px] flex items-center gap-1 text-sm font-semibold hover:underline cursor-pointer"
          >
            Price
            <TriangleDown column="price" sortOption={sortOption} />
          </button>
          <button
            onClick={() => sort('daily-volume')}
            className="flex flex-row gap-1 w-[160px] text-sm font-semibold hover:underline cursor-pointer"
          >
            24h Volume
            <div className="flex mr-auto justify-center items-center">
              <QuestionMarkSvg
                data-tooltip-id="24h-volume-info"
                data-tooltip-place="bottom-end"
                data-tooltip-html={'Cumulative volume from 00:00 UTC to now.'}
                className="w-3 h-3"
              />
              <Tooltip
                id="24h-volume-info"
                className="max-w-[300px] bg-gray-950 !opacity-100 z-[100]"
                clickable
              />
              <TriangleDown column="daily-volume" sortOption={sortOption} />
            </div>
          </button>
          <button
            onClick={() => sort('fdv')}
            className="w-[160px] flex items-center gap-1 text-sm font-semibold hover:underline cursor-pointer"
          >
            FDV
            <TriangleDown column="fdv" sortOption={sortOption} />
          </button>
          <button
            onClick={() => sort('daily-change')}
            className="w-[140px] flex items-center gap-1 text-sm font-semibold hover:underline cursor-pointer"
          >
            24h Change
            <TriangleDown column="daily-change" sortOption={sortOption} />
          </button>
          <button
            onClick={() => sort('verified')}
            className="flex items-center gap-1 text-sm font-semibold hover:underline cursor-pointer"
          >
            Verified
            <TriangleDown column="verified" sortOption={sortOption} />
          </button>
        </div>

        {filteredMarketSnapshots.length === 0 && (
          <Loading className="mt-36 sm:mt-24" />
        )}

        <div className="relative flex justify-center w-full lg:w-[1072px] h-full mb-6">
          <div className="relative flex justify-center w-full h-full mb-6">
            {/* desktop: 1-column list */}
            <div className="hidden lg:block w-full overflow-hidden">
              <List
                height={height - (64 + 12) * 2}
                itemCount={filteredMarketSnapshots.length}
                itemSize={64 + 12}
                width={1072}
                itemKey={(index) => `desktop-${index}`}
                itemData={listItemData}
              >
                {MarketSnapshotListRow}
              </List>
            </div>

            {/* tablet: 2-column grid (md~lg) */}
            <div className="hidden md:block lg:hidden w-full overflow-hidden">
              <Grid
                columnCount={2}
                columnWidth={Math.floor(
                  (window.innerWidth - 24 * 2) / 2 - 24 * 2,
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
                height={height}
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
  )
}
