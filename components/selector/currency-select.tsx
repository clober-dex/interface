import React, { useCallback, useEffect, useRef } from 'react'
import { getAddress, isAddress, isAddressEqual } from 'viem'
import Image from 'next/image'
import {
  getNativeCurrency,
  getReferenceCurrency,
  getStableCurrencies,
} from '@clober/v2-sdk'

import { Currency } from '../../model/currency'
import { LeftBracketAngleSvg } from '../svg/left-bracket-angle-svg'
import { SearchSvg } from '../svg/search-svg'
import { formatDollarValue, formatUnits } from '../../utils/bigint'
import { CurrencyIcon } from '../icon/currency-icon'
import { Balances } from '../../model/balances'
import { Prices } from '../../model/prices'
import {
  deduplicateCurrencies,
  fetchCurrenciesByName,
  fetchCurrency,
} from '../../utils/currency'
import InspectCurrencyModal from '../modal/inspect-currency-modal'
import { Chain } from '../../model/chain'
import { useWindowWidth } from '../../hooks/useWindowWidth'

const CurrencySelect = ({
  chain,
  explorerUrl,
  currencies,
  balances,
  prices,
  onBack,
  onCurrencySelect,
  defaultBlacklistedCurrency,
}: {
  chain: Chain
  explorerUrl: string
  currencies: Currency[]
  balances: Balances
  prices: Prices
  onBack: () => void
  onCurrencySelect: (currency: Currency) => void
  defaultBlacklistedCurrency?: Currency
} & React.HTMLAttributes<HTMLDivElement>) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const width = useWindowWidth()

  useEffect(() => {
    if (width > 0 && width >= 640) {
      inputRef.current?.focus()
    }
  }, [width])

  const [customizedCurrencies, setCustomizedCurrencies] = React.useState<
    Currency[] | undefined
  >()
  const [loadingCurrencies, setLoadingCurrencies] =
    React.useState<boolean>(false)
  const [inspectingCurrency, setInspectingCurrency] = React.useState<
    Currency | undefined
  >(undefined)
  const [value, _setValue] = React.useState('')
  const setValue = useCallback(
    async (value: string) => {
      _setValue(value)
      setLoadingCurrencies(true)
      if (
        isAddress(value) &&
        !currencies.find((currency) =>
          isAddressEqual(currency.address, getAddress(value)),
        )
      ) {
        if (
          defaultBlacklistedCurrency &&
          isAddressEqual(defaultBlacklistedCurrency.address, getAddress(value))
        ) {
          setCustomizedCurrencies(undefined)
        } else {
          const currency = await fetchCurrency(chain, value)
          if (currency) {
            setCustomizedCurrencies([currency])
          } else {
            setCustomizedCurrencies(undefined)
          }
        }
      } else if (!isAddress(value)) {
        const currencies = await fetchCurrenciesByName(chain, value)
        if (currencies.length > 0) {
          setCustomizedCurrencies(currencies)
        } else {
          setCustomizedCurrencies(undefined)
        }
      }
      setLoadingCurrencies(false)
    },
    [chain, currencies, defaultBlacklistedCurrency],
  )

  const stableCurrencies = getStableCurrencies({ chainId: chain.id })
  const nativeCurrency = getNativeCurrency({ chainId: chain.id })
  const referenceCurrency = getReferenceCurrency({ chainId: chain.id })

  return (
    <>
      <InspectCurrencyModal
        chain={chain}
        currency={inspectingCurrency}
        onCurrencySelect={onCurrencySelect}
        setInspectingCurrency={setInspectingCurrency}
        explorerUrl={explorerUrl}
      />
      <div className="flex flex-col gap-4 w-full h-full">
        <div className="flex items-center justify-center">
          <div
            className="w-6 h-6 cursor-pointer flex items-center justify-center shrink-0"
            onClick={onBack}
          >
            <LeftBracketAngleSvg />
          </div>
          <div className="flex flex-1 items-center justify-center text-base sm:text-xl font-bold text-white flex-grow">
            Select a token
          </div>
          <div className="w-6 h-6 shrink-0"></div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col relative rounded shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <div className="relative h-4 w-4">
                <SearchSvg />
              </div>
            </div>
            <div className="inline-block">
              <div className="invisible h-0 mx-[29px]" aria-hidden="true">
                Search by token name, symbol, or address
              </div>
              <input
                ref={inputRef}
                type="search"
                name="token-search"
                id="search"
                autoComplete="off"
                className="focus:ring-2 inline w-full rounded-md border-0 pl-10 py-3 text-gray-500 bg-gray-800 placeholder:text-gray-500 text-xs sm:text-sm"
                placeholder="Search by token name, symbol, or address"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </div>
          </div>
          <span className="self-stretch justify-start text-gray-400 text-[13px] font-medium">
            Trade any ERC-20 token permissionlessly. Just paste the token
            address to get started.
          </span>
        </div>
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-gray-[#171b24] rounded-b-xl sm:rounded-b-3xl">
          {deduplicateCurrencies(
            customizedCurrencies
              ? [...currencies, ...customizedCurrencies]
              : currencies,
          )
            .filter(
              (currency) =>
                (isAddress(value) &&
                  isAddressEqual(currency.address, getAddress(value))) ||
                currency.name.toLowerCase().includes(value.toLowerCase()) ||
                currency.symbol.toLowerCase().includes(value.toLowerCase()),
            )
            .filter(
              (currency) =>
                !defaultBlacklistedCurrency ||
                !isAddressEqual(
                  currency.address,
                  defaultBlacklistedCurrency.address,
                ),
            )
            .sort((a, b) => {
              const getPriority = (currency: Currency) => {
                if (isAddressEqual(currency.address, nativeCurrency.address)) {
                  return 0
                }
                if (
                  stableCurrencies.some((c) =>
                    isAddressEqual(c.address, currency.address),
                  )
                ) {
                  return 1
                }
                if (
                  isAddressEqual(currency.address, referenceCurrency.address)
                ) {
                  return 2
                }
                return 3
              }

              const priorityA = getPriority(a)
              const priorityB = getPriority(b)

              if (priorityA !== priorityB) {
                return priorityA - priorityB
              }

              // Fallback to balance * price value for same-priority currencies
              const aValue =
                Number(formatUnits(balances[a.address] ?? 0n, a.decimals)) *
                (prices[a.address] ?? 1e-15)
              const bValue =
                Number(formatUnits(balances[b.address] ?? 0n, b.decimals)) *
                (prices[b.address] ?? 1e-15)

              return bValue - aValue
            })
            .map((currency) => (
              <button
                key={currency.address}
                className="flex w-full px-4 py-2 items-center justify-between text-start hover:bg-gray-700 rounded-lg shrink-0"
                onClick={() => {
                  if (currency.isVerified) {
                    onCurrencySelect(currency)
                  } else {
                    setInspectingCurrency(currency)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <CurrencyIcon
                    chain={chain}
                    currency={currency}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                  />
                  <div className="flex-col justify-center items-start gap-[2px]">
                    <div className="flex items-center gap-1">
                      <div className="text-sm sm:text-base font-bold text-white">
                        {currency.symbol}
                      </div>
                      {!currency.isVerified ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M8.9073 4.41123C9.38356 3.55396 10.6164 3.55396 11.0927 4.41122L16.6937 14.493C17.1565 15.3261 16.5541 16.35 15.601 16.35H4.39903C3.44592 16.35 2.84346 15.3261 3.30633 14.493L8.9073 4.41123Z"
                            stroke="#FACC15"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M10 9V10.8"
                            stroke="#FACC15"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="9.99961"
                            cy="13.5"
                            r="0.9"
                            fill="#FACC15"
                          />
                        </svg>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {currency.name}
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-sm text-end text-white">
                  <div>
                    {formatUnits(
                      balances[currency.address] ?? 0n,
                      currency.decimals,
                      prices[currency.address] ?? 0,
                    )}
                  </div>
                  {prices[currency.address] ? (
                    <div className="text-gray-500 text-xs">
                      {formatDollarValue(
                        balances[currency.address] ?? 0n,
                        currency.decimals,
                        prices[currency.address] ?? 0,
                      )}
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </button>
            ))}
          {loadingCurrencies ? (
            <div className="flex items-center justify-center h-16">
              <Image src="/loading.gif" alt="loading" width={50} height={50} />
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  )
}

export default CurrencySelect
