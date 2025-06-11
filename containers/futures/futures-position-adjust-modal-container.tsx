import React, { useEffect, useMemo, useState } from 'react'
import { parseUnits } from 'viem'

import { FuturesPositionAdjustModal } from '../../components/modal/futures-position-adjust-modal'
import { FuturesPosition } from '../../model/futures/futures-position'
import { calculateLtv, calculateMaxLoanableAmount } from '../../utils/ltv'
import { useCurrencyContext } from '../../contexts/currency-context'
import { applyPercent, formatUnits } from '../../utils/bigint'
import { useFuturesContractContext } from '../../contexts/futures/futures-contract-context'

export const FuturesPositionAdjustModalContainer = ({
  userPosition,
  onClose,
  startLTV,
}: {
  userPosition: FuturesPosition
  onClose: () => void
  startLTV: number | undefined
}) => {
  const { prices, balances } = useCurrencyContext()
  const { borrow, repay, repayAll } = useFuturesContractContext()

  const ltv = calculateLtv(
    userPosition.asset.currency,
    prices[userPosition.asset.currency.address] ?? 0,
    userPosition?.debtAmount ?? 0n,
    userPosition.asset.collateral,
    prices[userPosition.asset.collateral.address] ?? 0,
    userPosition?.collateralAmount ?? 0n,
  )
  const [newLTV, setNewLTV] = useState(startLTV === undefined ? ltv : startLTV)
  const [ltvNewBuffer, setLTVNewBuffer] = useState({
    previous: newLTV,
    updateAt: Date.now(),
  })

  const [maxLoanableAmount, expectedCollateralAmount, expectedDebtAmount] =
    useMemo(() => {
      const maxLTV =
        (Number(userPosition.asset.maxLTV) * 100) /
        Number(userPosition.asset.ltvPrecision)
      const maxLoanableAmount = calculateMaxLoanableAmount(
        userPosition.asset.currency,
        parseUnits(
          (prices[userPosition.asset.currency.address] ?? 0).toFixed(18),
          18,
        ),
        userPosition.asset.collateral,
        parseUnits(
          (prices[userPosition.asset.collateral.address] ?? 0).toFixed(18),
          18,
        ),
        userPosition?.collateralAmount ?? 0n,
        userPosition.asset.maxLTV,
        userPosition.asset.ltvPrecision,
      )
      if (newLTV !== ltv) {
        return [
          maxLoanableAmount,
          userPosition?.collateralAmount ?? 0n,
          applyPercent(maxLoanableAmount, (newLTV * 100) / maxLTV),
        ]
      }
      return [
        maxLoanableAmount,
        userPosition?.collateralAmount ?? 0n,
        userPosition?.debtAmount ?? 0n,
      ]
    }, [
      ltv,
      newLTV,
      prices,
      userPosition.asset.collateral,
      userPosition.asset.currency,
      userPosition.asset.ltvPrecision,
      userPosition.asset.maxLTV,
      userPosition.collateralAmount,
      userPosition.debtAmount,
    ])

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        Date.now() - ltvNewBuffer.updateAt > 100 &&
        ltvNewBuffer.previous !== newLTV
      ) {
        setLTVNewBuffer({
          previous: newLTV,
          updateAt: Date.now(),
        })
      }
    }, 250)
    return () => clearInterval(interval)
  }, [newLTV, ltvNewBuffer.previous, ltvNewBuffer.updateAt])

  const debtAmountDelta = useMemo(
    () => expectedDebtAmount - (userPosition?.debtAmount ?? 0n),
    [expectedDebtAmount, userPosition?.debtAmount],
  )

  return (
    <FuturesPositionAdjustModal
      asset={userPosition.asset}
      onClose={onClose}
      ltv={ltv}
      newLTV={newLTV}
      setNewLTV={setNewLTV}
      currentCollateralAmount={userPosition?.collateralAmount ?? 0n}
      expectedCollateralAmount={expectedCollateralAmount}
      currentDebtAmount={userPosition?.debtAmount ?? 0n}
      expectedDebtAmount={expectedDebtAmount}
      //
      loanAssetPrice={prices[userPosition.asset.currency.address] ?? 0}
      collateralPrice={prices[userPosition.asset.collateral.address] ?? 0}
      disableSlider={startLTV !== undefined}
      actionButtonProps={{
        onClick: async () => {
          if (newLTV === 0) {
            const hash = await repayAll(userPosition)
            if (hash) {
              onClose()
            }
          } else if (ltv < newLTV) {
            const hash = await borrow(userPosition.asset, 0n, debtAmountDelta)
            if (hash) {
              onClose()
            }
          } else if (ltv > newLTV) {
            const hash = await repay(userPosition.asset, -debtAmountDelta)
            if (hash) {
              onClose()
            }
          }
        },
        disabled:
          (newLTV > 0 && Math.abs(ltv - newLTV) < 0.5) ||
          (newLTV > ltv && expectedDebtAmount > maxLoanableAmount) ||
          (debtAmountDelta < 0n &&
            balances[userPosition.asset.currency.address] < -debtAmountDelta) ||
          (userPosition.asset.minDebt > expectedDebtAmount &&
            expectedDebtAmount > 0n),
        text:
          newLTV > ltv && expectedDebtAmount > maxLoanableAmount
            ? 'Not enough collateral'
            : userPosition.asset.minDebt > expectedDebtAmount &&
                expectedDebtAmount > 0n
              ? `Remaining debt must be ≥ ${formatUnits(
                  userPosition.asset.minDebt,
                  userPosition.asset.currency.decimals,
                  prices[userPosition.asset.currency.address] ?? 0,
                )} ${userPosition.asset.currency.symbol.split('-')[0]}`
              : debtAmountDelta < 0n &&
                  balances[userPosition.asset.currency.address] <
                    -debtAmountDelta
                ? 'Not enough futures balance'
                : newLTV === 0
                  ? 'Close Position'
                  : ltv < newLTV
                    ? 'Borrow'
                    : 'Repay',
      }}
    />
  )
}
