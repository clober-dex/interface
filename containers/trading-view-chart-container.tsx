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
  totalSupply,
}: {
  chainId: CHAIN_IDS
  baseCurrency: Currency
  quoteCurrency: Currency
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
    })

    tvWidget.onChartReady(() => {
      tvWidget.applyOverrides({
        'paneProperties.backgroundGradientStartColor': '#17181e',
        'paneProperties.backgroundGradientEndColor': '#17181e',
      })
    })

    return () => {
      tvWidget.remove()
    }
  }, [symbol, interval, chainId, totalSupply, tab, baseCurrency, quoteCurrency])

  return (
    <>
      {fullscreen && (
        <div className="flex flex-col rounded-2xl bg-[#171b24] overflow-hidden min-h-[280px] w-full md:w-[480px] lg:w-[740px] lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]" />
      )}
      <div
        className={`lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930] flex flex-col bg-[#171b24] overflow-hidden ${
          fullscreen
            ? 'w-full fixed left-0 top-0 right-0 bottom-0 z-10'
            : 'rounded-2xl min-h-[280px] h-[481px] lg:h-full w-full md:w-[480px] lg:w-[740px] z-[0]'
        }`}
      >
        <div className="left-0 top-0 right-20 z-20 flex items-center justify-end gap-2 px-4 py-2">
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
