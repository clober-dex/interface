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
import ChainIcon from '../components/icon/chain-icon'
import { textStyles } from '../constants/text-styles'
import { fetchEnsName } from '../apis/ens'
import { CHAIN_CONFIG } from '../chain-configs'
import { PAGE_BUTTONS } from '../chain-configs/page-button'
import useDropdown from '../hooks/useDropdown'
import { PageSelector } from '../components/selector/page-selector'
import { web3AuthInstance } from '../utils/web3auth/instance'
import UserTransactionCard from '../components/card/user-transaction-card'
import { useCurrencyContext } from '../contexts/currency-context'
import { ChainSettingModal } from '../components/modal/chain-setting-modal'

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
  const router = useRouter()
  const { selectedChain } = useChainContext()
  const { data: gasPrice } = useGasPrice()
  const { currencies, setCurrencies, balances, prices, transfer } =
    useCurrencyContext()
  const [showChainSelector, setShowChainSelector] = useState(false)
  const [dismissedTxs, setDismissedTxs] = useState<string[]>([])
  const [hoveredTx, setHoveredTx] = useState<string | null>(null)
  const { chainId, address, status, connector } = useAccount()
  const { openChainModal } = useChainModal()
  const { openConnectModal } = useConnectModal()
  const { disconnectAsync } = useDisconnect()
  const [openTransactionHistoryModal, setOpenTransactionHistoryModal] =
    useState(false)
  const {
    pendingTransactions,
    transactionHistory,
    lastIndexedBlockNumber,
    selectedExplorer,
    setSelectedExplorer,
    selectedRpcEndpoint,
    setSelectedRpcEndpoint,
    rpcEndpointList,
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
      {showChainSelector && selectedExplorer && selectedRpcEndpoint && (
        <ChainSettingModal
          selectedExplorer={selectedExplorer}
          setSelectedExplorer={setSelectedExplorer}
          explorerList={CHAIN_CONFIG.EXPLORER_LIST}
          selectedRpcEndpoint={selectedRpcEndpoint}
          setSelectedRpcEndpoint={setSelectedRpcEndpoint}
          rpcList={rpcEndpointList}
          onClose={() => setShowChainSelector(false)}
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

      <div className="flex items-center bg-gray-800 bg-opacity-50 justify-between h-[46px] md:h-[60px] py-0 px-4">
        <div className="flex items-center gap-2.5 md:gap-12">
          {router.pathname.includes('/futures') ? (
            <a
              className="flex gap-2 items-center"
              target="_blank"
              href={`${CHAIN_CONFIG.URL}/futures`}
              rel="noopener noreferrer"
            >
              <img className="h-7 sm:h-9" src="/futures-logo.svg" alt="logo" />
            </a>
          ) : (
            <>
              <a
                className="hidden md:flex gap-2 items-center h-7"
                target="_blank"
                href={CHAIN_CONFIG.LANDING_PAGE_URL}
                rel="noopener noreferrer"
              >
                <Image
                  width={123}
                  height={28}
                  src="/chain-configs/logo.svg"
                  alt="logo"
                />
              </a>
              <a
                className="flex md:hidden gap-2 items-center h-5"
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
            </>
          )}
          <div className="hidden xl:flex py-1 justify-start items-center gap-8">
            <PageButtons />
          </div>
        </div>

        <div className="flex gap-2 w-auto md:gap-3 ml-auto">
          <div className="flex relative justify-center items-center gap-2">
            <div className="flex items-center justify-center lg:justify-start h-8 w-8 lg:w-auto p-0 lg:px-4 lg:gap-2 rounded bg-gray-800 text-white">
              <ChainIcon className="w-4 h-4" chain={selectedChain} />
              <p className={`hidden lg:block ${textStyles.body3Bold}`}>
                {selectedChain.name}
              </p>
            </div>

            <button
              onClick={() => setShowChainSelector(true)}
              className="w-8 h-8 p-2 bg-gray-800 rounded sm:rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="w-full h-full"
              >
                <path
                  d="M8.3253 2.31736C8.75129 0.561368 11.2489 0.561368 11.6749 2.31736C11.7388 2.58102 11.8647 2.82608 12.0411 3.0322C12.2175 3.23825 12.4399 3.40005 12.6905 3.50388C12.9412 3.60773 13.213 3.65078 13.4835 3.62986C13.7541 3.60888 14.0164 3.52409 14.2481 3.38279C15.7911 2.44304 17.558 4.209 16.6183 5.75291C16.4772 5.98453 16.3921 6.24618 16.3712 6.51658C16.3503 6.78701 16.3934 7.05894 16.4972 7.30955C16.6009 7.56013 16.7629 7.78251 16.9689 7.95896C17.1748 8.13536 17.4193 8.26107 17.6827 8.32517C19.4387 8.75117 19.4387 11.2488 17.6827 11.6748C17.419 11.7387 17.174 11.8646 16.9679 12.041C16.7618 12.2174 16.6 12.4398 16.4962 12.6904C16.3923 12.9411 16.3493 13.2129 16.3702 13.4834C16.3912 13.754 16.476 14.0163 16.6173 14.248C17.557 15.7909 15.791 17.5578 14.2472 16.6181C14.0156 16.4771 13.7539 16.392 13.4835 16.3711C13.2131 16.3501 12.9411 16.3933 12.6905 16.497C12.4399 16.6008 12.2176 16.7627 12.0411 16.9687C11.8647 17.1747 11.739 17.4191 11.6749 17.6826C11.2489 19.4386 8.75129 19.4386 8.3253 17.6826C8.26136 17.4189 8.13552 17.1739 7.95908 16.9678C7.78267 16.7617 7.56027 16.5999 7.30967 16.4961C7.05904 16.3922 6.78718 16.3492 6.5167 16.3701C6.24608 16.3911 5.9838 16.4759 5.75205 16.6172C4.20914 17.557 2.44219 15.791 3.38194 14.247C3.523 14.0155 3.60805 13.7537 3.62901 13.4834C3.64994 13.213 3.60678 12.941 3.50303 12.6904C3.39927 12.4398 3.2373 12.2175 3.03135 12.041C2.82546 11.8646 2.58091 11.7389 2.31748 11.6748C0.56149 11.2488 0.56149 8.75117 2.31748 8.32517C2.58116 8.26123 2.82619 8.13538 3.03233 7.95896C3.23837 7.78255 3.40016 7.56013 3.50401 7.30955C3.60784 7.05892 3.65089 6.78706 3.62998 6.51658C3.609 6.24596 3.52421 5.98368 3.38291 5.75193C2.44304 4.20898 4.20908 2.44195 5.75303 3.38181C6.75293 3.98975 8.04913 3.45213 8.3253 2.31736ZM10.0001 6.99998C8.34325 6.99998 7.0001 8.34313 7.0001 9.99998C7.00013 11.6568 8.34327 13 10.0001 13C11.6569 12.9999 13.0001 11.6568 13.0001 9.99998C13.0001 8.34315 11.6569 7.00001 10.0001 6.99998Z"
                  fill="white"
                />
              </svg>
            </button>
          </div>

          <div className="relative flex items-center flex-row gap-1 sm:gap-3">
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
                className="flex items-center h-8 py-0 px-3 md:px-4 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-800 text-white disabled:text-green-500 text-xs sm:text-sm"
              >
                {status}
              </button>
            )}

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
            className="w-8 h-10 hover:bg-gray-700 rounded sm:rounded-lg flex items-center justify-center"
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
