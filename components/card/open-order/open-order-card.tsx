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
        className="flex lg:hidden flex-col shadow border border-solid border-gray-800 lg:w-[310px] bg-gray-900 rounded-2xl p-4 gap-[20px]"
        {...props}
      >
        <div className="flex flex-col gap-[14px]">
          <div className="flex text-sm text-white justify-between">
            <div className="font-bold flex flex-row items-center gap-2">
              {openOrder.inputCurrency.symbol} &#x2192;{'  '}
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
            <div
              className={`${
                openOrder.isBid ? 'text-green-500' : 'text-red-500'
              } text-sm font-bold`}
            >
              {openOrder.isBid ? 'Bid' : 'Ask'}
            </div>
          </div>
          <div className="flex flex-col text-xs sm:text-sm">
            <div className="flex flex-col align-baseline justify-between gap-3">
              <div className="flex flex-row align-baseline justify-between">
                <label className="text-gray-500">Price</label>
                <p className="text-white">
                  {formatTickPriceString(
                    chainId,
                    BigInt(openOrder.tick),
                    openOrder.inputCurrency,
                    openOrder.outputCurrency,
                    openOrder.isBid,
                  )}
                </p>
              </div>
              <div className="flex flex-row align-baseline justify-between">
                <label className="text-gray-500">Amount</label>
                <p className="flex gap-1 text-white">
                  {formatWithCommas(
                    formatSignificantString(openOrder.amount.value),
                  )}{' '}
                  <span className="text-[#8690a5]">
                    {openOrder.amount.currency.symbol}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-row align-baseline justify-between">
                  <label className="text-gray-500">Filled</label>
                  <div className="flex flex-row gap-1">
                    <p className="text-white">{filledRatio.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-lg dark:bg-gray-700">
                  <div
                    className="flex items-center justify-center h-1.5 bg-blue-500 text-gray-100 text-center p-0.5 leading-none rounded-lg"
                    style={{
                      width: `${filledRatio}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-row align-baseline justify-between">
                <label className="text-gray-500">Claimable</label>
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
          </div>
        </div>
        <div className="flex w-full gap-3 h-6">
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

      <div className="w-full relative hidden text-white lg:flex h-14 pl-5 pr-2 bg-[#171b24] rounded-xl justify-start items-center gap-[3px]">
        {!openOrder.isBid ? (
          <div className="absolute left-0 h-full bg-red-500 w-1 rounded-l-3xl" />
        ) : (
          <div className="absolute left-0 h-full bg-green-500 w-1 rounded-l-3xl" />
        )}

        <div className="justify-start items-center gap-6 flex text-nowrap">
          <div className="flex flex-row gap-1.5 text-sm font-semibold">
            <div className="flex flex-row items-center gap-1.5 w-[180px] max-w-[180px] overflow-x-scroll">
              {openOrder.inputCurrency.symbol}{' '}
              <p className="text-sm text-gray-500">&#x2192;</p>
              {'  '}
              {openOrder.outputCurrency.symbol}
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

          <div className="w-[120px] h-full justify-start items-center flex text-[#e6e7eb] text-sm font-medium">
            {formatWithCommas(
              formatTickPriceString(
                chainId,
                BigInt(openOrder.tick),
                openOrder.inputCurrency,
                openOrder.outputCurrency,
                openOrder.isBid,
              ),
            )}
          </div>

          <div className="w-[180px] max-w-[180px] overflow-x-scroll h-full justify-start items-center flex text-[#e6e7eb] text-sm font-medium">
            <p className="flex gap-1 text-white">
              {formatWithCommas(
                formatSignificantString(openOrder.amount.value),
              )}{' '}
              <span className="text-[#8690a5]">
                {openOrder.amount.currency.symbol}
              </span>
            </p>
          </div>

          <div className="w-[80px] h-full justify-start items-center flex text-[#e6e7eb] text-sm font-medium flex-row gap-1">
            <p className="text-white">{filledRatio.toFixed(2)}%</p>
          </div>

          <div className="w-[180px] max-w-[180px] overflow-x-scroll h-full justify-start items-center flex text-[#e6e7eb] text-sm font-medium">
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
              className="disabled:text-gray-400 text-white text-[13px] font-semibold w-[110px] h-8 px-3 py-1.5 disabled:bg-[#2b3544] bg-blue-500 rounded-[10px] justify-center items-center flex"
            >
              Claim
            </ActionButton>
            <ActionButton
              {...cancelActionButtonProps}
              className="disabled:text-gray-400 text-white text-[13px] font-semibold w-[110px] h-8 px-3 py-1.5 disabled:bg-[#2b3544] bg-blue-500 rounded-[10px] justify-center items-center flex"
            >
              Cancel
            </ActionButton>
          </div>
        </div>
      </div>
    </>
  )
}
