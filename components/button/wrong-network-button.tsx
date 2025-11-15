import React from 'react'

import { TriangleDownRedSvg } from '../svg/triangle-down-red-svg'

export const WrongNetworkButton = ({
  openChainModal,
}: {
  openChainModal: () => void
}) => {
  return (
    <button
      className="flex items-center font-bold h-8 py-0 px-3 md:px-4 rounded bg-gray-100 text-white disabled:text-gray-500 text-xs sm:text-sm"
      onClick={() => openChainModal && openChainModal()}
    >
      <span className="text-red-500 inline-block">
        <span className="hidden sm:inline">Wrong</span> Network
      </span>
      <TriangleDownRedSvg />
    </button>
  )
}
