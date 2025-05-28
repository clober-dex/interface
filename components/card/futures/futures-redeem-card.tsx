import React, { useMemo } from 'react'

import { CurrencyIcon } from '../../icon/currency-icon'
import {
  currentTimestampInSeconds,
  formatDate,
  getExpirationDateTextColor,
} from '../../../utils/date'
import { formatUnits } from '../../../utils/bigint'
import { Asset } from '../../../model/futures/asset'
import { Prices } from '../../../model/prices'
import { ActionButtonProps } from '../../button/action-button'
import { Chain } from '../../../model/chain'
import { formatTinyNumber, formatWithCommas } from '../../../utils/bignumber'

export const FuturesRedeemCard = ({
  chain,
  asset,
  balance,
  prices,
  redeemableCollateral,
  actionButtonProps,
}: {
  chain: Chain
  asset: Asset
  balance: bigint
  prices: Prices
  redeemableCollateral: bigint
  actionButtonProps: ActionButtonProps
}) => {
  const now = currentTimestampInSeconds()
  const symbol = useMemo(() => {
    const symbol = asset.currency.symbol
    return symbol.slice(0, symbol.lastIndexOf('-'))
  }, [asset.currency.symbol])

  return (
    <div className="flex w-full pb-4 flex-col items-center gap-3 shrink-0 bg-[#171b24] rounded-xl">
      <div className="flex p-4 items-center self-stretch">
        <div className="flex items-center gap-3 flex-grow shrink-0 basis-0">
          <CurrencyIcon
            chain={chain}
            currency={asset.currency}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
          />
          <div className="flex flex-col">
            <div className="w-[89px] text-xs text-green-400 font-semibold">
              Long
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
              asset.expiration,
              now,
            )}`}
          >
            {formatDate(new Date(Number(asset.expiration) * 1000))}
          </div>
        </div>
      </div>
      <div className="flex px-4 py-0 flex-col items-start gap-8 flex-grow shrink-0 basis-0 self-stretch">
        <div className="flex flex-col items-start gap-3 flex-grow shrink-0 basis-0 self-stretch">
          <div className="flex items-center gap-1 self-stretch">
            <div className="flex-grow flex-shrink basis-0 text-gray-400 text-sm  flex gap-1 items-center">
              Balance
            </div>
            <div className="flex gap-1">
              <div className="text-sm sm:text-base">
                {formatUnits(
                  balance,
                  asset.currency.decimals,
                  prices[asset.currency.address] ?? 0,
                )}{' '}
                {symbol}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 self-stretch">
            <div className="flex-grow flex-shrink basis-0 text-gray-400 text-sm">
              Mark Price
            </div>
            <div className="text-sm sm:text-base">
              {formatTinyNumber(prices[asset.currency.address] ?? 0)}
            </div>
          </div>

          <div className="flex items-center gap-1 self-stretch">
            <div className="flex-grow flex-shrink basis-0 text-gray-400 text-sm">
              Redeemable
            </div>
            <div className="text-sm sm:text-base">
              {formatUnits(
                redeemableCollateral,
                asset.collateral.decimals,
                prices[asset.collateral.address] ?? 0,
              )}{' '}
              {asset.collateral.symbol}
            </div>
          </div>

          <div className="flex items-center gap-1 self-stretch">
            <div className="flex-grow flex-shrink basis-0 text-gray-400 text-sm">
              Settle Price
            </div>
            <div className="text-sm sm:text-base">
              {asset.settlePrice > 0n ? (
                <>${formatWithCommas(asset.settlePrice.toFixed(2))}</>
              ) : (
                <>-</>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 self-stretch">
          <button
            onClick={
              actionButtonProps.disabled ? undefined : actionButtonProps.onClick
            }
            disabled={actionButtonProps.disabled}
            className="w-full flex items-center font-bold justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 text-sm"
          >
            {actionButtonProps.text}
          </button>
        </div>
      </div>
    </div>
  )
}
