import React from 'react'
import { NextRouter } from 'next/router'
import BigNumber from 'bignumber.js'
import { Tooltip } from 'react-tooltip'

import { CurrencyIcon } from '../../icon/currency-icon'
import { QuestionMarkSvg } from '../../svg/question-mark-svg'
import { Chain } from '../../../model/chain'
import { Currency } from '../../../model/currency'
import { formatWithCommas } from '../../../utils/bignumber'
import { handleCopyClipBoard } from '../../../utils/string'
import { shortAddress } from '../../../utils/address'
import { CopySvg } from '../../svg/copy-svg'

export const PoolSnapshotCard = ({
  chain,
  poolKey,
  currencyA,
  currencyB,
  apy,
  tvl,
  volume24h,
  router,
}: {
  chain: Chain
  poolKey: `0x${string}`
  currencyA: Currency
  currencyB: Currency
  apy: number
  tvl: number
  volume24h: number
  router: NextRouter
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
                // onClick={async (e) => {
                //   e.stopPropagation()
                //   await handleCopyClipBoard(baseCurrency.address)
                //   setIsCopyToast(true)
                // }}
                className="text-[#8d94a1] text-[13px] font-medium flex flex-row gap-[3px] h-3.5 items-center"
              >
                {shortAddress(currencyA.address)}
                <CopySvg className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="w-[140px] text-white text-sm font-medium flex flex-row gap-2">
            {`${!BigNumber(apy).isNaN() && !BigNumber(apy).isZero() && BigNumber(apy).lt(10000) ? `${apy.toFixed(2)}%` : '-'}`}
          </div>
          <div className="w-[140px] text-white text-sm font-medium">
            ${formatWithCommas(tvl.toFixed(0))}
          </div>
          <div className="w-[140px] text-white text-sm font-medium">
            ${formatWithCommas(volume24h.toFixed(0))}
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

      <div className="flex lg:hidden w-full h-[116px] p-4 bg-gray-800 rounded-xl flex-col justify-center items-start gap-4">
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
          <div className="flex gap-1 justify-start items-center">
            <div className="text-white text-sm font-medium">
              {currencyA.symbol}
            </div>
            <div className="text-white text-sm font-medium">-</div>
            <div className="text-white text-sm font-medium">
              {currencyB.symbol}
            </div>
          </div>
          <button
            onClick={() => router.push(`/earn/${poolKey}`)}
            className="flex ml-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M12.6665 7.99984L3.33317 7.99984M12.6665 7.99984L9.99984 5.33317M12.6665 7.99984L9.99984 10.6665"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="w-full flex flex-row flex-1 h-11 justify-start items-start gap-2">
          <div className="flex w-full flex-col justify-start items-center gap-2">
            <div className="flex gap-1 self-stretch text-gray-400 text-sm font-medium">
              APY
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
          <div className="flex w-full flex-col justify-start items-center gap-2">
            <div className="self-stretch text-center text-gray-400 text-xs">
              Total Liquidity
            </div>
            <div className="self-stretch text-center text-white text-sm font-medium">
              ${formatWithCommas(tvl.toFixed(0))}
            </div>
          </div>
          <div className="flex w-full flex-col justify-start items-center gap-2">
            <div className="self-stretch text-right text-gray-400 text-xs">
              24h Volume
            </div>
            <div className="self-stretch text-right text-white text-sm font-medium">
              ${formatWithCommas(volume24h.toFixed(0))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
