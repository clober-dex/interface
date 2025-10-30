import React from 'react'
import { CHAIN_IDS, OpenOrder } from '@clober/v2-sdk'
import { NextRouter } from 'next/router'

import { OutlinkSvg } from '../../svg/outlink-svg'
import { ActionButton, ActionButtonProps } from '../../button/action-button'
import {
  formatSignificantString,
  formatWithCommas,
} from '../../../utils/bignumber'
import { formatTickPriceString } from '../../../utils/prices'

export const OpenOrderCard = ({
  chainId,
  openOrder,
  router,
  claimActionButtonProps,
  cancelActionButtonProps,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  chainId: CHAIN_IDS
  openOrder: OpenOrder
  router: NextRouter
  claimActionButtonProps: ActionButtonProps
  cancelActionButtonProps: ActionButtonProps
}) => {
  const filledRatio =
    (Number(openOrder.filled.value) / Number(openOrder.amount.value)) * 100
  return (
    <>
      <div
        className="relative flex xl:hidden flex-col shadow border border-solid border-gray-800 xl:w-[310px] bg-[#24272e]/50 xl:bg-gray-900 rounded-tr-xl rounded-br-xl rounded-tl-md rounded-bl-md px-4 py-3.5 xl:p-4 gap-4 xl:gap-[20px] outline outline-1 outline-offset-[-1px] outline-[#272930]"
        {...props}
      >
        {!openOrder.isBid ? (
          <div className="absolute left-0 top-0 h-full bg-red-400 w-0.5 rounded-l-xl" />
        ) : (
          <div className="absolute left-0 top-0 h-full bg-green-400 w-0.5 rounded-l-xl" />
        )}

        <div className="flex flex-col gap-[14px]">
          <div className="flex flex-row gap-2 text-sm text-white">
            <div className="font-semibold flex flex-row items-start gap-1">
              <span>{openOrder.inputCurrency.symbol}</span>{' '}
              <span className="text-gray-500">&#x2192;{'  '}</span>
              <span>{openOrder.outputCurrency.symbol}</span>
            </div>
            <button
              onClick={() =>
                router.push(
                  `/trade?inputCurrency=${openOrder.inputCurrency.address}&outputCurrency=${openOrder.outputCurrency.address}`,
                )
              }
            >
              <OutlinkSvg className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col text-xs sm:text-sm">
            <div className="flex flex-col align-baseline justify-between gap-2">
              <div className="flex flex-row align-baseline justify-between">
                <label className="text-gray-500 text-xs sm:text-sm font-medium">
                  Price
                </label>
                <p className="text-white text-xs sm:text-sm  font-medium">
                  {formatTickPriceString(
                    chainId,
                    BigInt(openOrder.tick),
                    openOrder.inputCurrency,
                    openOrder.outputCurrency,
                    openOrder.isBid,
                    undefined,
                    formatWithCommas,
                  )}
                </p>
              </div>
              <div className="flex flex-row align-baseline justify-between">
                <label className="text-gray-500 text-xs sm:text-sm  font-medium">
                  Amount
                </label>
                <p className="flex gap-1 text-white text-xs sm:text-sm  font-medium">
                  {formatWithCommas(
                    formatSignificantString(openOrder.amount.value),
                  )}{' '}
                  <span className="text-[#8690a5]">
                    {openOrder.amount.currency.symbol}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-row align-baseline justify-between">
                  <label className="text-gray-500 text-xs sm:text-sm  font-medium">
                    Filled
                  </label>
                  <div className="flex flex-row gap-1">
                    <p className="text-white text-xs sm:text-sm  font-medium">
                      {filledRatio.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-2xl">
                  <div
                    className="flex items-center justify-center bg-blue-500 text-gray-100 text-center p-0.5 leading-none w-full"
                    style={{
                      width: `${filledRatio}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-row align-baseline justify-between">
                <label className="text-gray-500 text-xs sm:text-sm  font-medium">
                  Claimable
                </label>
                <p className="flex gap-1 text-white text-xs sm:text-sm  font-medium">
                  {formatWithCommas(
                    formatSignificantString(openOrder.claimable.value),
                  )}{' '}
                  <span className="text-[#8690a5]">
                    {openOrder.claimable.currency.symbol}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full gap-3 h-full">
          <ActionButton
            className="flex flex-1 h-7 px-3 py-1.5 disabled:bg-[#2b3544] bg-blue-500/20 rounded-lg justify-center items-center disabled:text-gray-400 text-blue-500 text-[13px] font-semibold"
            {...claimActionButtonProps}
          />
          <ActionButton
            className="flex flex-1 h-7 px-3 py-1.5 disabled:bg-[#2b3544] bg-blue-500/20 rounded-lg justify-center items-center disabled:text-gray-400 text-blue-500 text-[13px] font-semibold"
            {...cancelActionButtonProps}
          />
        </div>
      </div>

      <div className="h-[58px] w-full relative hidden text-white xl:flex px-4 bg-transparent justify-start items-center gap-[3px]">
        {!openOrder.isBid ? (
          <div className="absolute left-0 h-full bg-red-400 w-0.5 pt-1 rounded-l-xl" />
        ) : (
          <div className="absolute left-0 h-full bg-green-400 w-0.5 pt-1 rounded-l-xl" />
        )}

        <div className="justify-start items-center gap-6 flex text-nowrap">
          <div className="flex flex-row gap-1.5 text-sm font-semibold">
            <div className="flex flex-row items-center gap-1.5 w-[200px] max-w-[200px] overflow-x-scroll text-white text-sm font-medium">
              {openOrder.inputCurrency.symbol}{' '}
              <p className="text-sm text-gray-500">&#x2192;</p>
              {'  '}
              {openOrder.outputCurrency.symbol}
              <button
                onClick={() =>
                  router.push(
                    `/trade?inputCurrency=${openOrder.inputCurrency.address}&outputCurrency=${openOrder.outputCurrency.address}`,
                  )
                }
              >
                <OutlinkSvg className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="w-[110px] h-full justify-start items-center flex text-white text-sm font-medium">
            {formatTickPriceString(
              chainId,
              BigInt(openOrder.tick),
              openOrder.inputCurrency,
              openOrder.outputCurrency,
              openOrder.isBid,
              undefined,
              formatWithCommas,
            )}
          </div>

          <div className="w-[180px] max-w-[180px] overflow-x-scroll h-full justify-start items-center flex text-white text-sm font-medium">
            <p className="flex gap-1 text-white">
              {formatWithCommas(
                formatSignificantString(openOrder.amount.value),
              )}{' '}
              <span className="text-[#8690a5]">
                {openOrder.amount.currency.symbol}
              </span>
            </p>
          </div>

          <div className="w-[80px] h-full justify-start items-center flex text-white text-sm font-medium flex-row gap-1">
            <p className="text-white">{filledRatio.toFixed(2)}%</p>
          </div>

          <div className="w-[180px] max-w-[180px] overflow-x-scroll h-full justify-start items-center flex text-white text-sm font-medium">
            <p className="flex gap-1 text-white">
              {formatWithCommas(
                formatSignificantString(openOrder.claimable.value),
              )}{' '}
              <span className="text-[#8690a5]">
                {openOrder.claimable.currency.symbol}
              </span>
            </p>
          </div>
        </div>

        <div className="flex ml-auto">
          <div className="h-full ml-auto justify-center items-center gap-3 flex">
            <ActionButton
              {...claimActionButtonProps}
              className="disabled:text-gray-400 disabled:bg-[#2b3544] w-[99px] h-8 px-3 py-2 bg-blue-400/25 rounded-[10px] inline-flex justify-center items-center gap-1 flex-1 opacity-90 text-center text-blue-300 text-sm font-semibold leading-tight"
            >
              Claim
            </ActionButton>
            <ActionButton
              {...cancelActionButtonProps}
              className="disabled:text-gray-400 disabled:bg-[#2b3544] w-[99px] h-8 px-3 py-2 bg-blue-400/25 rounded-[10px] inline-flex justify-center items-center gap-1 flex-1 opacity-90 text-center text-blue-300 text-sm font-semibold leading-tight"
            >
              Cancel
            </ActionButton>
          </div>
        </div>
      </div>

      <div className="hidden xl:flex xl:mx-5 xl:h-0.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1768"
          height="2"
          viewBox="0 0 1768 2"
          fill="none"
          strokeWidth="1"
        >
          <path d="M0 1H1768" stroke="#2D2D2E" />
        </svg>
      </div>
    </>
  )
}
