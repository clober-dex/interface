import React, { useCallback, useMemo, useState } from 'react'
import { isAddressEqual, parseUnits } from 'viem'
import { Market } from '@clober/v2-sdk'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'

import { SearchSvg } from '../components/svg/search-svg'
import CheckIcon from '../components/icon/check-icon'
import { ActionButton } from '../components/button/action-button'
import { OpenOrderCardList } from '../components/card/open-order/open-order-card-list'
import { useOpenOrderContext } from '../contexts/trade/open-order-context'
import { useLimitContractContext } from '../contexts/trade/limit-contract-context'

export const OpenOrderContainer = ({
  selectedMarket,
}: {
  selectedMarket: Market | undefined
}) => {
  const router = useRouter()
  const { cancels, claims } = useLimitContractContext()
  const { address: userAddress } = useAccount()
  const { openOrders } = useOpenOrderContext()
  const [searchValue, _setSearchValue] = useState('')
  const [searchInCurrentMarket, _setSearchInCurrentMarket] = useState(false)

  const setSearchInCurrentMarket = useCallback((value: boolean) => {
    _setSearchInCurrentMarket(value)
    if (value) {
      _setSearchValue('')
    }
  }, [])

  const setSearchValue = useCallback(
    (value: string) => {
      _setSearchValue(value)
      if (value) {
        setSearchInCurrentMarket(false)
      }
    },
    [setSearchInCurrentMarket],
  )

  const [filteredOpenOrders, claimableOpenOrders, cancellableOpenOrders] =
    useMemo(() => {
      const filteredOpenOrders = openOrders.filter((order) => {
        if (selectedMarket && searchInCurrentMarket) {
          return (
            (isAddressEqual(
              selectedMarket.base.address,
              order.inputCurrency.address,
            ) &&
              isAddressEqual(
                selectedMarket.quote.address,
                order.outputCurrency.address,
              )) ||
            (isAddressEqual(
              selectedMarket.base.address,
              order.outputCurrency.address,
            ) &&
              isAddressEqual(
                selectedMarket.quote.address,
                order.inputCurrency.address,
              ))
          )
        }
        const _searchValue = searchValue.toLowerCase()
        return (
          order.inputCurrency.symbol.toLowerCase().includes(_searchValue) ||
          order.outputCurrency.symbol.toLowerCase().includes(_searchValue) ||
          order.inputCurrency.name.toLowerCase().includes(_searchValue) ||
          order.outputCurrency.name.toLowerCase().includes(_searchValue) ||
          order.inputCurrency.address.toLowerCase().includes(_searchValue) ||
          order.outputCurrency.address.toLowerCase().includes(_searchValue)
        )
      })
      const claimableOpenOrders = filteredOpenOrders.filter(
        ({ claimable }) =>
          parseUnits(claimable.value, claimable.currency.decimals) > 0n,
      )
      const cancellableOpenOrders = filteredOpenOrders.filter(
        ({ cancelable }) =>
          parseUnits(cancelable.value, cancelable.currency.decimals) > 0n,
      )
      return [filteredOpenOrders, claimableOpenOrders, cancellableOpenOrders]
    }, [openOrders, searchInCurrentMarket, searchValue, selectedMarket])

  return (
    <>
      <div className="flex flex-col w-full lg:flex-row gap-4 lg:gap-0 mt-[20px] mb-4 lg:mt-12 text-white">
        <div className="border-b-blue-500 text-[13px] lg:text-base border-solid lg:border-0 flex w-1/2 lg:w-[161px] h-[37px] px-6 lg:px-0 lg:justify-start pt-1.5 pb-2.5 border-b-2 border-[#ffc32d] justify-center items-center gap-2">
          <div className="text-white font-semibold">Open Order</div>
          <div className="flex px-2 py-0.5 lg:h-7 lg:px-2.5 lg:py-0.5 bg-blue-500/20 rounded-[17.02px] flex-col justify-center items-center">
            <div className="text-blue-500 text-[13px] font-semibold">
              {filteredOpenOrders.length}
            </div>
          </div>
        </div>

        <div className="flex flex-row mb-4 gap-5 max-w-[480px] lg:max-w-full lg:ml-auto lg:flex-row-reverse">
          <div className="w-full lg:w-[246px] flex flex-col relative rounded shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <div className="relative h-4 w-4">
                <SearchSvg />
              </div>
            </div>
            <div className="inline-block">
              <div className="invisible h-0 mx-[29px]" aria-hidden="true">
                Search by symbol
              </div>
              <input
                type="search"
                name="open-order-search"
                id="search"
                autoComplete="off"
                className="inline w-full pl-10 py-1.5 lg:py-2.5 text-white bg-transparent rounded-xl border border-solid border-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-400 flex-col placeholder:text-gray-400 text-xs sm:text-sm"
                placeholder="Search tokens"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>
          </div>

          <button className="flex justify-start items-center gap-2">
            <CheckIcon
              checked={searchInCurrentMarket}
              onCheck={setSearchInCurrentMarket}
              text="Current Market"
            />
          </button>
        </div>
      </div>

      {/*pc open order card*/}
      {filteredOpenOrders.length > 0 ? (
        <div className="hidden lg:flex flex-col w-full justify-start items-center gap-4 bg-transparent mb-14">
          <div className="w-full justify-start items-end inline-flex">
            <div className="flex text-gray-50 text-sm font-semibold">
              <div className="flex w-[225px] ml-5">Market</div>
              <div className="flex w-[145px]">Price</div>
              <div className="flex w-[200px]">Amount</div>
              <div className="flex w-[100px]">Filled</div>
              <div className="flex w-[200px]">Claimable</div>
            </div>
            <div className="h-full ml-auto justify-center items-center gap-3 flex">
              <ActionButton
                disabled={claimableOpenOrders.length === 0}
                onClick={async () => {
                  await claims(claimableOpenOrders)
                }}
                text="Claim All"
                className="disabled:text-gray-400 text-white text-[13px] font-semibold w-[110px] h-8 px-3 py-1.5 disabled:bg-[#2b3544] bg-blue-500 rounded-[10px] justify-center items-center flex"
              />
              <ActionButton
                disabled={cancellableOpenOrders.length === 0}
                onClick={async () => {
                  await cancels(cancellableOpenOrders)
                }}
                text="Cancel All"
                className="disabled:text-gray-400 text-white text-[13px] font-semibold w-[110px] h-8 px-3 py-1.5 disabled:bg-[#2b3544] bg-blue-500 rounded-[10px] justify-center items-center flex"
              />
            </div>
          </div>

          {userAddress && (
            <OpenOrderCardList
              userAddress={userAddress}
              openOrders={filteredOpenOrders}
              claims={claims}
              cancels={cancels}
              router={router}
            />
          )}
        </div>
      ) : (
        <></>
      )}

      {/*mobile open order card*/}
      <div className="flex lg:hidden w-full justify-center mb-28 sm:mb-0">
        <div className="flex flex-col w-full lg:w-auto h-full lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredOpenOrders.length > 0 ? (
            <div className="flex ml-auto h-6 opacity-80 justify-start items-center gap-2">
              <button
                disabled={claimableOpenOrders.length === 0}
                onClick={async () => {
                  await claims(claimableOpenOrders)
                }}
                className="flex flex-1 w-[95px] px-3 py-1 disabled:bg-[#2b3544] bg-[#3B82F6]/20 rounded-lg justify-center items-center disabled:text-gray-400 text-[#3B82F6] text-[13px] font-semibold"
              >
                Claim All
              </button>
              <button
                disabled={cancellableOpenOrders.length === 0}
                onClick={async () => {
                  await cancels(cancellableOpenOrders)
                }}
                className="flex flex-1 w-[95px] px-3 py-1 disabled:bg-[#2b3544] bg-[#3B82F6]/20 rounded-lg justify-center items-center disabled:text-gray-400 text-[#3B82F6] text-[13px] font-semibold"
              >
                Cancel All
              </button>
            </div>
          ) : (
            <></>
          )}

          {userAddress && (
            <OpenOrderCardList
              userAddress={userAddress}
              openOrders={filteredOpenOrders}
              claims={claims}
              cancels={cancels}
              router={router}
            />
          )}
        </div>
      </div>
    </>
  )
}
