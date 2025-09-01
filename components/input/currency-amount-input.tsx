import React, { useCallback, useMemo } from 'react'
import { parseUnits } from 'viem'

import { Currency } from '../../model/currency'
import { TriangleDownSvg } from '../svg/triangle-down-svg'
import { CurrencyIcon } from '../icon/currency-icon'
import { formatDollarValue, formatUnits } from '../../utils/bigint'
import {
  formatSignificantString,
  formatWithCommas,
} from '../../utils/bignumber'
import { Chain } from '../../model/chain'

import NumberInput from './number-input'

const CurrencyAmountInput = ({
  chain,
  currency,
  value,
  onValueChange,
  availableAmount,
  price,
  onCurrencyClick,
  children,
  ...props
}: {
  chain: Chain
  currency?: Currency
  value: string
  onValueChange: (value: string) => void
  availableAmount: bigint
  price?: number
  onCurrencyClick?: () => void
} & React.PropsWithChildren<{
  children?: React.ReactNode
}> &
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >) => {
  const decimals = useMemo(() => currency?.decimals ?? 18, [currency])

  const onMaxClick = useCallback(() => {
    onValueChange(
      availableAmount
        ? formatUnits(availableAmount, currency?.decimals ?? 18)
        : '',
    )
  }, [availableAmount, currency?.decimals, onValueChange])

  return (
    <div className="h-[77px] sm:h-[98px] w-full group hover:ring-1 hover:ring-gray-700 flex flex-col bg-[#24272e] rounded-xl outline outline-1 outline-offset-[-1px] outline-[#39393b] gap-2 pl-4 pr-3 py-3 sm:pl-4 sm:pr-5 sm:py-4">
      <div className="flex flex-1 justify-between gap-2">
        <NumberInput
          className="flex-1 text-xl w-full sm:text-3xl bg-transparent placeholder-gray-500 text-white outline-none"
          value={value}
          onValueChange={onValueChange}
          placeholder="0.0000"
          {...props}
        />
        {onCurrencyClick ? (
          currency ? (
            <button
              className="flex h-7 sm:h-8 w-fit items-center rounded-full bg-gray-700 py-1 pl-2 pr-3 gap-2"
              onClick={onCurrencyClick}
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 relative">
                <CurrencyIcon chain={chain} currency={currency} />
              </div>
              <div className="text-sm sm:text-base text-white">
                {currency.symbol}
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <g opacity="0.5">
                  <path
                    d="M3.5 5.25L7 8.75L10.5 5.25"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </button>
          ) : (
            <button
              className="h-8 flex items-center rounded-full bg-blue-500 text-white font-semibold pl-3 pr-2 py-1 gap-2 text-sm"
              onClick={onCurrencyClick}
            >
              Select token <TriangleDownSvg className="fill-gray-950" />
            </button>
          )
        ) : currency ? (
          <div className="flex h-7 sm:h-8 w-fit items-center rounded-full bg-gray-700 py-1 pl-2 pr-3 gap-2">
            <div className="w-5 h-5 relative">
              <CurrencyIcon chain={chain} currency={currency} />
            </div>
            <div className="text-sm sm:text-base text-white">
              {currency.symbol}
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
      <div className="flex items-end justify-between">
        {price ? (
          <div className="flex flex-row gap-0.5 sm:gap-1">
            <div className="text-gray-500 text-xs sm:text-sm">
              ~{formatDollarValue(parseUnits(value, decimals), decimals, price)}
            </div>
            <div>{children}</div>
          </div>
        ) : (
          <div></div>
        )}
        <div className="h-full flex items-center">
          {!props.disabled && currency ? (
            <div className="flex items-center text-xs sm:text-sm gap-1 sm:gap-2">
              <div className="text-gray-500">Available</div>
              <div className="text-white">
                {formatWithCommas(
                  formatSignificantString(
                    formatUnits(availableAmount, currency.decimals, price),
                  ),
                )}
              </div>
              <button
                className="h-[19px] sm:h-6 px-1.5 sm:px-2 py-1 sm:py-[5px] bg-blue-500/25 rounded-xl justify-center items-center gap-2.5 flex text-center text-blue-500 text-[11px] sm:text-xs"
                onClick={onMaxClick}
              >
                MAX
              </button>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  )
}

export default CurrencyAmountInput
