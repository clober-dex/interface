import BigNumber from 'bignumber.js'

import { Asset } from '../model/futures/asset'
import { Currency } from '../model/currency'

import { getDollarValue } from './bigint'

export const getLTVTextColor = (ltv: number, asset: Asset): string => {
  const liquidationThreshold =
    (Number(asset.liquidationThreshold) * 100) / Number(asset.ltvPrecision)
  const maxLTV = (Number(asset.maxLTV) * 100) / Number(asset.ltvPrecision)

  if (asset.liquidationThreshold === 0n) {
    return ''
  }

  if (ltv >= liquidationThreshold - 0.5) {
    return 'text-red-500'
  } else if (liquidationThreshold - 0.5 > ltv && ltv > maxLTV) {
    return 'text-yellow-500'
  }
  return 'text-green-500'
}

export const calculateMaxLoanableAmount = (
  loanCurrency: Currency,
  loanAssetPrice: bigint,
  collateral: Currency,
  collateralPrice: bigint,
  collateralAmount: bigint,
  maxLTV: bigint,
  ltvPrecision: bigint,
): bigint => {
  return loanAssetPrice > 0n && collateralPrice > 0n
    ? (collateralAmount *
        maxLTV *
        collateralPrice *
        10n ** BigInt(18 - collateral.decimals)) /
        (ltvPrecision *
          loanAssetPrice *
          10n ** BigInt(18 - loanCurrency.decimals))
    : 0n
}

export const calculateMinCollateralAmount = (
  loanCurrency: Currency,
  loanAssetPrice: bigint,
  collateral: Currency,
  collateralPrice: bigint,
  loanAmount: bigint,
  maxLTV: bigint,
  ltvPrecision: bigint,
): bigint => {
  return loanAssetPrice && collateralPrice
    ? (loanAmount *
        ltvPrecision *
        loanAssetPrice *
        10n ** BigInt(18 - loanCurrency.decimals)) /
        (maxLTV * collateralPrice * 10n ** BigInt(18 - collateral.decimals))
    : 0n
}

export const calculateLtv = (
  debtCurrency: Currency,
  debtCurrencyPrice: number,
  debtAmount: bigint,
  collateral: Currency,
  collateralPrice: number,
  collateralAmount: bigint,
): number => {
  if (debtCurrencyPrice === 0 || collateralPrice === 0) {
    return 0
  }
  return debtAmount > 0n && collateralAmount <= 0n
    ? Infinity
    : collateralAmount === 0n
      ? 0
      : Math.max(
          getDollarValue(debtAmount, debtCurrency.decimals, debtCurrencyPrice)
            .times(100)
            .div(
              getDollarValue(
                collateralAmount,
                collateral.decimals,
                collateralPrice,
              ),
            )
            .toNumber(),
          0,
        )
}

export const calculateLiquidationPrice = (
  loanCurrency: Currency,
  loanAssetPrice: number,
  collateral: Currency,
  collateralPrice: number,
  loanAmount: bigint,
  collateralAmount: bigint,
  liquidationThreshold: bigint,
  ltvPrecision: bigint,
): number => {
  if (loanAmount === 0n || collateralAmount === 0n) {
    return 0
  }
  const factor = new BigNumber(
    Number(liquidationThreshold) / Number(ltvPrecision),
  )
    .times(
      getDollarValue(collateralAmount, collateral.decimals, collateralPrice),
    )
    .div(getDollarValue(loanAmount, loanCurrency.decimals, loanAssetPrice))
  const currentPrice =
    loanAssetPrice && collateralPrice
      ? Number(loanAssetPrice) / Number(collateralPrice)
      : 0
  return factor.times(currentPrice).toNumber()
}
