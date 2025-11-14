import React from 'react'
import { isAddressEqual, parseUnits, zeroAddress } from 'viem'

import { Currency } from '../../model/currency'
import { Balances } from '../../model/balances'
import { LeftBracketAngleSvg } from '../svg/left-bracket-angle-svg'
import CurrencyAmountInput from '../input/currency-amount-input'
import { Prices } from '../../model/prices'
import { Chain } from '../../model/chain'
import CurrencySelect from '../selector/currency-select'
import { ActionButton } from '../button/action-button'
import { toUnitString } from '../../utils/bigint'
import { RemoteChainBalances } from '../../model/remote-chain-balances'
import { CHAIN_CONFIG } from '../../chain-configs'

import Modal from './modal'
import BalanceSourcesModal from './balance-sources-modal'

export const TokenPullModal = ({
  chain,
  explorerUrl,
  selectedCurrency,
  setSelectedCurrency,
  currencies,
  setCurrencies,
  balances,
  remoteChainBalances,
  prices,
  gasPrice,
  onBack,
  onClose,
}: {
  chain: Chain
  explorerUrl: string
  selectedCurrency: Currency | undefined
  setSelectedCurrency: (currency: Currency | undefined) => void
  currencies: Currency[]
  setCurrencies: (currencies: Currency[]) => void
  balances: Balances
  remoteChainBalances: RemoteChainBalances
  prices: Prices
  gasPrice: bigint | undefined
  onBack: () => void
  onClose: () => void
}) => {
  const [showCurrencySelect, setShowCurrencySelect] =
    React.useState<boolean>(false)
  const [showUnifiedBalanceModal, setShowUnifiedBalanceModal] =
    React.useState<boolean>(false)
  const [amount, setAmount] = React.useState<string>('')

  return (
    <Modal show onClose={onClose}>
      <div className="flex flex-col w-full h-full">
        {showCurrencySelect ? (
          <CurrencySelect
            chain={chain}
            explorerUrl={explorerUrl}
            currencies={
              selectedCurrency
                ? currencies.filter(
                    (currency) =>
                      !isAddressEqual(
                        currency.address,
                        selectedCurrency.address,
                      ),
                  )
                : currencies
            }
            balances={balances}
            remoteChainBalances={remoteChainBalances}
            prices={prices}
            onBack={() =>
              setShowCurrencySelect ? setShowCurrencySelect(false) : undefined
            }
            onCurrencySelect={(currency) => {
              if (setShowCurrencySelect) {
                setCurrencies(
                  !currencies.find((c) =>
                    isAddressEqual(c.address, currency.address),
                  )
                    ? [...currencies, currency]
                    : currencies,
                )
                setSelectedCurrency(currency)
                setShowCurrencySelect(false)
              }
            }}
            defaultBlacklistedCurrency={selectedCurrency}
          />
        ) : (
          <div className="flex flex-col h-full max-h-[480px] sm:max-h-[576px]">
            {remoteChainBalances &&
              selectedCurrency &&
              showUnifiedBalanceModal && (
                <BalanceSourcesModal
                  balances={balances}
                  remoteChainBalances={remoteChainBalances}
                  currency={selectedCurrency}
                  prices={prices}
                  onClose={() => setShowUnifiedBalanceModal(false)}
                />
              )}

            <div className="absolute w-7 h-7">
              <button
                className="flex items-center justify-center w-full h-full"
                onClick={onBack}
              >
                <LeftBracketAngleSvg />
              </button>
            </div>
            <h1 className="flex font-semibold mb-6 sm:text-xl items-center justify-center w-full">
              Bridge {selectedCurrency?.symbol || 'Token'} to{' '}
              {CHAIN_CONFIG.CHAIN.name
                .replace('Testnet', '')
                .replace('testnet', '')
                .trim()}
            </h1>

            <div className="flex flex-col justify-start items-end gap-4">
              <div className="flex flex-col w-full gap-2 self-stretch items-start">
                <div className="flex items-center w-full gap-3 self-stretch text-gray-500 text-xs sm:text-sm font-medium">
                  Bridge Token from cross-chain
                </div>
                <CurrencyAmountInput
                  chain={chain}
                  currency={selectedCurrency}
                  value={amount}
                  onValueChange={setAmount}
                  availableAmount={
                    selectedCurrency
                      ? (remoteChainBalances?.[selectedCurrency.address]
                          ?.total ?? 0n)
                      : 0n
                  }
                  onCurrencyClick={
                    setShowCurrencySelect
                      ? () => setShowCurrencySelect(true)
                      : undefined
                  }
                  setShowUnifiedBalanceModal={
                    selectedCurrency &&
                    remoteChainBalances?.[selectedCurrency.address].total
                      ? setShowUnifiedBalanceModal
                      : undefined
                  }
                  price={
                    selectedCurrency
                      ? prices[selectedCurrency.address]
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-7 sm:gap-9 mt-7">
              <div className="w-full px-4 py-[14px] bg-gray-800 rounded-xl inline-flex flex-col justify-start items-start gap-2">
                <div className="self-stretch inline-flex justify-start items-start">
                  <div className="flex-1 flex justify-start items-center gap-0.5">
                    <div className="text-[#8d94a1] justify-start text-sm font-medium">
                      Bridge Fee
                    </div>
                  </div>
                  <div className="flex justify-start items-start gap-1">
                    <div className="text-center justify-start text-gray-500 text-sm">
                      Up to
                    </div>
                    <div className="text-center justify-start text-white text-sm">
                      $
                      {(
                        Number(toUnitString(100_000n * (gasPrice ?? 0n), 18)) *
                        prices[zeroAddress]
                      ).toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>

              <ActionButton
                disabled={
                  !selectedCurrency ||
                  Number(amount) <= 0 ||
                  remoteChainBalances?.[selectedCurrency.address].total <
                    parseUnits(amount, selectedCurrency.decimals)
                }
                text={(() => {
                  if (!selectedCurrency) {
                    return 'Select Token'
                  }

                  if (Number(amount) <= 0) {
                    return 'Enter Amount'
                  }

                  if (
                    remoteChainBalances?.[selectedCurrency.address].total <
                    parseUnits(amount, selectedCurrency.decimals)
                  ) {
                    return 'Insufficient Balance'
                  }

                  return `Bridge Token to ${CHAIN_CONFIG.CHAIN.name
                    .replace('Testnet', '')
                    .replace('testnet', '')
                    .trim()}`
                })()}
                onClick={async () => {
                  if (selectedCurrency) {
                    // await onTransfer(
                    //   selectedCurrency,
                    //   parseUnits(amount, selectedCurrency.decimals),
                    //   getAddress(recipient.trim() as `0x${string}`),
                    // )
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
