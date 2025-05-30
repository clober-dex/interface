import React from 'react'
import { NextRouter } from 'next/router'

import { CurrencyIcon } from '../../icon/currency-icon'
import { formatDollarValue, formatUnits } from '../../../utils/bigint'
import { Chain } from '../../../model/chain'
import { Currency } from '../../../model/currency'
import { formatWithCommas } from '../../../utils/bignumber'

export const LpPositionCard = ({
  chain,
  poolKey,
  currencyA,
  currencyB,
  currencyLp,
  lpPriceUSD,
  amount,
  router,
}: {
  chain: Chain
  poolKey: `0x${string}`
  currencyA: Currency
  currencyB: Currency
  currencyLp: Currency
  lpPriceUSD: number
  amount: bigint
  router: NextRouter
}) => {
  return (
    <>
      <div className="hidden lg:flex w-full h-[204px] p-6 bg-gray-800 rounded-2xl flex-col justify-center items-center gap-6">
        <div className="flex flex-col items-center gap-4 self-stretch">
          <div className="flex justify-center items-center gap-2 self-stretch">
            <div className="w-14 h-8 relative">
              <CurrencyIcon
                chain={chain}
                currency={currencyA}
                className="w-8 h-8 absolute left-0 top-0 z-[1] rounded-full"
              />
              <CurrencyIcon
                chain={chain}
                currency={currencyB}
                className="w-8 h-8 absolute left-6 top-0 rounded-full"
              />
            </div>
            <div className="flex gap-1 items-center">
              <div className="text-white text-base font-bold">
                {currencyA.symbol}
              </div>
              <div className="text-white text-base font-bold">-</div>
              <div className="text-white text-base font-bold">
                {currencyB.symbol}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <div className="text-gray-400 text-sm">LP in wallet</div>
            <div className="justify-center items-center gap-1 flex">
              <div className="text-right text-white text-base">
                {formatWithCommas(
                  formatUnits(amount, currencyLp.decimals, lpPriceUSD),
                )}
              </div>
              <div className="text-center text-gray-400 text-sm font-semibold">
                ({formatDollarValue(amount, currencyLp.decimals, lpPriceUSD)})
              </div>
            </div>
          </div>
        </div>
        <div className="flex self-stretch h-8 px-3 py-2 rounded-lg border-2 border-blue-500 border-solid justify-center items-center gap-1">
          <button
            onClick={() => router.push(`/earn/${poolKey}`)}
            className="grow shrink basis-0 opacity-90 text-center text-blue-500 text-sm font-bold"
          >
            Manage Position
          </button>
        </div>
      </div>
      <div className="flex lg:hidden w-full h-[164px] p-4 bg-gray-800 rounded-xl flex-col justify-center items-start gap-4">
        <div className="flex items-center gap-2 self-stretch">
          <div className="w-10 h-6 relative">
            <CurrencyIcon
              chain={chain}
              currency={currencyA}
              className="w-6 h-6 absolute left-0 top-0 z-[1]"
            />
            <CurrencyIcon
              chain={chain}
              currency={currencyB}
              className="w-6 h-6 absolute left-[16px] top-0"
            />
          </div>
          <div className="flex gap-1 items-center">
            <div className="text-white text-base font-bold">
              {currencyA.symbol}
            </div>
            <div className="text-white text-base font-bold">-</div>
            <div className="text-white text-base font-bold">
              {currencyB.symbol}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-start gap-2 h-11">
          <div className="self-stretch text-gray-400 text-xs font-medium">
            LP in wallet
          </div>
          <div className="justify-start items-center gap-2 flex">
            <div className="text-white text-sm font-bold">
              {formatWithCommas(
                formatUnits(amount, currencyLp.decimals, lpPriceUSD),
              )}
            </div>
            <div className="text-gray-400 text-xs font-semibold">
              ({formatDollarValue(amount, currencyLp.decimals, lpPriceUSD)})
            </div>
          </div>
        </div>
        <div className="flex self-stretch h-8 px-3 py-2 rounded-lg border border-solid border-blue-500 justify-center items-center gap-1">
          <button
            onClick={() => router.push(`/earn/${poolKey}`)}
            className="grow shrink basis-0 opacity-90 text-center text-blue-500 text-sm font-bold"
          >
            Manage Position
          </button>
        </div>
      </div>
    </>
  )
}
