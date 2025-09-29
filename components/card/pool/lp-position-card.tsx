import React, { useMemo } from 'react'
import { NextRouter } from 'next/router'

import { CurrencyIcon } from '../../icon/currency-icon'
import { formatUnits } from '../../../utils/bigint'
import { Chain } from '../../../model/chain'
import { LpWrapModal } from '../../modal/lp-wrap-modal'
import { PoolContractContext } from '../../../contexts/pool/pool-contract-context'
import { PoolSnapshot } from '../../../model/pool'
import { LpUnwrapModal } from '../../modal/lp-unwrap-modal'
import { handleCopyClipBoard } from '../../../utils/string'
import { shortAddress } from '../../../utils/address'
import { CopySvg } from '../../svg/copy-svg'
import { formatTinyNumber, formatWithCommas } from '../../../utils/bignumber'

export const LpPositionCard = ({
  chain,
  poolSnapshot,
  amount,
  isERC20,
  onWrap,
  onUnwrap,
  router,
  setIsCopyToast,
}: {
  chain: Chain
  poolSnapshot: PoolSnapshot
  amount: bigint
  isERC20: boolean
  router: NextRouter
  onWrap: PoolContractContext['wrap']
  onUnwrap: PoolContractContext['unwrap']
  setIsCopyToast: (isCopyToast: boolean) => void
}) => {
  const [showWrapOrUnwrapModal, setShowWrapOrUnwrapModal] =
    React.useState(false)
  const usdValue = useMemo(
    () =>
      Number(formatUnits(amount, poolSnapshot.lpCurrency.decimals)) *
      Number(poolSnapshot.lpPriceUSD),
    [amount, poolSnapshot.lpCurrency.decimals, poolSnapshot.lpPriceUSD],
  )

  return (
    usdValue > 0.01 && (
      <>
        {showWrapOrUnwrapModal &&
          (!isERC20 ? (
            <LpWrapModal
              chain={chain}
              lpBalance={amount}
              poolSnapshot={poolSnapshot}
              onClose={() => setShowWrapOrUnwrapModal(false)}
              onWrap={onWrap}
            />
          ) : (
            <LpUnwrapModal
              chain={chain}
              lpBalance={amount}
              poolSnapshot={poolSnapshot}
              onClose={() => setShowWrapOrUnwrapModal(false)}
              onUnwrap={onUnwrap}
            />
          ))}

        {/*pc*/}
        <div className="hidden lg:flex w-full flex-col">
          <div className="flex w-full px-5 py-3 bg-transparent justify-start items-center gap-4">
            <div className="flex w-[360px] max-w-[360px] overflow-x-scroll items-center gap-2">
              <div className="w-14 h-8 shrink-0 relative">
                <CurrencyIcon
                  chain={chain}
                  currency={poolSnapshot.currencyB}
                  className="w-8 h-8 absolute left-0 top-0 z-[1] rounded-full"
                />
                <CurrencyIcon
                  chain={chain}
                  currency={poolSnapshot.currencyA}
                  className="w-8 h-8 absolute left-6 top-0 rounded-full"
                />
              </div>
              <div className="flex flex-col text-white text-base font-semibold gap-0.5 text-nowrap overflow-hidden max-w-[300px]">
                <div className="flex flex-row gap-0.5 justify-start">
                  <div className="justify-start text-white text-base font-semibold">
                    {poolSnapshot.currencyB.symbol}
                  </div>
                  <div className="justify-start text-[#8d94a1] text-base font-semibold">
                    /
                  </div>
                  <div className="justify-start text-white text-base font-semibold">
                    {poolSnapshot.currencyA.symbol}
                    {isERC20 ? ' (ERC20)' : ''}
                  </div>
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    await handleCopyClipBoard(
                      isERC20
                        ? poolSnapshot.lpCurrency.address
                        : poolSnapshot.currencyB.address,
                    )
                    setIsCopyToast(true)
                  }}
                  className="text-[#8d94a1] text-[13px] font-medium flex flex-row gap-[3px] h-3.5 items-center"
                >
                  {shortAddress(
                    isERC20
                      ? poolSnapshot.lpCurrency.address
                      : poolSnapshot.currencyB.address,
                  )}
                  <CopySvg className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="w-[140px] text-white text-sm font-medium flex flex-row gap-2">
              {formatWithCommas(
                formatUnits(
                  amount,
                  poolSnapshot.lpCurrency.decimals,
                  Number(poolSnapshot.lpPriceUSD),
                ),
              )}
            </div>
            <div className="flex flex-row gap-1 w-[140px] text-white text-sm font-medium">
              <span className="text-[#8d94a1]">$</span>
              {formatTinyNumber(poolSnapshot.lpPriceUSD)}
            </div>
            <div className="flex flex-row gap-1 w-[140px] text-white text-sm font-medium">
              <span className="text-[#8d94a1]">$</span>
              {formatWithCommas(usdValue.toFixed(2))}
            </div>

            <div className="flex gap-4 ml-auto">
              <button
                onClick={() => setShowWrapOrUnwrapModal(true)}
                className="w-[180px] h-8 px-3 py-2 bg-[#367fff]/20 rounded-[10px] inline-flex justify-center items-center gap-1 flex-1 opacity-90 text-center text-blue-300 text-sm font-semibold leading-tight"
              >
                {isERC20 ? 'Unwrap' : 'Wrap'}
              </button>
              <button
                onClick={() => router.push(`/earn/${poolSnapshot.key}`)}
                className="w-[180px] h-8 px-3 py-2 bg-[#367fff]/20 rounded-[10px] inline-flex justify-center items-center gap-1 flex-1 opacity-90 text-center text-blue-300 text-sm font-semibold leading-tight"
              >
                Manage Position
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

        {/*mobile*/}
        <div className="flex lg:hidden w-full h-full p-4 bg-[#17181e] rounded-2xl flex-col justify-center items-start gap-4 outline outline-1 outline-offset-[-1px] outline-[#272930]">
          <div className="flex items-center gap-2 self-stretch">
            <div className="w-10 h-6 relative">
              <CurrencyIcon
                chain={chain}
                currency={poolSnapshot.currencyA}
                className="w-6 h-6 absolute left-0 top-0 z-[1] rounded-full"
              />
              <CurrencyIcon
                chain={chain}
                currency={poolSnapshot.currencyB}
                className="w-6 h-6 absolute left-[16px] top-0 rounded-full"
              />
            </div>

            <div className="flex flex-col justify-center items-start gap-0.5">
              <div className="flex justify-start items-center gap-0.5">
                <div className="justify-start text-white text-base font-semibold">
                  {poolSnapshot.currencyB.symbol}
                </div>
                <div className="justify-start text-[#8d94a1] text-base font-semibold">
                  /
                </div>
                <div className="justify-start text-white text-base font-semibold">
                  {poolSnapshot.currencyA.symbol}
                </div>
              </div>

              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  await handleCopyClipBoard(
                    isERC20
                      ? poolSnapshot.lpCurrency.address
                      : poolSnapshot.currencyB.address,
                  )
                  setIsCopyToast(true)
                }}
                className="flex justify-start items-center gap-[3px]"
              >
                <div className="justify-start text-[#8d94a1] text-xs font-medium">
                  {shortAddress(
                    isERC20
                      ? poolSnapshot.lpCurrency.address
                      : poolSnapshot.currencyB.address,
                  )}
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
                <div className="text-gray-500 text-xs">Balance</div>
              </div>
              <div className="self-stretch text-white text-sm font-medium">
                {formatWithCommas(
                  formatUnits(
                    amount,
                    poolSnapshot.lpCurrency.decimals,
                    Number(poolSnapshot.lpPriceUSD),
                  ),
                )}
              </div>
            </div>

            <div className="flex flex-1 w-full flex-col justify-center items-center gap-1.5">
              <div className="text-gray-500 text-xs">LP Price</div>
              <div className="flex flex-row gap-0.5 text-white text-sm font-medium">
                <span className="text-[#8d94a1]">$</span>
                {formatTinyNumber(poolSnapshot.lpPriceUSD)}
              </div>
            </div>

            <div className="flex flex-1 w-full flex-col justify-center items-end gap-1.5">
              <div className="text-gray-500 text-xs">USD Value</div>
              <div className="flex flex-row gap-0.5 text-white text-sm font-medium">
                <span className="text-[#8d94a1]">$</span>
                {formatWithCommas(usdValue.toFixed(2))}
              </div>
            </div>
          </div>

          <div className="self-stretch inline-flex justify-start items-center gap-2">
            <button
              onClick={() => setShowWrapOrUnwrapModal(true)}
              className="flex-1 h-8 px-3 py-2 bg-[#367fff]/20 rounded-[10px] flex justify-center items-center gap-1 opacity-90 text-center text-blue-300 text-[13px] font-semibold leading-tight"
            >
              {isERC20 ? 'Unwrap' : 'Wrap'}
            </button>
            <button
              onClick={() => router.push(`/earn/${poolSnapshot.key}`)}
              className="flex-1 h-8 px-3 py-2 bg-[#367fff]/20 rounded-[10px] flex justify-center items-center gap-1 opacity-90 text-center text-blue-300 text-[13px] font-semibold leading-tight"
            >
              Manage Position
            </button>
          </div>
        </div>
      </>
    )
  )
}
