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
  marketCap,
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
  marketCap: number
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
        className={`transition-colors duration-500 py-3 px-5 ${flashState === 'green' ? 'bg-green-400/30' : flashState === 'red' ? 'bg-red-400/30' : 'bg-transparent'} hidden lg:flex max-w-[1200px] text-left px-5 py-0.5 justify-start items-center gap-4`}
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
          {marketCap > 0 ? (
            <div className="flex flex-row gap-1 w-[140px] text-white text-base font-semibold">
              <span className="justify-start text-[#8d94a1] text-sm font-medium">
                $
              </span>
              <span className="justify-start text-white text-sm font-medium">
                {formatAbbreviatedNumberString(new BigNumber(marketCap))}
              </span>
            </div>
          ) : (
            '-'
          )}
        </div>
        <div
          className={`w-[120px] ${dailyChange === 0 ? 'text-white' : dailyChange > 0 ? 'text-green-400' : 'text-red-400'} text-sm font-medium`}
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
        className={`transition-colors duration-500 ${flashState === 'green' ? 'bg-green-400/30' : flashState === 'red' ? 'bg-red-400/30' : 'bg-[#17181E]'} flex lg:hidden w-full h-[195px] p-4 rounded-2xl flex-col justify-center items-start gap-4 outline outline-1 outline-offset-[-1px] outline-[#272930]`}
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

        <div className="flex flex-col w-full gap-3.5">
          <div className="w-full flex flex-row flex-1 h-11 justify-start items-start gap-2 text-left">
            <div className="flex flex-1 w-full flex-col justify-start items-center gap-1.5">
              <div className="self-stretch text-gray-500 text-xs font-medium">
                Age
              </div>
              <div className="flex flex-row self-stretch text-white text-sm font-medium items-center gap-1 text-nowrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M6 9.33333L8 8V4.66667M2 8C2 8.78793 2.15519 9.56815 2.45672 10.2961C2.75825 11.0241 3.20021 11.6855 3.75736 12.2426C4.31451 12.7998 4.97595 13.2417 5.7039 13.5433C6.43185 13.8448 7.21207 14 8 14C8.78793 14 9.56815 13.8448 10.2961 13.5433C11.0241 13.2417 11.6855 12.7998 12.2426 12.2426C12.7998 11.6855 13.2417 11.0241 13.5433 10.2961C13.8448 9.56815 14 8.78793 14 8C14 7.21207 13.8448 6.43185 13.5433 5.7039C13.2417 4.97595 12.7998 4.31451 12.2426 3.75736C11.6855 3.20021 11.0241 2.75825 10.2961 2.45672C9.56815 2.15519 8.78793 2 8 2C7.21207 2 6.43185 2.15519 5.7039 2.45672C4.97595 2.75825 4.31451 3.20021 3.75736 3.75736C3.20021 4.31451 2.75825 4.97595 2.45672 5.7039C2.15519 6.43185 2 7.21207 2 8Z"
                    stroke="#6B7280"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {createAt > 0 ? convertShortTimeAgo(createAt * 1000) : '-'}
              </div>
            </div>
            <div className="flex flex-1 w-full flex-col justify-start items-center gap-1.5">
              <div className="self-stretch text-gray-500 text-xs font-medium">
                Price
              </div>
              <div className="self-stretch text-white text-sm font-medium flex flex-row gap-0.5">
                <div className="justify-start text-[#8d94a1] text-sm font-medium">
                  $
                </div>
                {formatTinyNumber(price)}
              </div>
            </div>
            <div className="flex flex-1 w-full flex-col justify-start items-center gap-1.5">
              <div className="flex w-full ml-auto self-stretch text-gray-500 text-xs font-medium text-nowrap gap-1">
                24h Volume
              </div>
              <div className="self-stretch text-white text-sm font-medium flex flex-row gap-0.5">
                <div className="justify-start text-[#8d94a1] text-sm font-medium">
                  $
                </div>
                {formatAbbreviatedNumberString(dailyVolume)}
              </div>
            </div>
          </div>

          <div className="w-full flex flex-row flex-1 h-11 justify-start items-start gap-2 text-left">
            <div className="flex flex-1 w-full flex-col justify-start items-center gap-1.5">
              <div className="self-stretch text-gray-500 text-xs font-medium">
                Market Cap
              </div>
              <div className="self-stretch text-white text-sm font-medium flex flex-row gap-0.5">
                {marketCap > 0 ? (
                  <>
                    <div className="justify-start text-[#8d94a1] text-sm font-medium">
                      $
                    </div>
                    {formatAbbreviatedNumberString(new BigNumber(marketCap))}
                  </>
                ) : (
                  '-'
                )}
              </div>
            </div>
            <div className="flex flex-1 w-full flex-col justify-start items-center gap-1.5">
              <div className="self-stretch text-gray-500 text-xs font-medium">
                24h Change
              </div>
              <div className="self-stretch text-white text-sm font-medium flex flex-row">
                <div
                  className={`${
                    dailyChange === 0
                      ? 'text-white'
                      : dailyChange > 0
                        ? 'text-green-400'
                        : 'text-red-400'
                  }`}
                >
                  {formatAbbreviatedNumberString(dailyChange.toFixed(2), 2)}%
                </div>
              </div>
            </div>
            <div className="flex flex-1 w-full flex-col justify-start items-center gap-1.5"></div>
          </div>
        </div>
      </button>
    </>
  )
}
