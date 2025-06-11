import React from 'react'
import { isAddressEqual } from 'viem'

import { Currency } from '../../model/currency'
import { Balances } from '../../model/balances'
import { LeftBracketAngleSvg } from '../svg/left-bracket-angle-svg'
import CurrencyAmountInput from '../input/currency-amount-input'
import { Prices } from '../../model/prices'
import { Chain } from '../../model/chain'
import CurrencySelect from '../selector/currency-select'

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
  prices: Prices
  onBack: () => void
  onClose: () => void
}) => {
  const [showCurrencySelect, setShowCurrencySelect] =
    React.useState<boolean>(false)
  const [amount, setAmount] = React.useState<string>('')

  return (
    <Modal show onClose={onClose}>
      <div className="flex flex-col w-fit h-[460px] sm:h-[576px] max-h-[460px] sm:max-h-[576px]">
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
          <div className="flex flex-col max-h-[460px] sm:max-h-[576px]">
            <div className="absolute w-7 h-7">
              <button
                className="flex items-center justify-center w-full h-full"
                onClick={onBack}
              >
                <LeftBracketAngleSvg />
              </button>
            </div>
            <h1 className="flex font-bold mb-6 sm:text-xl items-center justify-center w-full">
              Send {selectedCurrency?.symbol || 'Token'}
            </h1>

            <div className="flex flex-col w-full gap-2.5 sm:gap-3 self-stretch items-start">
              <div className="flex items-center w-full gap-3 self-stretch text-gray-500 text-xs sm:text-sm font-semibold">
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
                    ? (prices[selectedCurrency.address] ?? 0)
                    : undefined
                }
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
