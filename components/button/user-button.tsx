import React from 'react'

import { formatAddress } from '../../utils/string'
import ChainIcon from '../icon/chain-icon'
import UserIcon from '../icon/user-icon'
import { Chain } from '../../model/chain'

export const UserButton = ({
  chain,
  address,
  walletIconUrl,
  openTransactionHistoryModal,
  shiny,
  ens,
}: {
  chain: Chain
  address: `0x${string}`
  walletIconUrl: string | null
  openTransactionHistoryModal: () => void
  shiny?: boolean
  ens: string | null
}) => {
  return (
    <button
      className={`group-hover:bg-gray-700 group relative p-0.5 rounded-xl transition duration-300 overflow-hidden flex items-center justify-center ${shiny ? 'before:opacity-100' : 'before:opacity-0'} before:absolute before:w-1/2 before:pb-[120%] sm:before:pb-[110%] before:bg-[linear-gradient(90deg,_theme(colors.blue.500/0)_0%,_theme(colors.blue.500)_35%,_theme(colors.blue.500)_50%,_theme(colors.blue.500)_65%,_theme(colors.blue.500/0)_100%)] before:animate-[spin_3s_linear_infinite]`}
      onClick={() =>
        openTransactionHistoryModal && openTransactionHistoryModal()
      }
    >
      <span className="relative whitespace-nowrap">
        <span className="z-10 transition-opacity ease-in-out flex items-center justify-center gap-1.5 md:justify-start rounded md:rounded-xl md:w-full p-1.5 sm:p-2 md:p-2.5 cursor-pointer h-[30px] sm:h-9 bg-[#2b2c30] group-hover:bg-gray-700">
          <div className="w-6 h-4 relative">
            {walletIconUrl ? (
              <img
                src={walletIconUrl}
                alt="user-icon"
                className="w-4 h-4 absolute left-0 top-0 z-[2] rounded-xl"
              />
            ) : (
              <UserIcon
                className="w-4 h-4 absolute left-0 top-0 z-[2] rounded-xl aspect-square"
                address={address}
              />
            )}
            <ChainIcon
              chain={chain}
              className="w-4 h-4 absolute left-2 top-0 z-[1] rounded-xl"
            />
          </div>

          <span className="hidden md:block text-white text-[13px] font-semibold md:text-sm md:font-medium">
            {ens ?? formatAddress(address)}
          </span>
        </span>
        <span
          className="absolute inset-0 rounded z-10 inline-flex items-center whitespace-nowrap overflow-hidden opacity-0 transition-opacity duration-500 before:bg-clip-text before:text-transparent after:bg-clip-text after:text-transparent before:px-2 after:px-2 before:animate-infinite-scroll after:animate-infinite-scroll"
          aria-hidden="true"
        />
      </span>
    </button>
  )
}
