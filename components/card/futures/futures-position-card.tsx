import React, { useMemo } from 'react'

import { CurrencyIcon } from '../../icon/currency-icon'
import {
  currentTimestampInSeconds,
  formatDate,
  getExpirationDateTextColor,
} from '../../../utils/date'
import { formatUnits } from '../../../utils/bigint'
import { FuturesPosition } from '../../../model/futures/futures-position'
import { EditSvg } from '../../svg/edit-svg'
import { Chain } from '../../../model/chain'
import { formatTinyNumber, formatWithCommas } from '../../../utils/bignumber'

export const FuturesPositionCard = ({
  chain,
  position,
  loanAssetPrice,
  onEditCollateral,
  onClickButton,
  onCloseButton,
  isPending,
}: {
  chain: Chain
  position: FuturesPosition
  loanAssetPrice: number
  onEditCollateral: () => void
  onClickButton: () => void
  onCloseButton: () => void
  isPending: boolean
}) => {
  const now = currentTimestampInSeconds()
  const symbol = useMemo(() => {
    const symbol = position.asset.currency.symbol
    return symbol.slice(0, symbol.lastIndexOf('-'))
  }, [position.asset.currency.symbol])

  return (
    <div className="flex w-full pb-4 flex-col items-center gap-3 shrink-0 bg-[#17181e] rounded-xl">
      <div className="flex p-4 items-center self-stretch">
        <div className="flex items-center gap-3 flex-grow shrink-0 basis-0">
          <CurrencyIcon
            chain={chain}
            currency={position.asset.currency}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
          />
          <div className="flex flex-col">
            <div className="w-[89px] text-xs text-red-400 font-semibold">
              Short
            </div>
            <div className="text-base font-bold">{symbol}</div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-end gap-0.5 font-bold">
          <div className="flex text-xs text-gray-400 justify-end font-normal">
            <div className="flex flex-row gap-1 items-center justify-center">
              Expires
            </div>
          </div>
          <div
            className={`flex gap-1 ${getExpirationDateTextColor(
              position.asset.expiration,
              now,
            )}`}
          >
            {formatDate(new Date(Number(position.asset.expiration) * 1000))}
          </div>
        </div>
      </div>
      <div className="flex px-4 py-0 flex-col items-start gap-8 flex-grow shrink-0 basis-0 self-stretch">
        <div className="flex flex-col items-start gap-3 flex-grow shrink-0 basis-0 self-stretch">
          <div className="flex items-center gap-1 self-stretch">
            <div className="flex-grow flex-shrink basis-0 text-gray-400 text-sm  flex gap-1 items-center">
              Position Size
            </div>
            <div className="flex gap-1">
              <div className="text-sm sm:text-base">
                {formatUnits(
                  position.debtAmount ?? 0n,
                  position.asset.currency.decimals,
                  loanAssetPrice,
                  formatWithCommas,
                )}{' '}
                {symbol}
              </div>
              <button>
                {!isPending && <EditSvg onClick={onEditCollateral} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 self-stretch">
            <div className="flex-grow flex-shrink basis-0 text-gray-400 text-sm">
              Mark / Avg. Price
            </div>
            <div className="text-sm sm:text-base">
              ${formatTinyNumber(loanAssetPrice)}
              {' / '}${formatTinyNumber(position?.averagePrice ?? 0)}
            </div>
          </div>

          <div className="flex items-center gap-1 self-stretch">
            <div className="flex-grow flex-shrink basis-0 text-gray-400 text-sm">
              Liq. Price
            </div>
            <div className="text-sm sm:text-base">
              ${formatWithCommas((position?.liquidationPrice ?? 0).toFixed(4))}
            </div>
          </div>

          <div className="flex items-center gap-1 self-stretch">
            <div className="flex-grow flex-shrink basis-0 text-gray-400 text-sm">
              Current / Liq. LTV
            </div>
            <div className="text-sm sm:text-base">
              {(position?.ltv ?? 0).toFixed(2)}% /{'  '}
              {(
                (Number(position.asset.liquidationThreshold) * 100) /
                Number(position.asset.ltvPrecision)
              ).toFixed(2)}
              %
            </div>
          </div>

          <div className="flex items-center gap-1 self-stretch">
            <div className="flex-grow flex-shrink basis-0 text-gray-400 text-sm">
              Settle Price
            </div>
            <div className="text-sm sm:text-base">
              {position.asset.settlePrice > 0n ? (
                <>
                  $
                  {formatWithCommas(
                    (position?.asset.settlePrice ?? 0).toFixed(2),
                  )}
                </>
              ) : (
                <>-</>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 self-stretch">
          {isPending ? (
            <button
              className="w-full flex items-center font-bold justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 text-sm"
              onClick={onClickButton}
              disabled={true}
            >
              Pending Indexing
            </button>
          ) : position.asset.expiration < now ? (
            <button
              className="w-full flex items-center font-bold justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 text-sm"
              onClick={onClickButton}
              disabled={false}
            >
              {position.asset.settlePrice === 0 ? 'Settle' : 'Close'}
            </button>
          ) : (
            <>
              <button
                className="w-full flex items-center font-bold justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 text-sm"
                onClick={onClickButton}
                disabled={false}
              >
                Adjust
              </button>

              <button
                className="w-full flex items-center font-bold justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 text-sm"
                onClick={onCloseButton}
                disabled={false}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
