import React, { useState } from 'react'
import Link from 'next/link'
import BigNumber from 'bignumber.js'
import { isAddressEqual } from 'viem'
import { NextRouter } from 'next/router'

import { CurrencyIcon } from '../../icon/currency-icon'
import { shortAddress } from '../../../utils/address'
import { handleCopyClipBoard } from '../../../utils/string'
import { ClipboardSvg } from '../../svg/clipboard-svg'
import { Toast } from '../../toast'
import { ActionButton } from '../../button/action-button'
import { Chain } from '../../../model/chain'
import { WHITELISTED_FUTURES_ASSETS } from '../../../constants/futures'
import {
  formatAbbreviatedNumberString,
  formatTinyNumber,
} from '../../../utils/bignumber'
import { Currency } from '../../../model/currency'

export const MarketInfoCard = ({
  chain,
  router,
  baseCurrency,
  quoteCurrency,
  price,
  dollarValue,
  fdv,
  marketCap,
  dailyVolume,
  liquidityUsd,
  websiteUrl,
  twitterUrl,
  telegramUrl,
  isFetchingMarketSnapshot,
}: {
  chain: Chain
  router: NextRouter
  baseCurrency: Currency
  quoteCurrency: Currency
  price: number
  dollarValue: number
  fdv: number
  marketCap: number
  dailyVolume: number
  liquidityUsd: number
  websiteUrl: string
  twitterUrl: string
  telegramUrl: string
  isFetchingMarketSnapshot: boolean
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

      <div className="flex w-full h-full lg:h-[74px] lg:w-[740px] flex-col lg:flex-row justify-start items-start px-4 lg:px-0 lg:pl-5 lg:pr-4 lg:py-3 lg:bg-[#171b24] lg:rounded-2xl lg:justify-start lg:items-center gap-4">
        <div className="flex flex-row w-full lg:w-fit">
          <div className="justify-start items-center gap-2.5 flex w-full">
            <div className="justify-start items-center flex relative w-14">
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

            <div className="flex flex-col justify-center gap-0.5 lg:gap-1 w-[165px] lg:w-[180px] overflow-y-hidden">
              <div className="flex flex-row gap-2 w-full h-full justify-start items-center">
                <div className="text-white text-base lg:text-lg max-w-[180px] lg:max-w-[200px] font-semibold text-nowrap overflow-y-hidden">
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
                  className="cursor-pointer h-5 px-1.5 py-0.5 bg-gray-800 rounded-md justify-center items-center gap-0.5 flex"
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

                {twitterUrl.length > 0 ? (
                  <Link className="link" target="_blank" href={twitterUrl}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="w-4 h-4"
                    >
                      <path
                        d="M11.4492 3H13.1359L9.45099 7.23613L13.7859 13H10.3915L7.73299 9.50449L4.69067 13H3.00303L6.94428 8.4694L2.78589 3H6.26623L8.66927 6.19542L11.4492 3ZM10.857 11.9846H11.7919L5.75863 3.96229H4.75558L10.857 11.9846Z"
                        fill="#9CA3AF"
                      />
                    </svg>
                  </Link>
                ) : (
                  <></>
                )}

                {telegramUrl.length > 0 ? (
                  <Link className="link" target="_blank" href={telegramUrl}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.13072 7.30493C6.35194 5.8937 8.49993 4.96333 9.57468 4.51383C12.6433 3.23039 13.2809 3.00744 13.6965 3.00008C13.7879 2.99846 13.9923 3.02124 14.1247 3.12926C14.2365 3.22047 14.2673 3.34368 14.282 3.43016C14.2967 3.51664 14.315 3.71364 14.3005 3.86757C14.1342 5.6245 13.4146 9.8881 13.0486 11.8559C12.8937 12.6885 12.5887 12.9677 12.2934 12.995C11.6517 13.0544 11.1645 12.5686 10.543 12.159C9.57047 11.5179 9.02106 11.1189 8.07706 10.4933C6.9861 9.77042 7.69332 9.37309 8.31506 8.72375C8.47777 8.55381 11.305 5.96792 11.3597 5.73334C11.3666 5.704 11.3729 5.59464 11.3083 5.5369C11.2437 5.47915 11.1484 5.4989 11.0795 5.5146C10.982 5.53687 9.42839 6.56945 6.4187 8.61236C5.97772 8.91686 5.57828 9.06522 5.22041 9.05745C4.82587 9.04887 4.06695 8.83313 3.50277 8.64872C2.81078 8.42253 2.2608 8.30294 2.30869 7.91881C2.33364 7.71872 2.60765 7.5141 3.13072 7.30493Z"
                        fill="#9CA3AF"
                      />
                    </svg>
                  </Link>
                ) : (
                  <></>
                )}

                {websiteUrl.length > 0 ? (
                  <Link className="link" target="_blank" href={websiteUrl}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M2.86667 6.66667H13.1333M2.86667 10.3333H13.1333M7.69444 3C6.66493 4.64976 6.11913 6.55536 6.11913 8.5C6.11913 10.4446 6.66493 12.3502 7.69444 14M8.30556 3C9.33507 4.64976 9.88087 6.55536 9.88087 8.5C9.88087 10.4446 9.33507 12.3502 8.30556 14M2.5 8.5C2.5 9.22227 2.64226 9.93747 2.91866 10.6048C3.19506 11.272 3.60019 11.8784 4.11091 12.3891C4.62163 12.8998 5.22795 13.3049 5.89524 13.5813C6.56253 13.8577 7.27773 14 8 14C8.72227 14 9.43747 13.8577 10.1048 13.5813C10.772 13.3049 11.3784 12.8998 11.8891 12.3891C12.3998 11.8784 12.8049 11.272 13.0813 10.6048C13.3577 9.93747 13.5 9.22227 13.5 8.5C13.5 7.04131 12.9205 5.64236 11.8891 4.61091C10.8576 3.57946 9.45869 3 8 3C6.54131 3 5.14236 3.57946 4.11091 4.61091C3.07946 5.64236 2.5 7.04131 2.5 8.5Z"
                        stroke="#9CA3AF"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                ) : (
                  <></>
                )}

                {twitterUrl.length + telegramUrl.length + websiteUrl.length ===
                0 ? (
                  <>
                    {isAddressEqual(
                      baseCurrency.address,
                      '0x836047a99e11f376522b447bffb6e3495dd0637c',
                    ) && (
                      <ActionButton
                        disabled={false}
                        onClick={async () => {
                          window.open(
                            `https://testnet.orbiter.finance/en?src_chain=11155111&tgt_chain=10143&src_token=ETH`,
                            '_blank',
                          )
                        }}
                        text="Bridge"
                        className="disabled:text-gray-400 text-white text-xs font-semibold px-2 py-0.5 bg-blue-500 rounded justify-center items-center flex"
                      />
                    )}

                    {isAddressEqual(
                      baseCurrency.address,
                      '0xA296f47E8Ff895Ed7A092b4a9498bb13C46ac768',
                    ) && (
                      <ActionButton
                        disabled={false}
                        onClick={async () => {
                          window.open(`https://www.monadbridge.com/`, '_blank')
                        }}
                        text="Bridge"
                        className="disabled:text-gray-400 text-white text-xs font-semibold px-2 py-0.5 bg-blue-500 rounded justify-center items-center flex"
                      />
                    )}

                    {WHITELISTED_FUTURES_ASSETS.some(({ address }) =>
                      isAddressEqual(baseCurrency.address, address),
                    ) && (
                      <ActionButton
                        disabled={false}
                        onClick={() => {
                          router.push(`/futures/mint/${baseCurrency.address}`)
                        }}
                        text="Mint"
                        className="disabled:text-gray-400 text-white text-xs font-semibold px-2 py-0.5 bg-blue-500 rounded justify-center items-center flex"
                      />
                    )}
                  </>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>

          <div className="grow shrink basis-0 flex-col justify-center gap-1 flex ml-auto w-full lg:hidden text-right">
            <div className="text-[#39e79f] text-xl font-semibold">
              {formatTinyNumber(price)}
            </div>
            <div className="text-white text-xs">
              ${formatTinyNumber(dollarValue)}
            </div>
          </div>
        </div>

        <div className="h-full w-full justify-start items-center flex lg:hidden">
          <div className="h-full w-full flex-row justify-center items-start gap-8 flex">
            <div className="flex flex-col h-full w-full justify-center items-start gap-2">
              <div className="self-stretch justify-start items-center gap-2 flex">
                <div className="grow shrink basis-0 text-[#e1ebff]/50 text-xs font-semibold">
                  Liquidity
                </div>
                <div className="text-white text-xs font-semibold text-right">
                  {!isFetchingMarketSnapshot ? (
                    liquidityUsd > 0 ? (
                      `$${formatAbbreviatedNumberString(new BigNumber(liquidityUsd))}`
                    ) : (
                      '-'
                    )
                  ) : (
                    <div className="w-10 h-4 rounded animate-pulse bg-gray-500" />
                  )}
                </div>
              </div>
              <div className="self-stretch justify-start items-center gap-2 flex">
                <div className="grow shrink basis-0 text-[#e1ebff]/50 text-xs font-semibold">
                  24h Volume
                </div>
                <div className="text-white text-xs font-semibold text-right">
                  {!isFetchingMarketSnapshot ? (
                    dailyVolume > 0 ? (
                      `$${formatAbbreviatedNumberString(new BigNumber(dailyVolume))}`
                    ) : (
                      '-'
                    )
                  ) : (
                    <div className="w-10 h-4 rounded animate-pulse bg-gray-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col h-full w-full justify-center items-start gap-2">
              <div className="self-stretch justify-start items-center gap-2 flex">
                <div className="grow shrink basis-0 text-[#e1ebff]/50 text-xs font-semibold">
                  FDV
                </div>
                <div className="text-white text-xs font-semibold text-right">
                  {!isFetchingMarketSnapshot ? (
                    fdv > 0 ? (
                      `$${formatAbbreviatedNumberString(new BigNumber(fdv))}`
                    ) : (
                      '-'
                    )
                  ) : (
                    <div className="w-10 h-4 rounded animate-pulse bg-gray-500" />
                  )}
                </div>
              </div>
              <div className="self-stretch justify-start items-center gap-2 flex">
                <div className="grow shrink basis-0 text-[#e1ebff]/50 text-xs font-semibold">
                  Market Cap
                </div>
                <div className="text-white text-xs font-semibold text-right">
                  {!isFetchingMarketSnapshot ? (
                    marketCap > 0 ? (
                      `$${formatAbbreviatedNumberString(new BigNumber(marketCap))}`
                    ) : (
                      '-'
                    )
                  ) : (
                    <div className="w-10 h-4 rounded animate-pulse bg-gray-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex h-full ml-auto items-center gap-7">
          <div className="flex-col lg:items-end gap-0.5 flex w-[100px]">
            <div className="text-[#38e69f] text-[17px] font-bold">
              {formatTinyNumber(price)}
            </div>
            <div className="text-white text-xs font-bold">
              ${formatTinyNumber(dollarValue)}
            </div>
          </div>

          <div className="flex flex-row gap-4 ml-auto lg:w-[310px]">
            <div className="min-w-[60px] flex-1 flex-col justify-center items-start gap-1 flex">
              <div className="text-[#8690a5] text-xs whitespace-nowrap">
                Liquidity
              </div>
              <div className="w-[61px] text-white text-[13px] font-bold">
                {!isFetchingMarketSnapshot ? (
                  liquidityUsd > 0 ? (
                    `$${formatAbbreviatedNumberString(new BigNumber(liquidityUsd))}`
                  ) : (
                    '-'
                  )
                ) : (
                  <div className="w-[61px] h-[19px] rounded animate-pulse bg-gray-500" />
                )}
              </div>
            </div>

            <div className="min-w-[55px] flex-1 flex-col justify-center items-start gap-1 flex">
              <div className="text-[#8690a5] text-xs whitespace-nowrap">
                FDV
              </div>
              <div className="w-[61px] text-white text-[13px] font-bold">
                {!isFetchingMarketSnapshot ? (
                  fdv > 0 ? (
                    `$${formatAbbreviatedNumberString(new BigNumber(fdv))}`
                  ) : (
                    '-'
                  )
                ) : (
                  <div className="w-[61px] h-[19px] rounded animate-pulse bg-gray-500" />
                )}
              </div>
            </div>

            <div className="min-w-[70px] flex-1 flex-col justify-center items-start gap-1 flex">
              <div className="text-[#8690a5] text-xs whitespace-nowrap">
                Market Cap
              </div>
              <div className="w-[61px] text-white text-[13px] font-bold">
                {!isFetchingMarketSnapshot ? (
                  marketCap > 0 ? (
                    `$${formatAbbreviatedNumberString(new BigNumber(marketCap))}`
                  ) : (
                    '-'
                  )
                ) : (
                  <div className="w-[61px] h-[19px] rounded animate-pulse bg-gray-500" />
                )}
              </div>
            </div>

            <div className="min-w-[70px] flex-1 flex-col justify-center items-start gap-1 flex">
              <div className="text-[#8690a5] text-xs whitespace-nowrap">
                24H Volume
              </div>
              <div className="w-[61px] text-white text-[13px] font-bold">
                {!isFetchingMarketSnapshot ? (
                  dailyVolume > 0 ? (
                    `$${formatAbbreviatedNumberString(new BigNumber(dailyVolume))}`
                  ) : (
                    '-'
                  )
                ) : (
                  <div className="w-[61px] h-[19px] rounded animate-pulse bg-gray-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
