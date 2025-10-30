import React from 'react'
import {
  getAddress,
  isAddress,
  isAddressEqual,
  parseUnits,
  zeroAddress,
} from 'viem'

import { Currency } from '../../model/currency'
import { Balances } from '../../model/balances'
import { LeftBracketAngleSvg } from '../svg/left-bracket-angle-svg'
import CurrencyAmountInput from '../input/currency-amount-input'
import { Prices } from '../../model/prices'
import { Chain } from '../../model/chain'
import CurrencySelect from '../selector/currency-select'
import { ActionButton } from '../button/action-button'
import { toUnitString } from '../../utils/bigint'

import Modal from './modal'

export const TokenTransferModal = ({
  chain,
  explorerUrl,
  selectedCurrency,
  setSelectedCurrency,
  currencies,
  setCurrencies,
  balances,
  prices,
  gasPrice,
  onBack,
  onClose,
  onTransfer,
}: {
  chain: Chain
  explorerUrl: string
  selectedCurrency: Currency | undefined
  setSelectedCurrency: (currency: Currency | undefined) => void
  currencies: Currency[]
  setCurrencies: (currencies: Currency[]) => void
  balances: Balances
  prices: Prices
  gasPrice: bigint | undefined
  onBack: () => void
  onClose: () => void
  onTransfer: (
    currency: Currency,
    amount: bigint,
    recipient: `0x${string}`,
  ) => Promise<void>
}) => {
  const [recipient, setRecipient] = React.useState<string>('')
  const [showCurrencySelect, setShowCurrencySelect] =
    React.useState<boolean>(false)
  const [amount, setAmount] = React.useState<string>('')

  return (
    <Modal show onClose={onClose}>
      <div className="flex flex-col w-full h-full sm:h-[460px]">
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
            <div className="absolute w-7 h-7">
              <button
                className="flex items-center justify-center w-full h-full"
                onClick={onBack}
              >
                <LeftBracketAngleSvg />
              </button>
            </div>
            <h1 className="flex font-semibold mb-6 sm:text-xl items-center justify-center w-full">
              Send {selectedCurrency?.symbol || 'Token'}
            </h1>

            <div className="flex flex-col justify-start items-end gap-4">
              <div className="flex flex-col w-full gap-2 self-stretch items-start">
                <div className="flex items-center w-full gap-3 self-stretch text-gray-500 text-xs sm:text-sm font-medium">
                  Send
                </div>
                <CurrencyAmountInput
                  chain={chain}
                  currency={selectedCurrency}
                  value={amount}
                  onValueChange={setAmount}
                  availableAmount={
                    selectedCurrency ? balances[selectedCurrency.address] : 0n
                  }
                  onCurrencyClick={
                    setShowCurrencySelect
                      ? () => setShowCurrencySelect(true)
                      : undefined
                  }
                  price={
                    selectedCurrency
                      ? prices[selectedCurrency.address]
                      : undefined
                  }
                />
              </div>

              <div className="flex flex-col w-full gap-2 self-stretch items-start">
                <div className="flex items-center w-full gap-3 self-stretch text-gray-500 text-xs sm:text-sm font-medium">
                  To
                </div>
                <input
                  className="self-stretch px-4 py-3.5 rounded-[10px] bg-gray-800 text-white placeholder:text-gray-500 outline-none ring-1 ring-transparent hover:ring-gray-700 focus:ring-2 focus:ring-gray-700 transition duration-150 ease-in-out text-sm font-medium"
                  placeholder="enter recipient address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-7 sm:gap-9 mt-7 sm:mt-auto">
              <div className="w-full px-4 py-[14px] bg-gray-800 rounded-xl inline-flex flex-col justify-start items-start gap-2">
                <div className="self-stretch inline-flex justify-start items-start">
                  <div className="flex-1 flex justify-start items-center gap-0.5">
                    <div className="text-[#8d94a1] justify-start text-sm font-medium">
                      Network Fee
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
                  recipient.trim() === '' ||
                  !isAddress(recipient.trim()) ||
                  Number(amount) <= 0 ||
                  balances[selectedCurrency.address] <
                    parseUnits(amount, selectedCurrency.decimals)
                }
                text={
                  !selectedCurrency
                    ? 'Select Token'
                    : recipient.trim() === ''
                      ? 'Enter Recipient Address'
                      : !isAddress(recipient.trim())
                        ? 'Invalid Address'
                        : Number(amount) <= 0
                          ? 'Enter Amount'
                          : balances[selectedCurrency.address] <
                              parseUnits(amount, selectedCurrency.decimals)
                            ? 'Insufficient Balance'
                            : 'Confirm'
                }
                onClick={async () => {
                  if (selectedCurrency) {
                    await onTransfer(
                      selectedCurrency,
                      parseUnits(amount, selectedCurrency.decimals),
                      getAddress(recipient.trim() as `0x${string}`),
                    )
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
