import React from 'react'
import BigNumber from 'bignumber.js'
import { Market } from '@clober/v2-sdk'
import { motion } from 'framer-motion'

import { formatSignificantString, formatWithCommas } from '../utils/bignumber'

import { Loading } from './loading'

const MAX_N = 18

export default function OrderBook({
  market,
  bids,
  asks,
  setDepthClickedIndex,
  setShowOrderBook,
  setTab,
  ...props
}: {
  market: Market | undefined
  bids: { price: string; size: string }[]
  asks: { price: string; size: string }[]
  setDepthClickedIndex: (index: { isBid: boolean; index: number }) => void
  setShowOrderBook: (showOrderBook: boolean) => void
  setTab: (tab: 'swap' | 'limit') => void
} & React.HTMLAttributes<HTMLDivElement>) {
  const biggestDepth = BigNumber.max(
    BigNumber.max(
      ...asks
        .sort((a, b) => new BigNumber(a.price).minus(b.price).toNumber())
        .slice(0, MAX_N)
        .map(({ size }) => size),
      0,
    ),
    BigNumber.max(
      ...bids
        .sort((a, b) => new BigNumber(b.price).minus(a.price).toNumber())
        .slice(0, MAX_N)
        .map(({ size }) => size),
      0,
    ),
  )

  return (
    <div {...props}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowOrderBook(false)}
          className="hidden xl:flex w-[140px] h-7 px-2.5 py-1.5 bg-blue-500/20 rounded-lg justify-center items-center gap-2"
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
          <div className="text-center text-blue-400 text-[13px] font-medium">
            View Chart
          </div>
        </button>
      </div>

      {/*mobile*/}
      <div className="flex xl:hidden text-xs overflow-hidden relative h-full">
        {market ? (
          <>
            <div className="flex flex-1 flex-col basis-0">
              <div className="flex justify-between text-gray-500 gap-4 sm:gap-12 px-2 mb-1 sm:mb-3">
                <div>Amount</div>
                <div>Price</div>
              </div>
              {bids
                .sort((a, b) =>
                  new BigNumber(b.price).minus(a.price).toNumber(),
                )
                .filter(({ size }) => parseInt(size).toString().length < 20)
                .slice(0, 100)
                .map(({ price, size }, index) => {
                  return (
                    <button
                      key={`bid-${index}`}
                      className="px-2 flex items-center justify-between shrink-0 relative tabular-nums"
                      onClick={() => {
                        setDepthClickedIndex({ isBid: true, index })
                        setTab('limit')
                      }}
                    >
                      <div className="text-gray-200">
                        {formatWithCommas(formatSignificantString(size))}
                      </div>
                      <div className="text-green-500">
                        {formatWithCommas(price)}
                      </div>
                      <motion.div
                        key={`bid-bar-${price}-${size}`}
                        className="absolute h-full right-0 bg-[#39e79f]/10"
                        initial={{ backgroundColor: '#39e79f40', scaleY: 1 }}
                        animate={{
                          width: `${new BigNumber(size)
                            .div(biggestDepth)
                            .multipliedBy(100)
                            .toNumber()}%`,
                          backgroundColor: ['#39e79f80', '#39e79f20'],
                          scaleY: [1, 1.05, 1],
                        }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                      />
                    </button>
                  )
                })}
            </div>
            <div className="flex flex-1 flex-col basis-0">
              <div className="flex justify-between text-gray-500 gap-4 sm:gap-12 px-2 mb-1 sm:mb-3">
                <div>Price</div>
                <div>Amount</div>
              </div>
              {asks
                .sort((a, b) =>
                  new BigNumber(a.price).minus(b.price).toNumber(),
                )
                .filter(({ size }) => parseInt(size).toString().length < 20)
                .slice(0, 100)
                .map(({ price, size }, index) => {
                  return (
                    <button
                      key={`ask-${index}`}
                      className="px-2 flex items-center justify-between shrink-0 relative tabular-nums"
                      onClick={() => {
                        setDepthClickedIndex({ isBid: false, index })
                        setTab('limit')
                      }}
                    >
                      <div className="text-red-500">
                        {formatWithCommas(price)}
                      </div>
                      <div className="text-gray-200">
                        {formatWithCommas(formatSignificantString(size))}
                      </div>
                      <motion.div
                        key={`ask-bar-${price}-${size}`}
                        className="absolute h-full left-0 bg-red-500/10"
                        initial={{ backgroundColor: '#ff000040', scaleY: 1 }}
                        animate={{
                          width: `${new BigNumber(size)
                            .div(biggestDepth)
                            .multipliedBy(100)
                            .toNumber()}%`,
                          backgroundColor: ['#ff000080', '#ff000020'],
                          scaleY: [1, 1.05, 1],
                        }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                      />
                    </button>
                  )
                })}
            </div>
          </>
        ) : (
          <Loading />
        )}
      </div>

      {/*pc*/}
      <div className="hidden xl:flex flex-col w-full h-full gap-[20px] text-[13px]">
        <div className="w-full h-4 justify-start items-center gap-6 flex">
          <div className="grow shrink basis-0 h-4 justify-end items-start gap-4 flex">
            <div className="flex-1 text-left text-gray-500 text-xs font-medium">
              Amount
            </div>
            <div className="flex-1 text-right text-gray-500 text-xs font-medium">
              Price
            </div>
          </div>
          <div className="grow shrink basis-0 h-4 justify-start items-start gap-4 flex">
            <div className="flex-1 text-left text-gray-500 text-xs font-medium">
              Price
            </div>
            <div className="flex-1 text-right text-gray-500 text-xs font-medium">
              Amount
            </div>
          </div>
        </div>

        <div className="flex flex-row h-full gap-0.5">
          {market ? (
            <>
              <div className="w-full h-full flex flex-1 flex-col basis-0 overflow-hidden">
                {bids
                  .sort((a, b) =>
                    new BigNumber(b.price).minus(a.price).toNumber(),
                  )
                  .slice(0, MAX_N)
                  .map(({ price, size }, index) => {
                    return (
                      <button
                        key={`bid-${index}`}
                        className="h-6 pr-3 py-1 flex items-center justify-between shrink-0 relative tabular-nums gap-4"
                        onClick={() => {
                          setDepthClickedIndex({ isBid: true, index })
                          setTab('limit')
                        }}
                      >
                        <div className="flex-1 text-left text-gray-200">
                          {formatWithCommas(formatSignificantString(size))}
                        </div>
                        <div className="text-right text-green-500">
                          {formatWithCommas(price)}
                        </div>
                        <motion.div
                          key={`bid-bar-${price}-${size}`}
                          className="absolute h-full right-0 bg-[#39e79f]/10"
                          initial={{ backgroundColor: '#39e79f40', scaleY: 1 }}
                          animate={{
                            width: `${new BigNumber(size)
                              .div(biggestDepth)
                              .multipliedBy(100)
                              .toNumber()}%`,
                            backgroundColor: ['#39e79f80', '#39e79f20'],
                            scaleY: [1, 1.05, 1],
                          }}
                          transition={{ duration: 0.6, ease: 'easeInOut' }}
                        />
                      </button>
                    )
                  })}
              </div>
              <div className="w-full h-full flex flex-1 flex-col basis-0 overflow-hidden">
                {asks
                  .sort((a, b) =>
                    new BigNumber(a.price).minus(b.price).toNumber(),
                  )
                  .slice(0, MAX_N)
                  .map(({ price, size }, index) => {
                    return (
                      <button
                        key={`ask-${index}`}
                        className="h-6 pl-3 py-1 flex items-center justify-between shrink-0 relative tabular-nums gap-4"
                        onClick={() => {
                          setDepthClickedIndex({ isBid: false, index })
                          setTab('limit')
                        }}
                      >
                        <div className="text-left text-red-500">
                          {formatWithCommas(price)}
                        </div>
                        <div className="flex-1 text-right text-gray-200">
                          {formatWithCommas(formatSignificantString(size))}
                        </div>
                        <motion.div
                          key={`ask-bar-${price}-${size}`}
                          className="absolute h-full left-0 bg-red-500/10"
                          initial={{ backgroundColor: '#ff000040', scaleY: 1 }}
                          animate={{
                            width: `${new BigNumber(size)
                              .div(biggestDepth)
                              .multipliedBy(100)
                              .toNumber()}%`,
                            backgroundColor: ['#ff000080', '#ff000020'],
                            scaleY: [1, 1.05, 1],
                          }}
                          transition={{ duration: 0.6, ease: 'easeInOut' }}
                        />
                      </button>
                    )
                  })}
              </div>
            </>
          ) : (
            <Loading />
          )}
        </div>
      </div>
    </div>
  )
}
