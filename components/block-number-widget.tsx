import React from 'react'

import { textStyles } from '../constants/text-styles'
export const BlockNumberWidget = ({
  latestBlockNumber,
}: {
  latestBlockNumber: number
}) => {
  return (
    <>
      <div
        className={`flex bg-gray-950 items-center fixed right-2 bottom-1 sm:bottom-2 h-[1.125rem] py-0 px-2 gap-1 rounded-2xl text-gray-400 ${textStyles.body5}`}
      >
        {latestBlockNumber || 'syncing'}
        <div
          className={`${
            latestBlockNumber ? 'bg-[#45D87F7f]' : 'bg-[#FFC6357f]'
          } rounded-lg w-1 h-1 animate-ping`}
        />
      </div>
    </>
  )
}
