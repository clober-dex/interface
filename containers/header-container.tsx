import React, { useState } from 'react'
import { useAccount, useDisconnect, useGasPrice } from 'wagmi'
import { useRouter } from 'next/router'
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'

import { useChainContext } from '../contexts/chain-context'
import MenuSvg from '../components/svg/menu-svg'
import { PageButton } from '../components/button/page-button'
import { ConnectButton } from '../components/button/connect-button'
import { UserButton } from '../components/button/user-button'
import { UserWalletModal } from '../components/modal/user-wallet-modal'
import { useTransactionContext } from '../contexts/transaction-context'
import { fetchEnsName } from '../apis/ens'
import { CHAIN_CONFIG } from '../chain-configs'
import { PAGE_BUTTONS } from '../chain-configs/page-button'
import useDropdown from '../hooks/useDropdown'
import { PageSelector } from '../components/selector/page-selector'
import { web3AuthInstance } from '../utils/web3auth/instance'
import UserTransactionCard from '../components/card/user-transaction-card'
import { useCurrencyContext } from '../contexts/currency-context'
import { TransactionSettingModal } from '../components/modal/transaction-setting-modal'

const TX_NOTIFICATION_BUFFER = 5

const WrongNetwork = ({
  openChainModal,
}: { openChainModal: () => void } & any) => {
  return <>{openChainModal && openChainModal()}</>
}

const PageButtons = () => {
  const router = useRouter()
  const { showDropdown, setShowDropdown } = useDropdown()
  const isMoreSelected = PAGE_BUTTONS.filter((page) => page.isHiddenMenu).some(
    (page) => router.pathname.includes(page.path),
  )

  return (
    <>
      {PAGE_BUTTONS.filter((page) => !page.isHiddenMenu).map((page) => (
        <div key={page.path}>
          <PageButton
            disabled={router.pathname.includes(page.path)}
            onClick={() => router.push(page.path)}
          >
            {page.icon}
            {page.label}
          </PageButton>
        </div>
      ))}

      {PAGE_BUTTONS.filter((page) => page.isHiddenMenu).length > 0 && (
        <button
          className="flex flex-row gap-2 items-center text-gray-500 font-semibold disabled:text-white stroke-gray-500 fill-gray-500 disabled:stroke-blue-500 disabled:fill-blue-500"
          disabled={false}
          onClick={() => {
            setShowDropdown((prev) => !prev)
          }}
        >
          <span className={isMoreSelected ? 'text-white' : ''}>More</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            className="rotate-180"
          >
            <path
              d="M9 5L5 1L1 5"
              stroke={isMoreSelected ? '#60A5FA' : '#9CA3AF'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="relative">
            {showDropdown ? <PageSelector /> : <></>}
          </div>
        </button>
      )}
    </>
  )
}

const HeaderContainer = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { data: gasPrice } = useGasPrice()
  const { selectedChain } = useChainContext()
  const { currencies, setCurrencies, balances, prices, transfer } =
    useCurrencyContext()
  const [dismissedTxs, setDismissedTxs] = useState<string[]>([])
  const [hoveredTx, setHoveredTx] = useState<string | null>(null)
  const { chainId, address, status, connector } = useAccount()
  const { openChainModal } = useChainModal()
  const { openConnectModal } = useConnectModal()
  const { disconnectAsync } = useDisconnect()
  const [openTransactionHistoryModal, setOpenTransactionHistoryModal] =
    useState(false)
  const [openTransactionSettingModal, setOpenTransactionSettingModal] =
    useState(false)
  const {
    pendingTransactions,
    transactionHistory,
    lastIndexedBlockNumber,
    gasPriceMultiplier,
    setGasPriceMultiplier,
    selectedExecutorName,
    setSelectedExecutorName,
  } = useTransactionContext()

  const { data: ens } = useQuery({
    queryKey: ['ens', selectedChain.id, address],
    queryFn: async () => {
      if (!address) {
        return null
      }
      return fetchEnsName(selectedChain, address)
    },
    initialData: null,
  })

  const { data: web3AuthData } = useQuery({
    queryKey: ['web3auth', selectedChain.id, address],
    queryFn: async () => {
      if (!web3AuthInstance) {
        return null
      }
      return web3AuthInstance.getUserInfo()
    },
    initialData: null,
  })

  return (
    <>
      {openTransactionSettingModal && gasPrice && (
        <TransactionSettingModal
          selectedExecutorName={selectedExecutorName}
          setSelectedExecutorName={setSelectedExecutorName}
          gasPriceMultiplier={gasPriceMultiplier}
          setGasPriceMultiplier={setGasPriceMultiplier}
          currentGasPrice={gasPrice}
          onClose={() => setOpenTransactionSettingModal(false)}
        />
      )}

      {openTransactionHistoryModal && address && connector && (
        <UserWalletModal
          chain={selectedChain}
          userAddress={address}
          currencies={currencies}
          setCurrencies={setCurrencies}
          balances={balances}
          prices={prices}
          gasPrice={gasPrice}
          walletIconUrl={connector?.icon ?? web3AuthData?.profileImage ?? ''}
          transactionHistory={transactionHistory}
          disconnectAsync={disconnectAsync}
          onClose={() => setOpenTransactionHistoryModal(false)}
          onTransfer={transfer}
          ens={ens}
        />
      )}

      <div className="z-[2] flex items-center bg-[#696c72]/10 backdrop-blur-blur sm:bg-[#151517] sm:border-b sm:border-[#2d2d2e] sm:border-solid justify-between h-12 sm:h-[60px] py-2 sm:py-0 p-4 sm:pl-4 sm:pr-5">
        <div className="flex items-center gap-2.5 sm:gap-12">
          <a
            className="hidden sm:flex gap-2 items-center h-7"
            target="_blank"
            href={CHAIN_CONFIG.LANDING_PAGE_URL}
            rel="noopener noreferrer"
          >
            <Image
              width={114}
              height={25}
              src="/chain-configs/logo.svg"
              alt="logo"
            />
          </a>
          <a
            className="flex sm:hidden gap-2 items-center h-5"
            target="_blank"
            href={CHAIN_CONFIG.LANDING_PAGE_URL}
            rel="noopener noreferrer"
          >
            <Image
              width={88}
              height={20}
              src="/chain-configs/logo.svg"
              alt="logo"
            />
          </a>
          <div className="hidden xl:flex py-1 justify-start items-center gap-8">
            <PageButtons />
          </div>
        </div>
        <div className="flex gap-1 w-auto sm:gap-2 ml-auto h-[30px] sm:h-9">
          <div className="relative flex items-center flex-row gap-1 sm:gap-2">
            {status === 'disconnected' || status === 'connecting' ? (
              <ConnectButton openConnectModal={openConnectModal} />
            ) : address && connector && chainId ? (
              <UserButton
                chain={selectedChain}
                address={address}
                openTransactionHistoryModal={() =>
                  setOpenTransactionHistoryModal(true)
                }
                walletIconUrl={
                  connector?.icon ?? web3AuthData?.profileImage ?? ''
                }
                shiny={pendingTransactions.length > 0}
                ens={ens}
              />
            ) : openChainModal ? (
              <WrongNetwork openChainModal={openChainModal} />
            ) : (
              <button
                disabled={true}
                className="flex items-center h-8 py-0 px-3 sm:px-4 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-800 text-white disabled:text-green-500 text-xs sm:text-sm"
              >
                {status}
              </button>
            )}

            <button
              onClick={() => setOpenTransactionSettingModal(true)}
              className="w-[30px] h-[30px] sm:w-9 sm:h-9 p-1.5 sm:p-2.5 bg-[#2b2c30] rounded sm:rounded-[10px] flex items-center justify-center hover:bg-gray-700 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <g clipPath="url(#clip0_1_4844)">
                  <path
                    d="M6.66028 1.8536C7.00108 0.448804 8.99917 0.448804 9.33997 1.8536C9.39112 2.06458 9.49081 2.26093 9.63196 2.42586C9.77316 2.59084 9.95186 2.7197 10.1525 2.80282C10.3531 2.88591 10.5708 2.92019 10.7872 2.9034C11.0036 2.88657 11.2133 2.81912 11.3986 2.70614C12.6329 1.95452 14.046 3.36752 13.2941 4.60262C13.1814 4.78778 13.1136 4.99686 13.0968 5.21297C13.0801 5.42932 13.1144 5.64725 13.1974 5.84774C13.2804 6.04816 13.4106 6.22613 13.5753 6.36727C13.74 6.50828 13.9359 6.609 14.1466 6.66024C15.5509 7.00132 15.5509 8.99894 14.1466 9.33993C13.9357 9.39103 13.7393 9.49086 13.5743 9.63192C13.4094 9.77311 13.2795 9.95182 13.1964 10.1524C13.1134 10.353 13.0791 10.5708 13.0958 10.7872C13.1127 11.0036 13.1801 11.2132 13.2931 11.3985C14.045 12.6329 12.6328 14.046 11.3976 13.294C11.2123 13.1811 11.0026 13.1135 10.7863 13.0968C10.5701 13.0801 10.3528 13.1144 10.1525 13.1973C9.95199 13.2804 9.77412 13.4105 9.63294 13.5753C9.49182 13.74 9.39123 13.9358 9.33997 14.1466C8.99899 15.5509 7.00136 15.5508 6.66028 14.1466C6.60916 13.9356 6.50848 13.7393 6.36732 13.5743C6.22617 13.4094 6.04831 13.2795 5.84778 13.1964C5.64723 13.1133 5.42946 13.079 5.21302 13.0958C4.99664 13.1126 4.78702 13.1801 4.60169 13.2931C3.36737 14.045 1.95351 12.6327 2.70521 11.3975C2.81809 11.2122 2.88573 11.0026 2.90247 10.7862C2.91919 10.57 2.88485 10.3528 2.80189 10.1524C2.7189 9.95201 2.58965 9.77405 2.42493 9.6329C2.26018 9.49175 2.06444 9.39121 1.85364 9.33993C0.44885 8.99913 0.44885 7.00104 1.85364 6.66024C2.06467 6.6091 2.26094 6.50845 2.42591 6.36727C2.59067 6.2262 2.71978 6.0481 2.80286 5.84774C2.88596 5.64717 2.92021 5.42943 2.90345 5.21297C2.88667 4.99651 2.81919 4.78702 2.70618 4.60165C1.95419 3.36725 3.36747 1.95316 4.60267 2.70516C5.40263 3.19141 6.43948 2.76151 6.66028 1.8536ZM8.00013 5.59969C6.67465 5.59969 5.59974 6.67461 5.59974 8.00008C5.59987 9.32545 6.67473 10.3995 8.00013 10.3995C9.32541 10.3994 10.3994 9.32536 10.3995 8.00008C10.3995 6.67469 9.32549 5.59983 8.00013 5.59969Z"
                    fill="#8D94A1"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_1_4844">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </button>

            <div className="absolute top-12 sm:top-14 -right-4 w-[300px] sm:w-[368px] z-10 border-[#2f313d] border-solid flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {[
                  ...pendingTransactions.map((transaction) => ({
                    ...transaction,
                    isPending: true,
                  })),
                  ...transactionHistory.map((transaction) => ({
                    ...transaction,
                    isPending: false,
                  })),
                ]
                  .filter(
                    (transaction) =>
                      !dismissedTxs.includes(transaction.txHash) &&
                      lastIndexedBlockNumber > 0 &&
                      ((transaction?.blockNumber ?? 0) +
                        TX_NOTIFICATION_BUFFER >=
                        lastIndexedBlockNumber ||
                        transaction.isPending),
                  )
                  // filter unique transactions by txHash
                  .filter(
                    (value, index, self) =>
                      index ===
                      self.findIndex((t) => t.txHash === value.txHash),
                  )
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((transaction) => (
                    <motion.div
                      key={transaction.txHash}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.25 }}
                      onMouseEnter={() => setHoveredTx(transaction.txHash)}
                      onMouseLeave={() => setHoveredTx(null)}
                      className="relative flex flex-col w-full bg-[#171b24] px-4 py-1 rounded-2xl border border-white border-opacity-10 hover:border-opacity-20 border-solid cursor-pointer transition-all duration-200"
                    >
                      {hoveredTx === transaction.txHash && (
                        <button
                          onClick={() =>
                            setDismissedTxs((prev) => [
                              ...prev,
                              transaction.txHash,
                            ])
                          }
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center hover:bg-gray-600 transition duration-200"
                        >
                          ×
                        </button>
                      )}
                      <UserTransactionCard
                        transaction={transaction}
                        isPending={transaction.isPending}
                      />
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
          <button
            className="sm:w-9 sm:h-9 p-1.5 sm:p-2.5 rounded sm:rounded-[10px] flex items-center justify-center hover:bg-gray-700 cursor-pointer"
            onClick={onMenuClick}
          >
            <MenuSvg />
          </button>
        </div>
      </div>
    </>
  )
}

export default HeaderContainer
