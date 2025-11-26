import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

import { SearchSvg } from '../svg/search-svg'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import { CurrencyIcon } from '../icon/currency-icon'
import { Chain } from '../../model/chain'
import { formatTinyNumber } from '../../utils/bignumber'
import { MarketSnapshot } from '../../contexts/trade/market-context'

const MarketSelect = ({
  chain,
  markets,
  onMarketSelect,
}: {
  chain: Chain
  markets: MarketSnapshot[]
  onMarketSelect: (market: MarketSnapshot) => void
} & React.HTMLAttributes<HTMLDivElement>) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const width = useWindowWidth()

  useEffect(() => {
    if (width > 0 && width >= 640) {
      inputRef.current?.focus()
    }
  }, [width])

  const [searchValue, setSearchValue] = useState('')
  const filteredMarkets = useMemo(
    () =>
      markets.filter(
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
      ),
    [markets, searchValue],
  )

  return (
    <>
      <div className="flex flex-col w-full h-full mt-4">
        <div className="flex flex-col gap-4 w-full px-6">
          <div className="flex flex-col relative rounded-[10px] shadow-sm bg-[#24272e] outline outline-1 outline-offset-[-1px] outline-[#39393b]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center p-3">
              <div className="relative h-4 w-4">
                <SearchSvg />
              </div>
            </div>
            <div className="inline-block">
              <div className="invisible h-0 mx-[29px]" aria-hidden="true">
                Search
              </div>
              <input
                ref={inputRef}
                type="search"
                name="token-search"
                id="search"
                autoComplete="off"
                className="focus:outline-none focus-visible:outline-none focus:ring-1 focus:rounded-[10px] focus:ring-gray-400 inline w-full rounded-md border-0 pl-9 py-2.5 bg-[#2a2b2f] placeholder:text-gray-500 text-xs sm:text-sm text-white"
                placeholder="Search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>
          </div>

          <div className="flex w-full flex-row justify-start items-center text-white">
            <div className="min-w-[160px] w-[160px] max-w-[160px] flex justify-start text-[#8d94a1] text-xs font-medium">
              Market
            </div>

            <div className="flex w-full ml-3 sm:ml-4">
              <div className="flex w-full justify-start text-[#8d94a1] text-xs font-medium">
                Price
              </div>
              <div className="flex justify-start text-[#8d94a1] text-xs font-medium text-center">
                Change
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col overflow-y-auto custom-scrollbar bg-gray-[#17181e] rounded-b-xl sm:rounded-b-3xl">
          {filteredMarkets.map((market) => (
            <button
              key={market.marketId}
              className="flex flex-1 h-11 w-full px-6 py-3 justify-start items-center gap-1"
              onClick={() => {
                onMarketSelect(market)
              }}
            >
              <div className="flex items-center gap-1.5 h-4 min-w-[160px] w-[160px] max-w-[160px] overflow-x-scroll">
                <div className="w-[26px] h-4 shrink-0 relative">
                  <CurrencyIcon
                    chain={chain}
                    currency={market.base}
                    unoptimized={true}
                    className="w-4 h-4 absolute left-0 top-0 z-[1] rounded-full"
                  />
                  <CurrencyIcon
                    chain={chain}
                    currency={market.quote}
                    unoptimized={true}
                    className="w-4 h-4 absolute left-2.5 top-0 rounded-full"
                  />
                </div>

                <span className="text-white text-sm text-left font-medium text-nowrap">
                  {market.base.symbol}
                  <span className="text-gray-500">
                    {' '}
                    / {market.quote.symbol}
                  </span>
                </span>
              </div>

              <div className="flex w-full ml-3 sm:ml-4">
                <div className="flex flex-1 w-full text-white text-sm font-medium">
                  ${formatTinyNumber(market.priceUSD)}
                </div>

                <div
                  className={`flex-1 text-right text-sm font-medium ${market.priceChange24h > 0 ? 'text-[#39e79f]' : market.priceChange24h < 0 ? 'text-[#f85149]' : 'text-white'}`}
                >
                  {market.priceChange24h > 0 ? '+' : ''}
                  {(market.priceChange24h * 100).toFixed(2)}%
                </div>
              </div>
            </button>
          ))}

          {markets.length === 0 ? (
            <div className="flex items-center justify-center h-16">
              <Image src="/loading.gif" alt="loading" width={50} height={50} />
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  )
}

export default MarketSelect
