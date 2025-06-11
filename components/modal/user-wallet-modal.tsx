import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Transaction } from '../../contexts/transaction-context'
import UserTransactionCard from '../card/user-transaction-card'
import { convertTimeAgo } from '../../utils/time'
import { ClipboardSvg } from '../svg/clipboard-svg'
import { Toast } from '../toast'
import { formatAddress, handleCopyClipBoard } from '../../utils/string'
import UserIcon from '../icon/user-icon'
import ChainIcon from '../icon/chain-icon'
import { Chain } from '../../model/chain'
import { Currency } from '../../model/currency'
import { Balances } from '../../model/balances'
import { Prices } from '../../model/prices'
import { CurrencyIcon } from '../icon/currency-icon'
import { formatTinyNumber, formatWithCommas } from '../../utils/bignumber'
import { formatDollarValue, formatUnits } from '../../utils/bigint'

import Modal from './modal'
import { TokenTransferModal } from './token-transfer-modal'

const getTimeAgo = (timestamp: number, cache: Map<string, boolean>) => {
  timestamp = timestamp * 1000
  const todayStartTimestamp = new Date().setHours(0, 0, 0, 0)
  const dayStartTimestamp = new Date(timestamp).setHours(0, 0, 0, 0)
  const result = convertTimeAgo(
    todayStartTimestamp < timestamp ? timestamp : dayStartTimestamp,
  )
  if (cache.has(result)) {
    return ''
  } else {
    if (result.includes('days ago')) {
      cache.set(result, true)
    }
    return result
  }
}

export const UserWalletModal = ({
  chain,
  userAddress,
  currencies,
  setCurrencies,
  balances,
  prices,
  gasPrice,
  ens,
  walletIconUrl,
  transactionHistory,
  disconnectAsync,
  onClose,
  onTransfer,
}: {
  chain: Chain
  userAddress: `0x${string}`
  currencies: Currency[]
  setCurrencies: (currencies: Currency[]) => void
  balances: Balances
  prices: Prices
  gasPrice: bigint | undefined
  ens: string | null
  walletIconUrl: string | null
  transactionHistory: Transaction[]
  disconnectAsync: () => Promise<void>
  onClose: () => void
  onTransfer: (
    currency: Currency,
    amount: bigint,
    recipient: `0x${string}`,
  ) => Promise<void>
}) => {
  const cache = new Map<string, boolean>()
  const [showTokenTransferModal, setShowTokenTransferModal] = useState(false)
  const [isCopyToast, setIsCopyToast] = useState(false)
  const [tab, setTab] = React.useState<'my-tokens' | 'my-transactions'>(
    'my-transactions',
  )
  const [selectedCurrency, setSelectedCurrency] = useState<
    Currency | undefined
  >(undefined)
  const explorerUrl = chain.blockExplorers?.default?.url ?? ''
  const portfolioUSD = useMemo(() => {
    return currencies.reduce((total, currency) => {
      const balance = Number(
        formatUnits(balances[currency.address] ?? 0n, currency.decimals),
      )
      const price = prices[currency.address] ?? 0
      return total + balance * price
    }, 0)
  }, [balances, currencies, prices])

  return showTokenTransferModal ? (
    <TokenTransferModal
      chain={chain}
      explorerUrl={explorerUrl}
      selectedCurrency={selectedCurrency}
      setSelectedCurrency={setSelectedCurrency}
      currencies={currencies}
      setCurrencies={setCurrencies}
      balances={balances}
      prices={prices}
      gasPrice={gasPrice}
      onBack={() => setShowTokenTransferModal(false)}
      onClose={onClose}
      onTransfer={onTransfer}
    />
  ) : (
    <Modal show onClose={onClose}>
      <Toast
        isCopyToast={isCopyToast}
        setIsCopyToast={setIsCopyToast}
        durationInMs={1300}
      >
        <div className="w-[240px] items-center justify-center flex flex-row gap-1.5 text-white text-sm font-semibold">
          <ClipboardSvg />
          Address copied to clipboard
        </div>
      </Toast>

      <div className="flex flex-col max-h-[460px] sm:max-h-[576px]">
        <h1 className="flex font-bold mb-6 sm:text-xl items-center justify-center w-full">
          My Wallet
        </h1>
        <div className="flex flex-col justify-start items-start gap-6">
          <div className="self-stretch px-4 py-2 sm:py-3 bg-gray-800 rounded-xl flex justify-center items-center gap-[17px] h-full">
            <div className="flex flex-row gap-2 h-full items-center">
              <div className="flex w-8 sm:w-10 h-4 sm:h-6 relative items-center">
                {walletIconUrl ? (
                  <img
                    src={walletIconUrl}
                    alt="User Icon"
                    className="w-4 sm:w-6 h-4 sm:h-6 absolute left-0 top-0 z-[2] rounded-full"
                  />
                ) : (
                  <UserIcon
                    className="w-4 sm:w-6 h-4 sm:h-6 absolute left-0 top-0 z-[2] rounded-full aspect-square"
                    address={userAddress}
                  />
                )}
                <ChainIcon
                  chain={chain}
                  className="w-4 sm:w-6 h-4 sm:h-6 absolute left-2 sm:left-4 top-0 z-[1] rounded-full"
                />
              </div>

              <span
                className={`block text-white text-sm sm:text-base font-semibold`}
              >
                {ens ?? formatAddress(userAddress || '', 6)}
              </span>
            </div>

            <div className="flex flex-row gap-1.5 sm:gap-1 ml-auto">
              <button
                onClick={async () => {
                  await handleCopyClipBoard(userAddress)
                  setIsCopyToast(true)
                }}
                className="p-1 sm:p-2 bg-gray-700 rounded-lg flex flex-col items-center justify-center w-6 sm:w-8 h-6 sm:h-8"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="stroke-white w-3 sm:w-4 h-4 sm:h-4"
                >
                  <rect
                    x="3.85715"
                    y="3.85715"
                    width="7.14286"
                    height="7.14286"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M2.42857 8.14286H1V1H8.14286V2.42857"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  window.open(`${explorerUrl}/address/${userAddress}`, '_blank')
                }
                className="p-1 sm:p-2 bg-gray-700 rounded-lg flex flex-col items-center justify-center w-6 sm:w-8 h-6 sm:h-8"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M12 13L3 13L3 4"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeMiterlimit="16"
                    strokeLinecap="square"
                  />
                  <path
                    d="M12 4L7 9"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                  <path
                    d="M9 3L13 3L13 7"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              </button>
              <button
                onClick={disconnectAsync}
                className="p-1 sm:p-2 bg-gray-700 rounded-lg flex flex-col items-center justify-center w-6 sm:w-8 h-6 sm:h-8"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M5.42908 14.2073C3.95842 14.2073 2.63256 13.3214 2.06967 11.9627C1.50678 10.604 1.81769 9.04007 2.85745 8L4.40072 6.45672L5.42908 7.48509L3.88654 9.02763C3.33531 9.57886 3.12003 10.3823 3.32179 11.1353C3.52356 11.8883 4.11171 12.4764 4.8647 12.6782C5.6177 12.88 6.42113 12.6647 6.97236 12.1135L8.5149 10.5709L9.54327 11.6L8.00072 13.1425C7.32005 13.8266 6.39407 14.2099 5.42908 14.2073ZM5.94327 11.0851L4.9149 10.0567L10.0574 4.91418L11.0858 5.94254L5.94399 11.0844L5.94327 11.0851ZM11.6007 9.54254L10.5716 8.51418L12.1142 6.97163C12.6729 6.42206 12.894 5.61503 12.6933 4.85744C12.4926 4.09985 11.901 3.50811 11.1434 3.30723C10.3859 3.10635 9.57879 3.32721 9.02908 3.88582L7.48581 5.42836L6.45745 4.4L8.00072 2.85672C9.4226 1.44725 11.7163 1.45227 13.132 2.86796C14.5477 4.28365 14.5527 6.57739 13.1433 7.99927L11.6007 9.54181V9.54254Z"
                    fill="#EF4444"
                  />
                  <rect
                    x="10.1818"
                    y="12.2381"
                    width="1.45455"
                    height="2.90909"
                    transform="rotate(-15 10.1818 12.2381)"
                    fill="#EF4444"
                  />
                  <rect
                    x="11.9881"
                    y="11.2232"
                    width="1.45454"
                    height="2.90909"
                    transform="rotate(-75 11.9881 11.2232)"
                    fill="#EF4444"
                  />
                  <rect
                    x="5.81818"
                    y="3.53713"
                    width="1.45455"
                    height="2.90909"
                    transform="rotate(165 5.81818 3.53713)"
                    fill="#EF4444"
                  />
                  <rect
                    x="4.0119"
                    y="4.55205"
                    width="1.45455"
                    height="2.90909"
                    transform="rotate(105 4.0119 4.55205)"
                    fill="#EF4444"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center w-full border-b border-[#2f313d]">
            <div className="flex gap-10">
              <button
                onClick={() => setTab('my-tokens')}
                className={`pb-2 text-sm sm:text-base font-semibold transition-all duration-150 ${
                  tab === 'my-tokens'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-500 border-b-2 border-transparent'
                }`}
              >
                My Tokens
              </button>
              <button
                onClick={() => setTab('my-transactions')}
                className={`pb-2 text-sm sm:text-base font-semibold transition-all duration-150 ${
                  tab === 'my-transactions'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-500 border-b-2 border-transparent'
                }`}
              >
                My Transactions
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full overflow-y-scroll">
          <AnimatePresence mode="wait">
            {tab === 'my-tokens' ? (
              <motion.div
                key="my-tokens"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col w-full"
              >
                <div className="text-center justify-start text-white text-[28px] font-semibold mb-6 mt-2">
                  ${formatTinyNumber(portfolioUSD)}
                </div>
                <div className="w-full flex flex-col justify-start items-start gap-2">
                  {currencies
                    .filter(
                      (currency) =>
                        Number(
                          formatUnits(
                            balances[currency.address] ?? 0n,
                            currency.decimals,
                          ),
                        ) *
                          (prices[currency.address] ?? 0) >
                        0.01,
                    )
                    .sort((a, b) => {
                      const priceA = prices[a.address] ?? 0
                      const priceB = prices[b.address] ?? 0
                      return (
                        Number(
                          formatUnits(balances[b.address] ?? 0n, b.decimals),
                        ) *
                          priceB -
                        Number(
                          formatUnits(balances[a.address] ?? 0n, a.decimals),
                        ) *
                          priceA
                      )
                    })
                    .map((currency) => (
                      <div
                        className="self-stretch px-4 py-3 bg-gray-800 rounded-xl flex justify-start items-center"
                        key={currency.address}
                      >
                        <div className="w-60 flex justify-start items-center gap-3">
                          <CurrencyIcon chain={chain} currency={currency} />
                          <div className="text-nowrap flex-1 flex flex-col justify-center items-start gap-0.5">
                            <div className="w-[200px] max-w-[200px] overflow-x-scroll text-start justify-start text-white text-sm font-semibold">
                              {currency.symbol}
                            </div>
                            <div className="text-center justify-start text-[#a8afbc] text-xs font-semibold">
                              $
                              {formatTinyNumber(
                                prices[currency.address] ?? 0,
                              )}{' '}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center items-start gap-1">
                          <div className="text-center justify-start text-white text-sm font-semibold">
                            {formatWithCommas(
                              formatUnits(
                                balances[currency.address] ?? 0n,
                                currency.decimals,
                                prices[currency.address] ?? 0,
                              ),
                            )}
                          </div>
                          <div className="text-center justify-start text-[#a9b0bc] text-xs font-semibold">
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
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCurrency(currency)
                            setShowTokenTransferModal(true)
                          }}
                          className="px-3 py-2 bg-blue-400/20 rounded-lg flex justify-center items-center gap-2.5"
                        >
                          <div className="justify-start text-blue-300 text-[13px] font-semibold">
                            Send
                          </div>
                        </button>
                      </div>
                    ))}
                </div>
              </motion.div>
            ) : tab === 'my-transactions' ? (
              <motion.div
                key="my-transactions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col w-full gap-2 sm:gap-3"
              >
                {transactionHistory
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((transaction) => (
                    <div
                      className="flex flex-col w-full border-t border-[#2f313d] border-solid"
                      key={transaction.txHash}
                    >
                      <div className="flex pt-2 justify-start text-gray-500 text-sm font-bold">
                        {getTimeAgo(transaction.timestamp, cache)}
                      </div>
                      <UserTransactionCard
                        transaction={transaction}
                        key={transaction.txHash}
                        isPending={false}
                      />
                    </div>
                  ))}
              </motion.div>
            ) : (
              <></>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  )
}
