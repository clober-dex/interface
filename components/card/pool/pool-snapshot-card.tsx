import React from 'react'
import { NextRouter } from 'next/router'
import BigNumber from 'bignumber.js'
import { Tooltip } from 'react-tooltip'

import { CurrencyIcon } from '../../icon/currency-icon'
import { QuestionMarkSvg } from '../../svg/question-mark-svg'
import { Chain } from '../../../model/chain'
import { Currency } from '../../../model/currency'
import { formatWithCommas } from '../../../utils/bignumber'
import { shortAddress } from '../../../utils/address'
import { CopySvg } from '../../svg/copy-svg'
import { handleCopyClipBoard } from '../../../utils/string'

export const PoolSnapshotCard = ({
  chain,
  poolKey,
  currencyA,
  currencyB,
  apy,
  tvl,
  volume24h,
  router,
  setIsCopyToast,
}: {
  chain: Chain
  poolKey: `0x${string}`
  currencyA: Currency
  currencyB: Currency
  apy: number
  tvl: number
  volume24h: number
  router: NextRouter
  setIsCopyToast: (isCopyToast: boolean) => void
}) => {
  return (
    <>
      <div className="hidden lg:flex w-full flex-col">
        <div className="flex w-full px-5 py-3 bg-transparent justify-start items-center gap-4">
          <div className="flex w-[360px] max-w-[360px] overflow-x-scroll items-center gap-2">
            <div className="w-14 h-8 shrink-0 relative">
              <CurrencyIcon
                chain={chain}
                currency={currencyB}
                className="w-8 h-8 absolute left-0 top-0 z-[1] rounded-full"
              />
              <CurrencyIcon
                chain={chain}
                currency={currencyA}
                className="w-8 h-8 absolute left-6 top-0 rounded-full"
              />
            </div>
            <div className="flex flex-col text-white text-base font-semibold gap-0.5 text-nowrap overflow-hidden max-w-[300px]">
              <div className="flex flex-row gap-0.5 justify-start">
                <div className="justify-start text-white text-base font-semibold">
                  {currencyB.symbol}
                </div>
                <div className="justify-start text-[#8d94a1] text-base font-semibold">
                  /
                </div>
                <div className="justify-start text-white text-base font-semibold">
                  {currencyA.symbol}
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  await handleCopyClipBoard(currencyB.address)
                  setIsCopyToast(true)
                }}
                className="text-[#8d94a1] text-[13px] font-medium flex flex-row gap-[3px] h-3.5 items-center"
              >
                {shortAddress(currencyB.address)}
                <CopySvg className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="w-[140px] text-white text-sm font-medium flex flex-row gap-2">
            {`${!BigNumber(apy).isNaN() && !BigNumber(apy).isZero() && BigNumber(apy).lt(10000) ? `${apy.toFixed(2)}%` : '-'}`}
          </div>
          <div className="flex flex-row gap-1 w-[140px] text-white text-sm font-medium">
            <span className="text-[#8d94a1]">$</span>
            {formatWithCommas(tvl.toFixed(0))}
          </div>
          <div className="flex flex-row gap-1 w-[140px] text-white text-sm font-medium">
            <span className="text-[#8d94a1]">$</span>
            {formatWithCommas(volume24h.toFixed(0))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() =>
                router.push(
                  `/trade?inputCurrency=${currencyA.address}&outputCurrency=${currencyB.address}`,
                )
              }
              className="w-[180px] h-8 px-3 py-2 bg-[#367fff]/20 rounded-[10px] inline-flex justify-center items-center gap-1 flex-1 opacity-90 text-center text-[#86c0ff] text-sm font-semibold leading-tight"
            >
              Trade
            </button>
            <button
              onClick={() => router.push(`/earn/${poolKey}`)}
              className="w-[180px] h-8 px-3 py-2 bg-[#367fff]/20 rounded-[10px] inline-flex justify-center items-center gap-1 flex-1 opacity-90 text-center text-[#86c0ff] text-sm font-semibold leading-tight"
            >
              Add Liquidity
            </button>
          </div>
        </div>

        <div className="hidden lg:flex lg:mx-5 lg:h-0.5">
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
      </div>

      <div className="flex lg:hidden w-full h-full p-4 bg-[#17181e] rounded-2xl flex-col justify-center items-start gap-4 outline outline-1 outline-offset-[-1px] outline-[#272930]">
        <div className="flex items-center gap-2 self-stretch">
          <div className="w-10 h-6 relative">
            <CurrencyIcon
              chain={chain}
              currency={currencyA}
              className="w-6 h-6 absolute left-0 top-0 z-[1] rounded-full"
            />
            <CurrencyIcon
              chain={chain}
              currency={currencyB}
              className="w-6 h-6 absolute left-[16px] top-0 rounded-full"
            />
          </div>

          <div className="flex flex-col justify-center items-start gap-0.5">
            <div className="flex justify-start items-center gap-0.5">
              <div className="justify-start text-white text-base font-semibold">
                {currencyB.symbol}
              </div>
              <div className="justify-start text-[#8d94a1] text-base font-semibold">
                /
              </div>
              <div className="justify-start text-white text-base font-semibold">
                {currencyA.symbol}
              </div>
            </div>

            <button
              onClick={async (e) => {
                e.stopPropagation()
                await handleCopyClipBoard(currencyB.address)
                setIsCopyToast(true)
              }}
              className="flex justify-start items-center gap-[3px]"
            >
              <div className="justify-start text-[#8d94a1] text-xs font-medium">
                {shortAddress(currencyB.address)}
              </div>

              <div className="w-full h-full items-center justify-center p-0.5 flex">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                >
                  <rect
                    x="3.28577"
                    y="3.28577"
                    width="5.71429"
                    height="5.71429"
                    rx="1"
                    stroke="#8D94A1"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.14286 6.71429H2C1.44772 6.71429 1 6.26657 1 5.71429V2C1 1.44772 1.44772 1 2 1H5.71428C6.26657 1 6.71429 1.44772 6.71429 2V2.14286"
                    stroke="#8D94A1"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
        <div className="w-full flex flex-row flex-1 h-11 justify-start items-start gap-2">
          <div className="flex flex-1 w-full flex-col justify-center items-start gap-1.5">
            <div className="flex gap-1 self-stretch text-gray-500 text-sm font-medium">
              <div className="text-gray-500 text-xs">APY</div>
              <div className="flex justify-center items-center">
                <QuestionMarkSvg
                  data-tooltip-id="apy-info"
                  data-tooltip-place="bottom-end"
                  data-tooltip-html={'Annualized Return'}
                  className="w-3 h-3"
                />
                <Tooltip
                  id="apy-info"
                  className="max-w-[300px] bg-gray-950 !opacity-100 z-[100]"
                  clickable
                />
              </div>
            </div>
            <div className="self-stretch text-white text-sm font-medium">
              {`${!BigNumber(apy).isNaN() && !BigNumber(apy).isZero() && BigNumber(apy).lt(10000) ? `${apy.toFixed(2)}%` : '-'}`}
            </div>
          </div>

          <div className="flex flex-1 w-full flex-col justify-center items-center gap-1.5">
            <div className="text-gray-500 text-xs">Total Liquidity</div>
            <div className="flex flex-row gap-0.5 text-white text-sm font-medium">
              <span className="text-[#8d94a1]">$</span>
              {formatWithCommas(tvl.toFixed(0))}
            </div>
          </div>

          <div className="flex flex-1 w-full flex-col justify-center items-end gap-1.5">
            <div className="text-gray-500 text-xs">24h Volume</div>
            <div className="flex flex-row gap-0.5 text-white text-sm font-medium">
              <span className="text-[#8d94a1]">$</span>
              {formatWithCommas(volume24h.toFixed(0))}
            </div>
          </div>
        </div>

        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <button
            onClick={() =>
              router.push(
                `/trade?inputCurrency=${currencyA.address}&outputCurrency=${currencyB.address}`,
              )
            }
            className="flex-1 h-8 px-3 py-2 bg-[#367fff]/20 rounded-[10px] flex justify-center items-center gap-1 opacity-90 text-center text-[#86c0ff] text-[13px] font-semibold leading-tight"
          >
            Trade
          </button>
          <button
            onClick={() => router.push(`/earn/${poolKey}`)}
            className="flex-1 h-8 px-3 py-2 bg-[#367fff]/20 rounded-[10px] flex justify-center items-center gap-1 opacity-90 text-center text-[#86c0ff] text-[13px] font-semibold leading-tight"
          >
            Add Liquidity
          </button>
        </div>
      </div>
    </>
  )
}
