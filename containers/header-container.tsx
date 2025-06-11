import React, { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useRouter } from 'next/router'
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'

import { useChainContext } from '../contexts/chain-context'
import MenuSvg from '../components/svg/menu-svg'
import { PageButton } from '../components/button/page-button'
import { ConnectButton } from '../components/button/connect-button'
import { UserButton } from '../components/button/user-button'
import { UserTransactionsModal } from '../components/modal/user-transactions-modal'
import { useTransactionContext } from '../contexts/transaction-context'
import ChainIcon from '../components/icon/chain-icon'
import { textStyles } from '../constants/text-styles'
import { fetchEnsName } from '../apis/ens'
import { CHAIN_CONFIG } from '../chain-configs'
import { PAGE_BUTTONS } from '../chain-configs/page-button'
import useDropdown from '../hooks/useDropdown'
import { PageSelector } from '../components/selector/page-selector'
import { web3AuthInstance } from '../utils/web3auth/instance'

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
  const { chainId, address, status, connector } = useAccount()
  const { openChainModal } = useChainModal()
  const { openConnectModal } = useConnectModal()
  const { disconnectAsync } = useDisconnect()
  const [openTransactionHistoryModal, setOpenTransactionHistoryModal] =
    useState(false)
  const { pendingTransactions, transactionHistory } = useTransactionContext()

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
      {openTransactionHistoryModal && address && connector && (
        <UserTransactionsModal
          chain={selectedChain}
          userAddress={address}
          walletIconUrl={connector?.icon ?? web3AuthData?.profileImage ?? ''}
          pendingTransactions={pendingTransactions}
          transactionHistory={transactionHistory}
          disconnectAsync={disconnectAsync}
          onClose={() => setOpenTransactionHistoryModal(false)}
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
        <div className="flex gap-2 w-auto md:gap-4 ml-auto">
          <div className="flex relative justify-center items-center">
            <div className="flex items-center justify-center lg:justify-start h-8 w-8 lg:w-auto p-0 lg:px-4 lg:gap-2 rounded bg-gray-800 text-white">
              <ChainIcon className="w-4 h-4" chain={selectedChain} />
              <p className={`hidden lg:block ${textStyles.body3Bold}`}>
                {selectedChain.name}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-row gap-1 sm:gap-3">
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
          </div>
          <button
            className="w-8 h-8 hover:bg-gray-700 rounded sm:rounded-lg flex items-center justify-center"
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
