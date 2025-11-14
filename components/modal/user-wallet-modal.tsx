import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

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
import { formatDollarValue, toUnitString } from '../../utils/bigint'
import { RemoteChainBalances } from '../../model/remote-chain-balances'
import CrossChainBalances from '../cross-chain-balances'
import { CHAIN_CONFIG } from '../../chain-configs'
import { Toggle } from '../toggle'

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
  remoteChainBalances,
  prices,
  gasPrice,
  ens,
  walletIconUrl,
  transactionHistory,
  disconnectAsync,
  onClose,
  onTransfer,
  useRemoteChainBalances,
  setUseRemoteChainBalances,
}: {
  chain: Chain
  userAddress: `0x${string}`
  currencies: Currency[]
  setCurrencies: (currencies: Currency[]) => void
  balances: Balances
  remoteChainBalances?: RemoteChainBalances
  prices: Prices
  useRemoteChainBalances: boolean
  setUseRemoteChainBalances: (value: boolean) => void
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
  const [tab, setTab] = React.useState<'tokens' | 'transactions'>(
    'transactions',
  )
  const [selectedCurrency, setSelectedCurrency] = useState<
    Currency | undefined
  >(undefined)
  const explorerUrl = chain.blockExplorers?.default?.url ?? ''
  const portfolioUSD = useMemo(() => {
    return currencies.reduce((total, currency) => {
      const balance = Number(
        toUnitString(balances[currency.address], currency.decimals),
      )
      const price = prices[currency.address]
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
      remoteChainBalances={remoteChainBalances}
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
        <div className="w-[240px] items-center justify-center flex flex-row gap-1.5 text-white text-sm font-medium">
          <ClipboardSvg />
          Address copied to clipboard
        </div>
      </Toast>

      <div className="absolute left-0 top-[155.5px] sm:top-[188px] w-full flex z-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="480"
          height="2"
          viewBox="0 0 480 2"
          fill="none"
        >
          <path d="M0 1H480" stroke="#272930" />
        </svg>
      </div>

      <div className="flex flex-col max-h-[460px] sm:max-h-[576px]">
        <h1 className="flex font-semibold mb-6 sm:text-xl items-center justify-center w-full">
          My Wallet
        </h1>
        <div className="flex flex-col justify-start items-start gap-6">
          <div className="self-stretch px-4 py-2 sm:py-3 bg-gray-800 rounded-xl flex justify-center items-center gap-[17px] h-full">
            <div className="flex flex-row gap-2 h-full items-center">
              <div className="flex w-6 sm:w-10 h-4 sm:h-6 relative items-center">
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

              <span className="block text-white text-sm sm:text-base font-medium">
                {ens ?? formatAddress(userAddress || '', 6)}
              </span>
            </div>

            <div className="flex flex-row gap-1 ml-auto">
              <button
                onClick={async () => {
                  await handleCopyClipBoard(userAddress)
                  setIsCopyToast(true)
                }}
                className="p-1 sm:p-2 bg-gray-700 rounded-lg flex flex-col items-center justify-center w-6 sm:w-8 h-6 sm:h-8"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                >
                  <rect
                    x="3.85718"
                    y="3.85718"
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
                  className="w-3 h-3 sm:w-4 sm:h-4"
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
                  className="w-3 h-3 sm:w-4 sm:h-4"
                >
                  <path
                    d="M5.42908 14.2072C3.95842 14.2072 2.63256 13.3214 2.06967 11.9627C1.50678 10.604 1.81769 9.04003 2.85745 7.99996L4.40072 6.45669L5.42908 7.48505L3.88654 9.0276C3.33531 9.57882 3.12003 10.3823 3.32179 11.1352C3.52356 11.8882 4.11171 12.4764 4.8647 12.6782C5.6177 12.8799 6.42113 12.6646 6.97236 12.1134L8.5149 10.5709L9.54327 11.6L8.00072 13.1425C7.32005 13.8265 6.39407 14.2099 5.42908 14.2072ZM5.94327 11.085L4.9149 10.0567L10.0574 4.91414L11.0858 5.9425L5.94399 11.0843L5.94327 11.085ZM11.6007 9.5425L10.5716 8.51414L12.1142 6.9716C12.6729 6.42202 12.894 5.61499 12.6933 4.8574C12.4926 4.09981 11.901 3.50807 11.1434 3.30719C10.3859 3.10632 9.57879 3.32717 9.02908 3.88578L7.48581 5.42832L6.45745 4.39996L8.00072 2.85669C9.4226 1.44721 11.7163 1.45223 13.132 2.86792C14.5477 4.28362 14.5527 6.57735 13.1433 7.99923L11.6007 9.54178V9.5425Z"
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
                    y="11.2231"
                    width="1.45454"
                    height="2.90909"
                    transform="rotate(-75 11.9881 11.2231)"
                    fill="#EF4444"
                  />
                  <rect
                    x="5.81818"
                    y="3.53711"
                    width="1.45455"
                    height="2.90909"
                    transform="rotate(165 5.81818 3.53711)"
                    fill="#EF4444"
                  />
                  <rect
                    x="4.0119"
                    y="4.552"
                    width="1.45455"
                    height="2.90909"
                    transform="rotate(105 4.0119 4.552)"
                    fill="#EF4444"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center w-full border-b border-[#2f313d]">
            <div className="flex gap-12 w-full justify-center">
              <button
                onClick={() => setTab('tokens')}
                className={`flex-1 pb-2 text-sm sm:text-base font-medium transition-all duration-150 ${
                  tab === 'tokens'
                    ? 'text-white border-b-2 border-white z-[1]'
                    : 'text-gray-500 border-b-2 border-transparent'
                }`}
              >
                Tokens
              </button>
              <button
                onClick={() => setTab('transactions')}
                className={`flex-1 pb-2 text-sm sm:text-base font-medium transition-all duration-150 ${
                  tab === 'transactions'
                    ? 'text-white border-b-2 border-white z-[1]'
                    : 'text-gray-500 border-b-2 border-transparent'
                }`}
              >
                Transactions
              </button>
            </div>
          </div>
        </div>

        {tab === 'tokens' && (
          <div className="flex flex-col w-full">
            {CHAIN_CONFIG.ENABLE_REMOTE_CHAIN_BALANCES && (
              <div className="self-stretch px-4 py-3.5 bg-[#24272e] rounded-xl inline-flex justify-start items-center mt-4">
                <div className="flex-1 flex justify-start items-center gap-2">
                  <div className="flex-1 inline-flex flex-col justify-center items-start gap-0.5">
                    <div className="justify-start text-white text-sm font-semibold">
                      Use unified balance
                    </div>
                    <div className="justify-start text-[#8d94a1] text-[13px] font-medium">
                      You can use balance across every chain
                    </div>
                  </div>

                  <Toggle
                    disabled={!CHAIN_CONFIG.ENABLE_REMOTE_CHAIN_BALANCES}
                    defaultChecked={useRemoteChainBalances}
                    onChange={() => {
                      setUseRemoteChainBalances(!useRemoteChainBalances)
                    }}
                  />
                </div>
              </div>
            )}

            <div className="sticky top-0 z-10 text-center justify-start text-white text-[28px] font-medium mb-7 mt-[30px]">
              ${formatTinyNumber(portfolioUSD)}
            </div>
          </div>
        )}

        <div className="flex flex-col w-full overflow-y-scroll">
          <AnimatePresence mode="wait">
            {tab === 'tokens' ? (
              <motion.div
                key="tokens"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col w-full"
              >
                <div className="w-full flex flex-col justify-start items-start gap-2">
                  {currencies
                    .filter(
                      (currency) =>
                        Number(
                          toUnitString(
                            balances[currency.address] +
                              (remoteChainBalances?.[currency.address]?.total ??
                                0n),
                            currency.decimals,
                          ),
                        ) *
                          prices[currency.address] >
                        0.01,
                    )
                    .sort((a, b) => {
                      const priceA = prices[a.address]
                      const priceB = prices[b.address]
                      return (
                        Number(
                          toUnitString(
                            balances[b.address] +
                              (remoteChainBalances?.[b.address]?.total ?? 0n),
                            b.decimals,
                          ),
                        ) *
                          priceB -
                        Number(
                          toUnitString(
                            balances[a.address] +
                              (remoteChainBalances?.[a.address]?.total ?? 0n),
                            a.decimals,
                          ),
                        ) *
                          priceA
                      )
                    })
                    .map((currency) => (
                      <div
                        className={`self-stretch ${remoteChainBalances?.[currency.address].total ? 'pt-3' : 'py-3'} bg-gray-800 rounded-xl flex flex-col gap-2 justify-start items-center`}
                        key={currency.address}
                      >
                        <div className="flex flex-row w-full items-center px-4">
                          <div className="flex justify-start items-center gap-2.5">
                            <CurrencyIcon
                              chain={chain}
                              currency={currency}
                              className="w-7 h-7"
                            />
                            <div className="text-nowrap flex-1 flex flex-col justify-center items-start gap-0.5">
                              <div className="w-full overflow-x-scroll text-start justify-start text-white text-sm font-medium">
                                {currency.symbol}
                              </div>
                              <div className="text-center justify-start text-white text-xs font-medium flex flex-row gap-1">
                                {formatWithCommas(
                                  toUnitString(
                                    balances[currency.address] +
                                      (remoteChainBalances?.[currency.address]
                                        ?.total ?? 0n),
                                    currency.decimals,
                                    prices[currency.address],
                                  ),
                                )}
                                <span className="text-[#a9b0bc]">
                                  (~
                                  {formatDollarValue(
                                    balances[currency.address] +
                                      (remoteChainBalances?.[currency.address]
                                        ?.total ?? 0n),
                                    currency.decimals,
                                    prices[currency.address],
                                  )}
                                  )
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedCurrency(currency)
                              setShowTokenTransferModal(true)
                            }}
                            className="h-8 ml-auto px-3 py-2 bg-blue-400/20 rounded-lg inline-flex justify-center items-center gap-2.5 text-blue-400 text-[13px] font-semibold"
                          >
                            Send
                          </button>
                        </div>

                        {remoteChainBalances?.[currency.address].total && (
                          <CrossChainBalances
                            remoteChainBalances={remoteChainBalances}
                            currency={currency}
                            balance={balances[currency.address]}
                            price={prices[currency.address]}
                          />
                        )}
                      </div>
                    ))}
                </div>
              </motion.div>
            ) : tab === 'transactions' ? (
              <motion.div
                key="transactions"
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
                      <div className="flex pt-2 justify-start text-gray-500 text-sm font-semibold">
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
