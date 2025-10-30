import React from 'react'

import Modal from '../../components/modal/modal'
import { getLTVTextColor } from '../../utils/ltv'
import { formatUnits } from '../../utils/bigint'
import { Asset } from '../../model/futures/asset'
import { ArrowSvg } from '../svg/arrow-svg'
import { ActionButton, ActionButtonProps } from '../button/action-button'
import Slider from '../svg/slider'
import { DotSvg } from '../svg/dot-svg'
import { formatWithCommas } from '../../utils/bignumber'

export const FuturesPositionAdjustModal = ({
  asset,
  onClose,
  ltv,
  newLTV,
  setNewLTV,
  currentCollateralAmount,
  expectedCollateralAmount,
  currentDebtAmount,
  expectedDebtAmount,
  loanAssetPrice,
  collateralPrice,
  actionButtonProps,
  disableSlider = false,
}: {
  asset: Asset
  onClose: () => void
  ltv: number
  newLTV: number
  setNewLTV: (value: number) => void
  currentCollateralAmount: bigint
  expectedCollateralAmount: bigint
  currentDebtAmount: bigint
  expectedDebtAmount: bigint
  loanAssetPrice: number
  collateralPrice: number
  actionButtonProps: ActionButtonProps
  disableSlider?: boolean
}) => {
  const maxLTV = (Number(asset.maxLTV) * 100) / Number(asset.ltvPrecision)
  return (
    <Modal show onClose={() => {}} onButtonClick={onClose}>
      <h1 className="flex font-bold text-xl mb-2">
        {disableSlider ? 'Close Position' : 'Adjust Position'}
      </h1>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col bg-[#17181e]">
          <div className="flex justify-between flex-col relative rounded-lg sm:py-10">
            <div className="sm:px-6 sm:mb-2 my-8 sm:my-0">
              <Slider
                minPosition={0}
                segments={maxLTV + 1}
                value={parseInt(newLTV.toFixed(0))}
                tickMarks={[
                  ...(Math.abs(newLTV - ltv) > 1
                    ? [
                        {
                          value: parseInt(ltv.toFixed(0)),
                          label: `${ltv.toFixed(0)}%`,
                          width: 50,
                        },
                      ]
                    : []),

                  ...[
                    {
                      value: maxLTV,
                      label: `${maxLTV.toFixed(0)}%`,
                      width: 50,
                    },
                  ],
                ]}
                onValueChange={
                  disableSlider ? () => {} : (value) => setNewLTV(value) // value is 0-based
                }
                renderControl={() => (
                  <div className="absolute -top-3 -left-7 flex flex-col items-center gap-2 shrink-0">
                    <DotSvg />
                    <div className="flex px-2 py-1 justify-center w-[50px] items-center gap-1 rounded-2xl bg-blue-500 bg-opacity-10 text-xs text-blue-500 font-bold">
                      {newLTV.toFixed(0)}%
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-start self-stretch">
              <div className="text-gray-400 text-xs sm:text-sm">LTV</div>
              <div className="flex ml-auto items-center gap-1.5 text-xs sm:text-sm text-white">
                <span className={`${getLTVTextColor(ltv, asset)}`}>
                  {ltv.toFixed(2)}%
                </span>
                {ltv !== newLTV ? (
                  <>
                    <ArrowSvg />
                    <span className={`${getLTVTextColor(newLTV, asset)}`}>
                      {newLTV.toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <></>
                )}
              </div>
            </div>
            <div className="flex items-start self-stretch">
              <div className="text-gray-400 text-xs sm:text-sm">
                Collateral Size ({asset.collateral.symbol})
              </div>
              <div className="flex ml-auto items-center gap-1.5 text-xs sm:text-sm text-white">
                <span>
                  {formatUnits(
                    currentCollateralAmount,
                    asset.collateral.decimals,
                    collateralPrice,
                    formatWithCommas,
                  )}
                </span>
                {currentCollateralAmount !== expectedCollateralAmount ? (
                  <>
                    <ArrowSvg />
                    <span>
                      {formatUnits(
                        expectedCollateralAmount,
                        asset.collateral.decimals,
                        collateralPrice,
                        formatWithCommas,
                      )}
                    </span>
                  </>
                ) : (
                  <></>
                )}
              </div>
            </div>
            <div className="flex items-start self-stretch">
              <div className="text-gray-400 text-xs sm:text-sm">
                Remaining Debt ({asset.currency.symbol})
              </div>
              <div className="flex ml-auto items-center gap-1.5 text-xs sm:text-sm text-white">
                <span>
                  {formatUnits(
                    currentDebtAmount,
                    asset.currency.decimals,
                    loanAssetPrice,
                    formatWithCommas,
                  )}
                </span>
                {currentDebtAmount !== expectedDebtAmount ? (
                  <>
                    <ArrowSvg />
                    <span>
                      {formatUnits(
                        expectedDebtAmount,
                        asset.currency.decimals,
                        loanAssetPrice,
                        formatWithCommas,
                      )}
                    </span>
                  </>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
        <ActionButton {...actionButtonProps} />
      </div>
    </Modal>
  )
}
