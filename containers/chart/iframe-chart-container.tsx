import React, { useState } from 'react'

import { Currency } from '../../model/currency'

export const IframeChartContainer = ({
  setShowOrderBook,
  baseCurrency,
  chainName,
}: {
  setShowOrderBook: (showOrderBook: boolean) => void
  baseCurrency: Currency
  chainName: string
}) => {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
      {fullscreen && (
        <div className="flex flex-col rounded-2xl bg-[#17181e] overflow-hidden min-h-[280px] w-full md:w-[480px] lg:w-[740px]" />
      )}
      <div
        className={`flex flex-col bg-[#17181e] overflow-hidden ${
          fullscreen
            ? 'w-full fixed left-0 top-0 right-0 bottom-0 z-10'
            : 'rounded-2xl min-h-[280px] h-[500px] xl:h-full w-full md:w-[480px] xl:w-[740px] z-[0]'
        }`}
      >
        <div className="left-0 top-0 right-20 z-20 flex items-center justify-end gap-2 px-4 py-2">
          <button
            onClick={() => setShowOrderBook(true)}
            className="flex w-[200px] h-7 px-2.5 py-1.5 bg-blue-500/20 rounded-lg justify-center items-center gap-2"
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
            <div className="text-center text-blue-400 text-[13px]">
              <span className="hidden sm:flex">View OrderBook</span>
              <span className="flex sm:hidden">OrderBook</span>
            </div>
          </button>
          <div className="w-full mr-auto sm:ml-auto flex">
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
        <iframe
          width="100%"
          height="100%"
          src={`https://birdeye.so/tv-widget/${baseCurrency.address}?chain=${chainName}&viewMode=pair&chartInterval=15&chartType=Candle&chartLeftToolbar=show&theme=dark`}
          frameBorder="0"
          // allowfullscreen
        />
      </div>
    </>
  )
}
