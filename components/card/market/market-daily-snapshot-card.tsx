import React, { useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'
import { useRouter } from 'next/router'

import { CurrencyIcon } from '../../icon/currency-icon'
import { VerifiedSvg } from '../../svg/verified-svg'
import { convertShortTimeAgo } from '../../../utils/time'
import { Chain } from '../../../model/chain'
import {
  formatAbbreviatedNumberString,
  formatTinyNumber,
} from '../../../utils/bignumber'
import { Currency } from '../../../model/currency'
import { shortAddress } from '../../../utils/address'
import { CopySvg } from '../../svg/copy-svg'
import { handleCopyClipBoard } from '../../../utils/string'

export const MarketDailySnapshotCard = ({
  chain,
  baseCurrency,
  quoteCurrency,
  createAt,
  price,
  dailyVolume,
  fdv,
  dailyChange,
  verified,
  isBidTaken,
  isAskTaken,
  setIsCopyToast,
}: {
  chain: Chain
  baseCurrency: Currency
  quoteCurrency: Currency
  createAt: number
  price: number
  dailyVolume: number
  fdv: number
  dailyChange: number
  verified: boolean
  isBidTaken: boolean
  isAskTaken: boolean
  setIsCopyToast: (isCopyToast: boolean) => void
}) => {
  const [flashState, setFlashState] = useState<'green' | 'red' | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isBidTaken && isAskTaken) {
      setFlashState('green')
      const greenTimeout = setTimeout(() => {
        setFlashState('red')
        const redTimeout = setTimeout(() => {
          setFlashState(null)
        }, 500)
        return () => clearTimeout(redTimeout)
      }, 500)
      return () => clearTimeout(greenTimeout)
    } else if (isBidTaken) {
      setFlashState('red')
      const bidTimeout = setTimeout(() => setFlashState(null), 500)
      return () => clearTimeout(bidTimeout)
    } else if (isAskTaken) {
      setFlashState('green')
      const askTimeout = setTimeout(() => setFlashState(null), 500)
      return () => clearTimeout(askTimeout)
    }
  }, [isBidTaken, isAskTaken])

  return (
    <>
      {/*pc*/}
      <button
        onClick={() => {
          router.push(
            `/trade?inputCurrency=${baseCurrency.address}&outputCurrency=${quoteCurrency.address}`,
          )
        }}
        className={`transition-colors duration-500 py-3 px-5 ${flashState === 'green' ? 'bg-[#39e79f]/30' : flashState === 'red' ? 'bg-red-500/30' : 'bg-transparent'} hidden lg:flex max-w-[1200px] text-left px-5 py-0.5 justify-start items-center gap-4`}
      >
        <div className="flex w-[350px] items-center gap-3 h-[37px]">
          <div className="w-14 h-8 shrink-0 relative">
            <CurrencyIcon
              chain={chain}
              currency={baseCurrency}
              unoptimized={true}
              className="w-8 h-8 absolute left-0 top-0 z-[1] rounded-full"
            />
            <CurrencyIcon
              chain={chain}
              currency={quoteCurrency}
              unoptimized={true}
              className="w-8 h-8 absolute left-6 top-0 rounded-full"
            />
          </div>
          <div className="flex flex-col text-white text-base font-semibold gap-0.5 text-nowrap overflow-hidden max-w-[300px]">
            <div className="flex flex-row gap-0.5 justify-start">
              <div className="justify-start text-white text-base font-semibold">
                {baseCurrency.symbol}
              </div>
              <div className="justify-start text-[#8d94a1] text-base font-semibold">
                /
              </div>
              <div className="justify-start text-white text-base font-semibold">
                {quoteCurrency.symbol}
              </div>
            </div>
            <button
              onClick={async (e) => {
                e.stopPropagation()
                await handleCopyClipBoard(baseCurrency.address)
                setIsCopyToast(true)
              }}
              className="text-[#8d94a1] text-[13px] font-medium flex flex-row gap-[3px] h-3.5 items-center"
            >
              {shortAddress(baseCurrency.address)}
              <CopySvg className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="w-[160px] h-full text-white text-base font-semibold gap-1 flex flex-row items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="15"
            viewBox="0 0 14 15"
            fill="none"
          >
            <path
              d="M5 8.83333L7 7.5V4.16667M1 7.5C1 8.28793 1.15519 9.06815 1.45672 9.7961C1.75825 10.5241 2.20021 11.1855 2.75736 11.7426C3.31451 12.2998 3.97595 12.7417 4.7039 13.0433C5.43185 13.3448 6.21207 13.5 7 13.5C7.78793 13.5 8.56815 13.3448 9.2961 13.0433C10.0241 12.7417 10.6855 12.2998 11.2426 11.7426C11.7998 11.1855 12.2417 10.5241 12.5433 9.7961C12.8448 9.06815 13 8.28793 13 7.5C13 6.71207 12.8448 5.93185 12.5433 5.2039C12.2417 4.47595 11.7998 3.81451 11.2426 3.25736C10.6855 2.70021 10.0241 2.25825 9.2961 1.95672C8.56815 1.65519 7.78793 1.5 7 1.5C6.21207 1.5 5.43185 1.65519 4.7039 1.95672C3.97595 2.25825 3.31451 2.70021 2.75736 3.25736C2.20021 3.81451 1.75825 4.47595 1.45672 5.2039C1.15519 5.93185 1 6.71207 1 7.5Z"
              stroke="#8D94A1"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="justify-start text-white text-sm font-medium">
            {createAt > 0 ? convertShortTimeAgo(createAt * 1000) : '-'}
          </span>
        </div>
        <div className="flex flex-row gap-1 w-[140px] text-white text-base font-semibold">
          <span className="justify-start text-[#8d94a1] text-sm font-medium">
            $
          </span>
          <span className="justify-start text-white text-sm font-medium">
            {formatTinyNumber(price)}
          </span>
        </div>
        <div className="flex flex-row gap-1 w-[140px] text-white text-base font-semibold">
          <span className="justify-start text-[#8d94a1] text-sm font-medium">
            $
          </span>
          <span className="justify-start text-white text-sm font-medium">
            {formatAbbreviatedNumberString(dailyVolume)}
          </span>
        </div>
        <div className="flex flex-row gap-1 w-[140px] text-white text-base font-semibold">
          {fdv > 0 ? (
            <div className="flex flex-row gap-1 w-[140px] text-white text-base font-semibold">
              <span className="justify-start text-[#8d94a1] text-sm font-medium">
                $
              </span>
              <span className="justify-start text-white text-sm font-medium">
                {formatAbbreviatedNumberString(new BigNumber(fdv))}
              </span>
            </div>
          ) : (
            '-'
          )}
        </div>
        <div
          className={`w-[120px] ${dailyChange === 0 ? 'text-white' : dailyChange > 0 ? 'text-green-500' : 'text-red-500'} text-sm font-medium`}
        >
          {formatAbbreviatedNumberString(dailyChange.toFixed(2), 2)}%
        </div>
        <div className="w-[59px] flex h-full text-white text-base font-semibold items-center justify-center">
          {verified ? <VerifiedSvg /> : <></>}
        </div>
      </button>

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

      {/*tablet and mobile*/}
      <button
        onClick={() => {
          router.push(
            `/trade?inputCurrency=${baseCurrency.address}&outputCurrency=${quoteCurrency.address}`,
          )
        }}
        className={`transition-colors duration-500 ${flashState === 'green' ? 'bg-[#39e79f]/30' : flashState === 'red' ? 'bg-red-500/30' : 'bg-[#17181E]'} flex lg:hidden w-full h-[195px] p-4 rounded-2xl flex-col justify-center items-start gap-4 outline outline-1 outline-offset-[-1px] outline-[#272930]`}
      >
        <div className="flex w-full h-full">
          <div className="flex items-center gap-2.5 self-stretch">
            <div className="w-10 h-6 relative">
              <CurrencyIcon
                chain={chain}
                currency={baseCurrency}
                unoptimized={true}
                className="w-6 h-6 absolute left-0 top-0 z-[1] rounded-full"
              />
              <CurrencyIcon
                chain={chain}
                currency={quoteCurrency}
                unoptimized={true}
                className="w-6 h-6 absolute left-[16px] top-0 rounded-full"
              />
            </div>
            <div className="flex gap-0.5 justify-start items-center">
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-row gap-0.5">
                  <div className="justify-start text-white text-base font-semibold">
                    {baseCurrency.symbol}
                  </div>
                  <div className="justify-start text-[#8d94a1] text-base font-semibold">
                    /
                  </div>
                  <div className="justify-start text-white text-base font-semibold">
                    {quoteCurrency.symbol}
                  </div>
                </div>

                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    await handleCopyClipBoard(baseCurrency.address)
                    setIsCopyToast(true)
                  }}
                  className="flex h-3.5 justify-start text-[#8d94a1] text-xs font-medium items-center gap-[3px]"
                >
                  {shortAddress(baseCurrency.address)}
                  <CopySvg className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
          <div className="w-6 h-6 ml-auto items-center justify-center">
            {verified ? <VerifiedSvg /> : <></>}
          </div>
        </div>

        <div className="flex flex-col w-full gap-[12px]">
          <div className="w-full flex flex-row flex-1 h-11 justify-start items-start gap-2 text-left">
            <div className="flex flex-1 w-full flex-col justify-start items-center gap-1">
              <div className="self-stretch text-gray-400 text-xs">Age</div>
              <div className="flex flex-row self-stretch text-white text-sm font-semibold items-center gap-1 text-nowrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="mt-0.5"
                >
                  <path
                    d="M6.66667 10.5556L9 9V5.11111M2 9C2 9.91925 2.18106 10.8295 2.53284 11.6788C2.88463 12.5281 3.40024 13.2997 4.05025 13.9497C4.70026 14.5998 5.47194 15.1154 6.32122 15.4672C7.1705 15.8189 8.08075 16 9 16C9.91925 16 10.8295 15.8189 11.6788 15.4672C12.5281 15.1154 13.2997 14.5998 13.9497 13.9497C14.5998 13.2997 15.1154 12.5281 15.4672 11.6788C15.8189 10.8295 16 9.91925 16 9C16 8.08075 15.8189 7.1705 15.4672 6.32122C15.1154 5.47194 14.5998 4.70026 13.9497 4.05025C13.2997 3.40024 12.5281 2.88463 11.6788 2.53284C10.8295 2.18106 9.91925 2 9 2C8.08075 2 7.1705 2.18106 6.32122 2.53284C5.47194 2.88463 4.70026 3.40024 4.05025 4.05025C3.40024 4.70026 2.88463 5.47194 2.53284 6.32122C2.18106 7.1705 2 8.08075 2 9Z"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {createAt > 0 ? convertShortTimeAgo(createAt * 1000) : '-'}
              </div>
            </div>
            <div className="flex flex-1 w-full flex-col justify-start items-center gap-1">
              <div className="self-stretch text-gray-400 text-xs">Price</div>
              <div className="self-stretch text-white text-sm font-semibold">
                ${formatTinyNumber(price)}
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-start items-center gap-2">
              <div className="flex w-full ml-auto self-stretch text-gray-400 text-xs text-nowrap gap-1">
                24h Volume
              </div>
              <div className="self-stretch text-white text-sm font-semibold">
                ${formatAbbreviatedNumberString(dailyVolume)}
              </div>
            </div>
          </div>

          <div className="w-full flex flex-row flex-1 h-11 justify-start items-start gap-2 text-left">
            <div className="flex w-full flex-col justify-start items-center gap-2">
              <div className="self-stretch text-gray-400 text-xs">FDV</div>
              <div className="flex flex-row self-stretch text-white text-sm font-semibold items-center gap-1">
                {fdv > 0
                  ? `$${formatAbbreviatedNumberString(new BigNumber(fdv))}`
                  : '-'}
              </div>
            </div>
            <div className="flex w-full flex-col justify-start items-center gap-2">
              <div className="self-stretch text-gray-400 text-xs">
                24h Change
              </div>
              <div className="self-stretch text-white text-sm font-semibold">
                <div
                  className={`${
                    dailyChange === 0
                      ? 'text-white'
                      : dailyChange > 0
                        ? 'text-green-500'
                        : 'text-red-500'
                  }`}
                >
                  {formatAbbreviatedNumberString(dailyChange.toFixed(2), 2)}%
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col justify-start items-center gap-2"></div>
          </div>
        </div>
      </button>
    </>
  )
}
