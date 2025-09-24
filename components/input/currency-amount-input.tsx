import React, { useCallback, useMemo } from 'react'
import { parseUnits } from 'viem'

import { Currency } from '../../model/currency'
import { TriangleDownSvg } from '../svg/triangle-down-svg'
import { CurrencyIcon } from '../icon/currency-icon'
import { formatDollarValue, formatUnits } from '../../utils/bigint'
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
    <div className="text-nowrap h-[77px] sm:h-[92px] w-full group hover:ring-1 hover:ring-gray-700 flex flex-col bg-[#24272e] rounded-xl outline outline-1 outline-offset-[-1px] outline-[#39393b] gap-2 pl-4 pr-3 py-3 sm:pl-4 sm:pr-5 sm:py-4">
      <div className="flex flex-row justify-start items-start gap-1.5 w-full">
        {onCurrencyClick ? (
          currency ? (
            <button
              className="h-full pl-1.5 pr-2 py-1 bg-[#3d3e40] rounded-[30.64px] flex justify-start items-center gap-1.5"
              onClick={onCurrencyClick}
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 relative">
                <CurrencyIcon chain={chain} currency={currency} />
              </div>
              <div className="text-white text-sm font-medium">
                {currency.symbol}
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="#8D94A1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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
          <div className="h-full pl-1.5 pr-2 py-1 bg-[#3d3e40] rounded-[30.64px] flex justify-start items-center gap-1.5">
            <div className="w-5 h-5 relative">
              <CurrencyIcon chain={chain} currency={currency} />
            </div>
            <div className="text-white text-sm font-medium">
              {currency.symbol}
            </div>
          </div>
        ) : (
          <></>
        )}

        <NumberInput
          className="text-xl w-full sm:text-[28px] font-medium bg-transparent placeholder-gray-500 text-white outline-none text-right"
          value={value}
          onValueChange={onValueChange}
          placeholder="0.0000"
          {...props}
        />
      </div>

      <div className="flex flex-row items-center gap-2.5 w-full">
        <div className="h-full flex items-center">
          {!props.disabled && currency ? (
            <div className="flex items-center text-xs sm:text-sm gap-1 sm:gap-2">
              <div className="text-[#7b8394] text-[13px] font-medium">
                Available:
              </div>
              <div className="text-white text-[13px] font-medium">
                {formatUnits(availableAmount, decimals, price)}
              </div>
              <button
                className="px-1.5 py-[1px] bg-[#367fff]/25 rounded-xl inline-flex justify-center items-center text-center text-[#86c0ff] text-[11px] font-medium"
                onClick={onMaxClick}
              >
                MAX
              </button>
            </div>
          ) : (
            <></>
          )}
        </div>

        <div className="flex w-full justify-end text-gray-400 text-[13px] font-medium">
          {price ? (
            <div className="flex flex-row gap-0.5 sm:gap-1">
              ~{formatDollarValue(parseUnits(value, decimals), decimals, price)}
              <div>{children}</div>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CurrencyAmountInput
