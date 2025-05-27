import React from 'react'

import { ActionButton, ActionButtonProps } from '../../button/action-button'
import CurrencyAmountInput from '../../input/currency-amount-input'
import { getLTVTextColor } from '../../../utils/ltv'
import { Balances } from '../../../model/balances'
import { Prices } from '../../../model/prices'
import { Asset } from '../../../model/futures/asset'
import { formatDollarValue } from '../../../utils/bigint'
import { Chain } from '../../../model/chain'
import { formatWithCommas } from '../../../utils/bignumber'

export const MintFuturesAssetForm = ({
  chain,
  asset,
  maxBorrowAmount,
  borrowLTV,
  collateralValue,
  setCollateralValue,
  borrowValue,
  setBorrowValue,
  balances,
  prices,
  liquidationPrice,
  actionButtonProps,
  children,
}: {
  chain: Chain
  asset: Asset
  maxBorrowAmount: bigint
  borrowLTV: number
  collateralValue: string
  setCollateralValue: (value: string) => void
  borrowValue: string
  setBorrowValue: (value: string) => void
  balances: Balances
  prices: Prices
  liquidationPrice: number
  actionButtonProps: ActionButtonProps
} & React.PropsWithChildren) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 bg-[#171b24] rounded-xl sm:rounded-3xl p-4 sm:p-6 sm:pb-8 w-full sm:w-[480px]">
        <div className="flex flex-col gap-4">
          <div className="font-bold text-sm sm:text-lg">
            How much collateral would you like to add?
          </div>
          <CurrencyAmountInput
            chain={chain}
            currency={asset.collateral}
            value={collateralValue}
            onValueChange={setCollateralValue}
            availableAmount={balances[asset.collateral.address] ?? 0n}
            price={prices[asset.collateral.address]}
          />
          <div className="flex ml-auto">{children}</div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="font-bold text-sm sm:text-lg">
            How much would you like to borrow?
          </div>
          <CurrencyAmountInput
            chain={chain}
            currency={asset.currency}
            value={borrowValue}
            onValueChange={setBorrowValue}
            price={prices[asset.currency.address]}
            availableAmount={maxBorrowAmount}
          />
        </div>
      </div>
      <div className="flex flex-col gap-6 bg-[#171b24] rounded-xl sm:rounded-3xl p-4 sm:p-6 w-full sm:w-[480px]">
        <div className="flex flex-col items-start gap-6 self-stretch">
          <div className="font-bold text-sm sm:text-lg">
            Transaction Overview
          </div>
          <div className="flex flex-col items-start gap-3 self-stretch">
            <div className="flex w-full">
              <div className="text-gray-400 text-sm sm:text-base">
                Mark Price
              </div>
              <div className="ml-auto text-sm sm:text-base">
                {formatDollarValue(
                  1000000000000000000n,
                  18,
                  prices[asset.currency.address] ?? 0,
                )}
              </div>
            </div>
            <div className="flex w-full">
              <div className="text-gray-400 text-sm sm:text-base">LTV</div>
              <div
                className={`ml-auto text-sm sm:text-base ${getLTVTextColor(borrowLTV, asset)}`}
              >
                {borrowLTV.toFixed(2)}%
              </div>
            </div>
            <div className="flex w-full">
              <div className="text-gray-400 text-sm sm:text-base">
                Liquidation LTV
              </div>
              <div className="ml-auto text-sm sm:text-base">
                {Number(
                  (asset.liquidationThreshold * 100n) / asset.ltvPrecision,
                ).toFixed(2)}
                %
              </div>
            </div>
            <div className="flex w-full">
              <div className="text-gray-400 text-sm sm:text-base">
                Liquidation Price
              </div>
              <div className="ml-auto text-sm sm:text-base">
                {liquidationPrice ? (
                  <>${formatWithCommas(liquidationPrice.toFixed(2))}</>
                ) : (
                  <>-</>
                )}
              </div>
            </div>
            <div className="flex w-full">
              <div className="flex flex-row items-center justify-center gap-1 text-gray-400 text-sm sm:text-base">
                Expiry Date
              </div>
              <div className="ml-auto text-sm sm:text-base">
                {new Date(asset.expiration * 1000).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
        <ActionButton {...actionButtonProps} />
      </div>
    </div>
  )
}
