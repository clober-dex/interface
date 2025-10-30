import React, { useMemo, useState } from 'react'
import { parseUnits } from 'viem'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { Asset } from '../../model/futures/asset'
import { MintFuturesAssetForm } from '../../components/form/futures/mint-futures-asset-form'
import { useCurrencyContext } from '../../contexts/currency-context'
import {
  calculateLiquidationPrice,
  calculateLtv,
  calculateMaxLoanableAmount,
} from '../../utils/ltv'
import { toUnitString } from '../../utils/bigint'
import { useFuturesContractContext } from '../../contexts/futures/futures-contract-context'
import Modal from '../../components/modal/modal'
import { useChainContext } from '../../contexts/chain-context'
import { CHAIN_CONFIG } from '../../chain-configs'

export const FuturesManagerContainer = ({ asset }: { asset: Asset }) => {
  const router = useRouter()
  const { selectedChain } = useChainContext()
  const [displayMarketClosedModal, setDisplayMarketClosedModal] =
    useState(false)
  const { balances, prices, getAllowance } = useCurrencyContext()
  const { borrow } = useFuturesContractContext()
  const [collateralValue, setCollateralValue] = useState('')
  const [borrowValue, setBorrowValue] = useState('')

  const [debtAmount, collateralAmount, collateralUserBalance] = useMemo(() => {
    return [
      parseUnits(borrowValue || '0', asset.currency.decimals),
      parseUnits(collateralValue || '0', asset.collateral.decimals),
      balances[asset.collateral.address],
    ]
  }, [
    asset.collateral.address,
    asset.collateral.decimals,
    asset.currency.decimals,
    balances,
    borrowValue,
    collateralValue,
  ])

  const maxBorrowAmount = useMemo(
    () =>
      calculateMaxLoanableAmount(
        asset.currency,
        parseUnits(prices[asset.currency.address].toFixed(18), 18),
        asset.collateral,
        parseUnits(prices[asset.collateral.address].toFixed(18), 18),
        collateralAmount,
        asset.maxLTV,
        asset.ltvPrecision,
      ),
    [
      asset.collateral,
      asset.currency,
      asset.ltvPrecision,
      asset.maxLTV,
      collateralAmount,
      prices,
    ],
  )
  const isDeptSizeLessThanMinDebtSize = useMemo(
    () => asset.minDebt > 0n && debtAmount < asset.minDebt,
    [asset.minDebt, debtAmount],
  )

  return displayMarketClosedModal ? (
    <Modal
      show
      onClose={() => {}}
      onButtonClick={() => setDisplayMarketClosedModal(false)}
    >
      <h1 className="flex font-bold text-xl mb-2">Notice</h1>
      <div className="text-sm">
        our price feeds follow the traditional market hours of each asset
        classes and will be available at the following hours:{' '}
        <span>
          <Link
            className="text-blue-500 underline font-bold"
            target="_blank"
            href="https://docs.pyth.network/price-feeds/market-hours"
          >
            [Link]
          </Link>
        </span>
      </div>
    </Modal>
  ) : (
    <MintFuturesAssetForm
      chain={selectedChain}
      asset={asset}
      maxBorrowAmount={maxBorrowAmount}
      borrowLTV={calculateLtv(
        asset.currency,
        prices[asset.currency.address],
        debtAmount,
        asset.collateral,
        prices[asset.collateral.address],
        collateralAmount,
      )}
      collateralValue={collateralValue}
      setCollateralValue={setCollateralValue}
      borrowValue={borrowValue}
      setBorrowValue={setBorrowValue}
      balances={balances}
      prices={prices}
      liquidationPrice={calculateLiquidationPrice(
        asset.currency,
        prices[asset.currency.address],
        asset.collateral,
        prices[asset.collateral.address],
        debtAmount,
        collateralAmount,
        asset.liquidationThreshold,
        asset.ltvPrecision,
      )}
      actionButtonProps={{
        disabled:
          collateralAmount === 0n ||
          debtAmount === 0n ||
          collateralAmount > collateralUserBalance ||
          debtAmount > maxBorrowAmount ||
          isDeptSizeLessThanMinDebtSize,
        onClick: async () => {
          const hash = await borrow(
            asset,
            collateralAmount,
            debtAmount,
            () => {},
          )
          if (hash) {
            await router.replace('/futures')
          }
        },
        text: (() => {
          if (collateralAmount === 0n) {
            return 'Enter collateral amount'
          }
          if (debtAmount === 0n) {
            return 'Enter loan amount'
          }

          if (collateralAmount > collateralUserBalance) {
            return `Insufficient ${asset.collateral.symbol} balance`
          }

          if (debtAmount > maxBorrowAmount) {
            return 'Not enough collateral'
          }

          if (isDeptSizeLessThanMinDebtSize) {
            const minDebtReadable = toUnitString(
              asset.minDebt,
              asset.currency.decimals,
              prices[asset.currency.address],
            )
            const symbol = asset.currency.symbol.split('-')[0]
            return `Remaining debt must be ≥ ${minDebtReadable} ${symbol}`
          }

          const allowance = getAllowance(
            CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
            asset.collateral,
          )

          if (collateralAmount > allowance) {
            return `Max Approve ${asset.collateral.symbol}`
          }

          return 'Mint'
        })(),
      }}
    />
  )
}
