import { CHAIN_IDS, OpenOrder } from '@clober/v2-sdk'
import { isAddressEqual, parseUnits } from 'viem'
import React from 'react'
import { NextRouter } from 'next/router'

import { OpenOrderCard } from './open-order-card'

export const OpenOrderCardList = ({
  chainId,
  userAddress,
  openOrders,
  claims,
  cancels,
  router,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  openOrders: OpenOrder[]
  claims: (openOrders: OpenOrder[]) => Promise<void>
  cancels: (openOrders: OpenOrder[]) => Promise<void>
  router: NextRouter
}) => {
  return (
    <div className="flex lg:block flex-col gap-2 lg:gap-0 lg:max-h-[356px] lg:overflow-y-scroll">
      {openOrders.map((openOrder, index) => (
        <OpenOrderCard
          chainId={chainId}
          openOrder={openOrder}
          key={index}
          router={router}
          claimActionButtonProps={{
            disabled:
              !isAddressEqual(openOrder.user, userAddress) ||
              parseUnits(
                openOrder.claimable.value,
                openOrder.claimable.currency.decimals,
              ) === 0n,
            onClick: async () => {
              await claims([openOrder])
            },
            text: 'Claim',
          }}
          cancelActionButtonProps={{
            disabled:
              !isAddressEqual(openOrder.user, userAddress) ||
              parseUnits(
                openOrder.cancelable.value,
                openOrder.cancelable.currency.decimals,
              ) === 0n,
            onClick: async () => {
              await cancels([openOrder])
            },
            text: 'Cancel',
          }}
        />
      ))}
    </div>
  )
}
