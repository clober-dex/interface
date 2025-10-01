import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CHAIN_IDS } from '@clober/v2-sdk'

import {
  CustomTimezones,
  LanguageCode,
  ResolutionString,
  widget,
} from '../public/static/charting_library'
import CloberDatafeed from '../model/datafeed/clober-datafeed'
import { SUPPORTED_INTERVALS } from '../utils/chart'
import { Currency } from '../model/currency'
import { CHAIN_CONFIG } from '../chain-configs'

function getLanguageFromURL(): LanguageCode | null {
  const regex = new RegExp('[\\?&]lang=([^&#]*)')
  const results = regex.exec(location.search)
  return results === null
    ? null
    : (decodeURIComponent(results[1].replace(/\+/g, ' ')) as LanguageCode)
}

export const TradingViewChartContainer = ({
  chainId,
  baseCurrency,
  quoteCurrency,
  setShowOrderBook,
  totalSupply,
}: {
  chainId: CHAIN_IDS
  baseCurrency: Currency
  quoteCurrency: Currency
  setShowOrderBook: ((showOrderBook: boolean) => void) | undefined
  totalSupply?: number
}) => {
  const [tab, setTab] = useState<'price' | 'mcap'>(
    totalSupply ? 'mcap' : 'price',
  )
  const [interval, setInterval] = useState('60' as ResolutionString)
  const [fullscreen, setFullscreen] = useState(false)

  const chartContainerRef =
    useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>

  const symbol = useMemo(
    () => `${baseCurrency.symbol}/${quoteCurrency.symbol}`,
    [baseCurrency.symbol, quoteCurrency.symbol],
  )

  useEffect(() => {
    const tvWidget = new widget({
      symbol,
      datafeed: new CloberDatafeed(
        chainId,
        baseCurrency,
        quoteCurrency,
        totalSupply && tab === 'mcap' ? totalSupply : 1,
      ),
      interval,
      container: chartContainerRef.current,
      library_path: '/static/charting_library/',
      locale: getLanguageFromURL() || 'en',
      disabled_features: [
        'header_widget',
        'header_symbol_search',
        'symbol_search_hot_key',
        'use_localstorage_for_settings',
        'popup_hints',
      ],
      enabled_features: ['study_templates', 'hide_left_toolbar_by_default'],
      charts_storage_url: 'https://saveload.tradingview.com',
      charts_storage_api_version: '1.1',
      client_id: 'tradingview.com',
      user_id: 'public_user_id',
      theme: 'dark',
      timezone: Intl.DateTimeFormat().resolvedOptions()
        .timeZone as CustomTimezones,
      autosize: true,
      toolbar_bg: '#17181e',
      loading_screen: {
        backgroundColor: '#17181e',
        foregroundColor: '#17181e',
      },
      overrides: {
        'paneProperties.background': '#17181e',
        'paneProperties.backgroundGradientStartColor': '#17181e',
        'paneProperties.backgroundGradientEndColor': '#17181e',
      },
    })

    return () => {
      tvWidget.remove()
    }
  }, [symbol, interval, chainId, totalSupply, tab, baseCurrency, quoteCurrency])

  return (
    <>
      {fullscreen && (
        <div className="flex flex-col rounded-2xl bg-[#17181e] overflow-hidden min-h-[280px] w-full md:w-[480px] xl:w-[740px] xl:outline xl:outline-1 xl:outline-offset-[-1px] xl:outline-[#272930]" />
      )}
      <div
        className={`xl:outline xl:outline-1 xl:outline-offset-[-1px] xl:outline-[#272930] flex flex-col bg-[#17181e] overflow-hidden ${
          fullscreen
            ? 'w-full fixed left-0 top-0 right-0 bottom-0 z-10'
            : 'rounded-2xl min-h-[280px] h-[481px] xl:h-full w-full md:w-[480px] xl:w-[740px] z-[0]'
        }`}
      >
        <div className="left-0 top-0 right-20 z-20 flex items-center justify-end gap-2 px-4 py-2">
          {!CHAIN_CONFIG.HIDE_ORDERBOOK && setShowOrderBook && (
            <button
              onClick={() => setShowOrderBook(true)}
              className="hidden xl:flex w-[200px] h-7 px-2.5 py-1.5 bg-blue-500/20 rounded-lg justify-center items-center gap-2"
            >
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
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-blue-400"
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
              <div className="text-center text-blue-400 text-[13px] font-medium">
                View OrderBook
              </div>
            </button>
          )}
          <div className="w-full mr-auto sm:ml-auto flex gap-3">
            <div className="flex flex-row gap-0.5 sm:gap-1">
              {SUPPORTED_INTERVALS.map(([key, label]) => (
                <button
                  key={key}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-xs md:text-sm ${
                    key === interval
                      ? 'bg-gray-700 text-white'
                      : 'bg-transparent text-gray-500 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                  onClick={() => setInterval(key as ResolutionString)}
                >
                  {label.toUpperCase()}
                </button>
              ))}
            </div>
            {totalSupply ? (
              <div className="flex items-center text-sm gap-0.5">
                <button
                  disabled={tab === 'price'}
                  onClick={() => setTab('price')}
                  className="disabled:text-blue-500"
                >
                  PRICE
                </button>
                <div>/</div>
                <button
                  disabled={tab === 'mcap'}
                  onClick={() => setTab('mcap')}
                  className="disabled:text-blue-500"
                >
                  MCAP
                </button>
              </div>
            ) : (
              <></>
            )}
            <button
              className="ml-auto p-0 pl-2 bg-transparent"
              onClick={() => setFullscreen((x) => !x)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="block w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] stroke-gray-500 hover:stroke-gray-200"
              >
                <path
                  d="M11 2H14V5"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
                <path
                  d="M10 6L13 3"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 14H2V11"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
                <path
                  d="M6 10L3 13"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <div
          className="flex flex-col flex-1 [&>iframe]:flex-1"
          ref={chartContainerRef}
        />
      </div>
    </>
  )
}
