import React, { useState } from 'react'
import BigNumber from 'bignumber.js'

import { CurrencyIcon } from '../../icon/currency-icon'
import { shortAddress } from '../../../utils/address'
import { handleCopyClipBoard } from '../../../utils/string'
import { ClipboardSvg } from '../../svg/clipboard-svg'
import { Toast } from '../../toast'
import { Chain } from '../../../model/chain'
import {
  formatAbbreviatedNumberString,
  formatTinyNumber,
} from '../../../utils/bignumber'
import { Currency } from '../../../model/currency'

export const PoolInfoCard = ({
  chain,
  baseCurrency,
  quoteCurrency,
  apy,
  lpPriceUSD,
  dailyVolume,
  liquidityUsd,
}: {
  chain: Chain
  baseCurrency: Currency
  quoteCurrency: Currency
  apy: number
  lpPriceUSD: number
  dailyVolume: number
  liquidityUsd: number
}) => {
  const [isCopyToast, setIsCopyToast] = useState(false)
  return (
    <>
      <Toast
        isCopyToast={isCopyToast}
        setIsCopyToast={setIsCopyToast}
        durationInMs={1300}
      >
        <div className="w-[240px] items-center justify-center flex flex-row gap-1.5 text-white text-sm font-semibold">
          <ClipboardSvg />
          Address copied to clipboard
        </div>
      </Toast>

      <div className="flex w-full h-full lg:h-[74px] lg:w-fit flex-col lg:flex-row justify-start items-start px-5 lg:py-[18px] lg:bg-[#17181e] lg:rounded-2xl lg:justify-start lg:items-center gap-4 lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
        <div className="flex flex-row w-full lg:w-fit">
          <div className="justify-start items-center gap-2.5 flex w-full">
            <div className="justify-start items-center flex relative w-11 sm:w-14">
              <CurrencyIcon
                chain={chain}
                currency={baseCurrency}
                className="rounded-full w-6 lg:w-[30px] h-6 lg:h-[30px] z-[1]"
              />
              <CurrencyIcon
                chain={chain}
                currency={quoteCurrency}
                className="rounded-full absolute top-0 left-4 lg:left-[18px] w-6 lg:w-[30px] h-6 lg:h-[30px]"
              />
            </div>

            <div className="flex flex-col justify-center gap-0.5 lg:gap-1 w-[155px] lg:w-[170px] overflow-y-hidden">
              <div className="flex flex-row gap-2 w-full h-full justify-start items-center">
                <div className="text-white text-base lg:text-[16px] max-w-[180px] lg:max-w-[200px] font-semibold text-nowrap overflow-y-hidden">
                  <span>{baseCurrency.symbol} </span>
                  <span className="text-[#8690a5]">/</span>
                  <span> {quoteCurrency.symbol}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={async () => {
                    await handleCopyClipBoard(baseCurrency.address)
                    setIsCopyToast(true)
                  }}
                  className="cursor-pointer h-4 rounded-md justify-center items-center gap-0.5 flex"
                >
                  <div className="text-gray-400 text-xs leading-none">
                    {shortAddress(baseCurrency.address)}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2.006 8.3685C1.85267 8.28109 1.72514 8.15475 1.63629 8.00225C1.54744 7.84975 1.50043 7.67649 1.5 7.5V3.25C1.5 2 2.25 1.5 3.25 1.5L7.5 1.5C7.875 1.5 8.079 1.6925 8.25 2M3.5 4.8335C3.5 4.47983 3.64049 4.14065 3.89057 3.89057C4.14065 3.64049 4.47983 3.5 4.8335 3.5H9.1665C9.34162 3.5 9.51502 3.53449 9.67681 3.60151C9.8386 3.66852 9.9856 3.76675 10.1094 3.89057C10.2333 4.0144 10.3315 4.1614 10.3985 4.32319C10.4655 4.48498 10.5 4.65838 10.5 4.8335V9.1665C10.5 9.34162 10.4655 9.51502 10.3985 9.67681C10.3315 9.8386 10.2333 9.9856 10.1094 10.1094C9.9856 10.2333 9.8386 10.3315 9.67681 10.3985C9.51502 10.4655 9.34162 10.5 9.1665 10.5H4.8335C4.65838 10.5 4.48498 10.4655 4.32319 10.3985C4.1614 10.3315 4.0144 10.2333 3.89057 10.1094C3.76675 9.9856 3.66852 9.8386 3.60151 9.67681C3.53449 9.51502 3.5 9.34162 3.5 9.1665V4.8335Z"
                      stroke="#9CA3AF"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="grow shrink basis-0 flex-col justify-center gap-1 flex ml-auto w-full lg:hidden text-right">
            <div className="text-[#e1ebff]/50 text-xs font-semibold">APY</div>
            <div className="text-[#39e79f] text-xl font-semibold">
              {apy.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="h-full w-full justify-start items-center flex lg:hidden">
          <div className="h-full w-full flex-row justify-center items-start gap-8 flex">
            <div className="flex flex-col h-full w-full justify-center items-start gap-2">
              <div className="self-stretch justify-start items-center gap-2 flex">
                <div className="grow shrink basis-0 text-[#e1ebff]/50 text-xs font-semibold">
                  TVL
                </div>
                <div className="text-white text-xs text-right flex flex-row gap-1">
                  {liquidityUsd > 0 ? (
                    <>
                      <span className="text-[#8d94a1]">$</span>
                      {formatAbbreviatedNumberString(
                        new BigNumber(liquidityUsd),
                      )}
                    </>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col h-full w-full justify-center items-start gap-2">
              <div className="self-stretch justify-start items-center gap-2 flex">
                <div className="grow shrink basis-0 text-[#e1ebff]/50 text-xs font-semibold">
                  24h Volume
                </div>
                <div className="text-white text-xs text-right flex flex-row gap-1">
                  {dailyVolume > 0 ? (
                    <>
                      <span className="text-[#8d94a1]">$</span>
                      {formatAbbreviatedNumberString(
                        new BigNumber(dailyVolume),
                      )}
                    </>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex h-full items-center gap-7">
          <div className="flex-col lg:items-end gap-0.5 flex w-[100px] mt-1.5">
            <div className="text-[#8690a5] text-xs whitespace-nowrap">APY</div>
            <div className="text-green-400 font-semibold">
              {apy.toFixed(2)}%
            </div>
          </div>

          <div className="flex flex-row gap-4 ml-auto lg:w-fit">
            <div className="min-w-[55px] flex-1 flex-col justify-center items-start gap-1 flex h-[38px]">
              <div className="text-[#8690a5] text-xs whitespace-nowrap">
                LP Price
              </div>
              <div className="w-[61px] text-white text-sm font-medium h-4 flex flex-row gap-1">
                {lpPriceUSD > 0 ? (
                  <>
                    <span className="text-[#8d94a1]">$</span>
                    {formatAbbreviatedNumberString(new BigNumber(lpPriceUSD))}
                  </>
                ) : (
                  '-'
                )}
              </div>
            </div>

            <div className="min-w-[70px] flex-1 flex-col justify-center items-start gap-1 flex h-[38px]">
              <div className="text-[#8690a5] text-xs whitespace-nowrap">
                24H Volume
              </div>
              <div className="w-[61px] text-white text-sm font-medium h-4 flex flex-row gap-1">
                {dailyVolume > 0 ? (
                  <>
                    <span className="text-[#8d94a1]">$</span>
                    {formatAbbreviatedNumberString(new BigNumber(dailyVolume))}
                  </>
                ) : (
                  '-'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
