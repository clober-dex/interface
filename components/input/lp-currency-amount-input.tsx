import React, { useCallback, useMemo } from 'react'
import { parseUnits } from 'viem'

import { Currency } from '../../model/currency'
import { TriangleDownSvg } from '../svg/triangle-down-svg'
import { formatDollarValue, formatUnits } from '../../utils/bigint'
import {
  formatSignificantString,
  formatWithCommas,
} from '../../utils/bignumber'
import { Chain } from '../../model/chain'
import { LpCurrencyIcon } from '../icon/lp-currency-icon'

import NumberInput from './number-input'

const LpCurrencyAmountInput = ({
  chain,
  currency,
  currency0,
  currency1,
  value,
  onValueChange,
  availableAmount,
  price,
  onCurrencyClick,
  ...props
}: {
  chain: Chain
  currency: Currency
  currency0: Currency
  currency1: Currency
  value: string
  onValueChange: (value: string) => void
  availableAmount: bigint
  price?: number
  onCurrencyClick?: () => void
} & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  const decimals = useMemo(() => currency?.decimals ?? 18, [currency])

  const onBlur = useCallback(() => {
    const amount = parseUnits(value, decimals)
    onValueChange(amount ? formatUnits(amount, decimals) : '')
  }, [decimals, onValueChange, value])

  const onMaxClick = useCallback(() => {
    onValueChange(
      availableAmount
        ? formatUnits(availableAmount, currency?.decimals ?? 18)
        : '',
    )
  }, [availableAmount, currency?.decimals, onValueChange])

  return (
    <div className="h-[77px] sm:h-[98px] w-full group hover:ring-1 hover:ring-gray-700 flex flex-col bg-gray-800 rounded-xl gap-2 pl-4 pr-3 py-3 sm:pl-5 sm:pr-4 sm:py-4">
      <div className="flex flex-1 justify-between gap-2">
        <NumberInput
          className="flex-1 text-xl w-full sm:text-3xl bg-transparent placeholder-gray-500 text-white outline-none"
          value={value}
          onValueChange={onValueChange}
          onBlur={onBlur}
          placeholder="0.0000"
          {...props}
        />
        {onCurrencyClick ? (
          currency ? (
            <button
              className="h-full pl-1.5 pr-2 py-1 bg-[#3d3e40] rounded-[30.64px] flex justify-start items-center gap-1.5"
              onClick={onCurrencyClick}
            >
              <LpCurrencyIcon
                chain={chain}
                currencyA={currency0}
                currencyB={currency1}
                className="w-5 h-5 shrink-0 relative"
              />
              <div className="text-sm sm:text-base text-white">
                {currency.symbol}
              </div>
            </button>
          ) : (
            <button
              className="h-8 flex items-center rounded-full bg-[#22D3EE] text-gray-950 font-semibold pl-3 pr-2 py-1 gap-2 text-sm"
              onClick={onCurrencyClick}
            >
              Select token <TriangleDownSvg />
            </button>
          )
        ) : currency ? (
          <div className="flex w-fit items-center rounded-full bg-gray-700 py-1 pl-2 pr-3 gap-2">
            <LpCurrencyIcon
              chain={chain}
              currencyA={currency0}
              currencyB={currency1}
              className="w-5 h-5 shrink-0 relative"
            />
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
          <div className="text-gray-500 text-xs sm:text-sm">
            ~{formatDollarValue(parseUnits(value, decimals), decimals, price)}
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

export default LpCurrencyAmountInput
