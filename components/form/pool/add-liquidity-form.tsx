import React, { useMemo, useState } from 'react'

import { Prices } from '../../../model/prices'
import { ActionButton, ActionButtonProps } from '../../button/action-button'
import CurrencyAmountInput from '../../input/currency-amount-input'
import { formatWithCommas } from '../../../utils/bignumber'
import { formatDollarValue, toUnitString } from '../../../utils/bigint'
import { SlippageSelector } from '../../selector/slippage-selector'
import { Chain } from '../../../model/chain'
import { Pool } from '../../../model/pool'
import { Toggle } from '../../toggle'
import { RemoteChainBalances } from '../../../model/remote-chain-balances'
import BalanceSourcesModal from '../../modal/balance-sources-modal'

export const AddLiquidityForm = ({
  chain,
  pool,
  remoteChainBalances,
  prices,
  currency0Amount,
  setCurrency0Amount,
  availableCurrency0Balance,
  currency1Amount,
  setCurrency1Amount,
  availableCurrency1Balance,
  disableSwap,
  setDisableSwap,
  disableDisableSwap,
  slippageInput,
  setSlippageInput,
  receiveLpCurrencyAmount,
  isCalculatingReceiveLpAmount,
  actionButtonProps,
}: {
  chain: Chain
  pool: Pool
  remoteChainBalances: RemoteChainBalances
  prices: Prices
  currency0Amount: string
  setCurrency0Amount: (inputCurrencyAmount: string) => void
  availableCurrency0Balance: bigint
  currency1Amount: string
  setCurrency1Amount: (inputCurrencyAmount: string) => void
  availableCurrency1Balance: bigint
  disableSwap: boolean
  setDisableSwap: (value: boolean) => void
  disableDisableSwap: boolean
  slippageInput: string
  setSlippageInput: (slippageInput: string) => void
  receiveLpCurrencyAmount: bigint
  isCalculatingReceiveLpAmount: boolean
  actionButtonProps: ActionButtonProps
}) => {
  const isNoLiquidity = useMemo(
    () =>
      pool.liquidityA.total.value === '0' &&
      pool.liquidityB.total.value === '0',
    [pool],
  )
  const [
    showCurrencyAUnifiedBalanceModal,
    setShowCurrencyAUnifiedBalanceModal,
  ] = useState<boolean>(false)
  const [
    showCurrencyBUnifiedBalanceModal,
    setShowCurrencyBUnifiedBalanceModal,
  ] = useState<boolean>(false)

  return showCurrencyAUnifiedBalanceModal ? (
    <BalanceSourcesModal
      balances={{
        [pool.currencyA!.address]: availableCurrency0Balance,
      }}
      remoteChainBalances={remoteChainBalances}
      currency={pool.currencyA!}
      prices={prices}
      onClose={() => setShowCurrencyAUnifiedBalanceModal(false)}
    />
  ) : showCurrencyBUnifiedBalanceModal ? (
    <BalanceSourcesModal
      balances={{
        [pool.currencyB!.address]: availableCurrency1Balance,
      }}
      remoteChainBalances={remoteChainBalances}
      currency={pool.currencyB!}
      prices={prices}
      onClose={() => setShowCurrencyBUnifiedBalanceModal(false)}
    />
  ) : (
    <>
      <div className="flex flex-col relative gap-4 self-stretch p-4 sm:p-5 bg-[#16181d] rounded-2xl lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
        <div className="flex flex-row w-full text-[#8d94a1] text-[13px] font-medium">
          Enter amount you’d like to add.
        </div>
        <div className="flex flex-col relative gap-3 self-stretch">
          <CurrencyAmountInput
            chain={chain}
            currency={pool.currencyA}
            value={currency0Amount}
            onValueChange={setCurrency0Amount}
            availableAmount={availableCurrency0Balance}
            setShowUnifiedBalanceModal={
              pool.currencyA &&
              remoteChainBalances?.[pool.currencyA.address].total
                ? setShowCurrencyAUnifiedBalanceModal
                : undefined
            }
            price={prices[pool.currencyA.address]}
          />
          <CurrencyAmountInput
            chain={chain}
            currency={pool.currencyB}
            value={currency1Amount}
            onValueChange={setCurrency1Amount}
            availableAmount={availableCurrency1Balance}
            setShowUnifiedBalanceModal={
              pool.currencyB &&
              remoteChainBalances?.[pool.currencyB.address].total
                ? setShowCurrencyBUnifiedBalanceModal
                : undefined
            }
            price={prices[pool.currencyB.address]}
          />
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <div className="text-[#8d94a1] text-sm font-medium">
            Auto-Balance Liquidity
          </div>
          <Toggle
            disabled={disableDisableSwap}
            defaultChecked={!isNoLiquidity}
            onChange={() => {
              setDisableSwap(!disableSwap)
            }}
          />
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 self-stretch text-xs sm:text-sm p-4 sm:p-5 bg-[#16181d] rounded-2xl lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
        <div className="flex flex-col gap-2.5 self-stretch">
          <div className="flex items-center gap-2 self-stretch">
            <div className="text-gray-400 text-[13px] font-semibold">
              Receive
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {isCalculatingReceiveLpAmount ? (
                <span className="w-[100px] h-5 mx-1 rounded animate-pulse bg-gray-500" />
              ) : (
                <div className="flex items-center gap-1 text-white text-sm font-semibold">
                  <div>
                    {toUnitString(
                      receiveLpCurrencyAmount,
                      pool.lpCurrency.decimals,
                      pool.lpPriceUSD,
                      formatWithCommas,
                    )}
                    {' LP'}
                  </div>
                  <div className="text-gray-400 text-[13px]">
                    (
                    {formatDollarValue(
                      receiveLpCurrencyAmount,
                      pool.lpCurrency.decimals,
                      pool.lpPriceUSD,
                    )}
                    )
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-row w-full">
            <div className="text-gray-400 flex flex-row sm:flex-col gap-3">
              Max Slippage
            </div>
            <div className="flex ml-auto">
              <SlippageSelector
                slippageInput={slippageInput}
                setSlippageInput={setSlippageInput}
              />
            </div>
          </div>
        </div>

        <ActionButton {...actionButtonProps} />
      </div>
    </>
  )
}
