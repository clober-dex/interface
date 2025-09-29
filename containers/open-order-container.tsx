import React, { useCallback, useMemo, useState } from 'react'
import { isAddressEqual, parseUnits } from 'viem'
import { CHAIN_IDS, Market } from '@clober/v2-sdk'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'

import { SearchSvg } from '../components/svg/search-svg'
import { ActionButton } from '../components/button/action-button'
import { OpenOrderCardList } from '../components/card/open-order/open-order-card-list'
import { useOpenOrderContext } from '../contexts/trade/open-order-context'
import { useLimitContractContext } from '../contexts/trade/limit-contract-context'
import { Toggle } from '../components/toggle'

export const OpenOrderContainer = ({
  chainId,
  selectedMarket,
}: {
  chainId: CHAIN_IDS
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
      {/*pc open order card*/}
      <div className="hidden xl:flex flex-col w-full max-w-[1176px] bg-[#17181e] border border-[#2d2d2e] outline outline-1 outline-offset-[-1px] outline-[#272930] rounded-t-[20px] rounded-b-none mb-4">
        <div className="flex flex-row w-full h-[58px]">
          <div className="w-[180px] h-full relative">
            <div className="flex flex-row gap-1.5 absolute left-[27px] top-[18px] justify-center items-center">
              <div className="text-blue-400 text-base font-medium">
                Open Orders
              </div>
              <div className="px-2 py-[3px] bg-blue-500/25 rounded-[17.02px] flex flex-col text-blue-400 text-sm font-semibold">
                {filteredOpenOrders.length}
              </div>
            </div>

            <div className="absolute bottom-0 w-[180px] h-0.5 bg-blue-400" />
          </div>

          <div className="flex flex-row gap-4 items-center w-auto ml-auto">
            <div className="flex justify-start items-center gap-2">
              <div className="justify-start text-[#8d94a1] text-sm font-medium leading-tight">
                Current Market
              </div>
              <Toggle
                disabled={false}
                defaultChecked={false}
                onChange={() => {
                  setSearchInCurrentMarket(!searchInCurrentMarket)
                }}
              />
            </div>

            <div className="flex flex-col relative rounded-[10px] shadow-sm bg-[#24272e] outline outline-1 outline-offset-[-1px] outline-[#39393b] mr-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center p-3">
                <div className="relative h-4 w-4">
                  <SearchSvg />
                </div>
              </div>
              <div className="inline-block">
                <div className="invisible h-0 mx-[29px]" aria-hidden="true">
                  Search open orders
                </div>
                <input
                  // ref={inputRef}
                  type="search"
                  name="open-order-search"
                  id="search"
                  autoComplete="off"
                  className="w-60 h-8 placeholder:text-[#8c94a1] placeholder:text-[13px] placeholder:justify-center placeholder:font-normal focus:outline-none focus-visible:outline-none focus:ring-1 focus:rounded-[10px] focus:ring-gray-400 inline rounded-md border-0 pl-9 py-2 bg-[#24272e] text-xs sm:text-sm text-white"
                  placeholder="Search open orders"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-11 w-full justify-start items-center flex bg-[#222223] border border-[#2d2d2e] outline outline-1 outline-offset-[-1px] outline-[#272930]">
          <div className="flex text-[#8d94a1] text-sm font-medium">
            <div className="flex w-[220px] ml-5">Market</div>
            <div className="flex w-[135px]">Price</div>
            <div className="flex w-[200px]">Amount</div>
            <div className="flex w-[105px]">Filled</div>
            <div className="flex w-[200px]">Claimable</div>
          </div>
          <div className="h-full ml-auto justify-center items-center gap-4 flex mr-4">
            <ActionButton
              disabled={claimableOpenOrders.length === 0}
              onClick={async () => {
                await claims(claimableOpenOrders)
              }}
              text="Claim all"
              className="disabled:text-gray-400 disabled:bg-[#2b3544] w-[99px] h-8 px-3 py-2 bg-blue-400/25 rounded-[10px] inline-flex justify-center items-center gap-1 flex-1 opacity-90 text-center text-blue-300 text-sm font-medium leading-tight"
            />
            <ActionButton
              disabled={cancellableOpenOrders.length === 0}
              onClick={async () => {
                await cancels(cancellableOpenOrders)
              }}
              text="Cancel all"
              className="disabled:text-gray-400 disabled:bg-[#2b3544] w-[99px] h-8 px-3 py-2 bg-blue-400/25 rounded-[10px] inline-flex justify-center items-center gap-1 flex-1 opacity-90 text-center text-blue-300 text-sm font-medium leading-tight"
            />
          </div>
        </div>

        {filteredOpenOrders.length > 0 && userAddress && (
          <OpenOrderCardList
            chainId={chainId}
            userAddress={userAddress}
            openOrders={filteredOpenOrders}
            claims={claims}
            cancels={cancels}
            router={router}
          />
        )}
      </div>

      {/*mobile open order card*/}
      <div className="flex flex-col gap-4 xl:hidden w-full justify-center mb-28 md:mb-0 bg-[#17181e] rounded-2xl">
        <div className="flex flex-col gap-3">
          <div className="flex w-full h-[37px] relative mt-[5px]">
            <div className="relative flex-1 px-6 pt-1.5 pb-2.5 border-b-2 border-blue-400 inline-flex justify-center items-center gap-2">
              <div className="justify-start text-blue-400 text-[13px] font-semibold leading-tight">
                Open Order
              </div>
              <div className="px-2 py-0.5 bg-blue-500/25 rounded-[17.02px] inline-flex flex-col justify-center items-center">
                <div className="flex text-blue-400 text-[13px] font-medium">
                  {filteredOpenOrders.length}
                </div>
              </div>

              <div className="absolute w-full left-0 -bottom-0.5 h-0.5 bg-blue-400" />
            </div>

            <div className="relative flex-1 px-6 pt-1.5 pb-2.5 border-b-2 border-blue-400 inline-flex justify-center items-center gap-2" />
          </div>

          <div className="flex px-3 items-center justify-end gap-2 w-full">
            <div className="justify-start text-[#8d94a1] text-sm font-medium leading-tight">
              Current Market
            </div>
            <Toggle
              disabled={false}
              defaultChecked={false}
              onChange={() => {
                setSearchInCurrentMarket(!searchInCurrentMarket)
              }}
            />
          </div>
        </div>

        <div className="mx-3 flex flex-col relative rounded-[10px] shadow-sm bg-[#24272e] outline outline-1 outline-offset-[-1px] outline-[#39393b]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center p-3">
            <div className="relative h-4 w-4">
              <SearchSvg />
            </div>
          </div>
          <div className="inline-block">
            <div className="invisible h-0 mx-[29px]" aria-hidden="true">
              Search open orders
            </div>
            <input
              // ref={inputRef}
              type="search"
              name="open-order-search"
              id="search"
              autoComplete="off"
              className="w-full h-8 placeholder:text-[#8c94a1] placeholder:text-[13px] placeholder:justify-center placeholder:font-normal focus:outline-none focus-visible:outline-none focus:ring-1 focus:rounded-[10px] focus:ring-gray-400 inline rounded-md border-0 pl-9 py-2 bg-[#24272e] text-xs sm:text-sm text-white"
              placeholder="Search open orders"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
        </div>

        <div className="w-full px-3 opacity-80 inline-flex justify-start items-center gap-2">
          <div className="flex-1 h-7 px-3 py-1 bg-blue-500/25 rounded-lg flex justify-center items-center">
            <button
              disabled={claimableOpenOrders.length === 0}
              onClick={async () => {
                await claims(claimableOpenOrders)
              }}
              className="justify-start text-blue-400 text-[13px] font-semibold leading-none"
            >
              Claim all
            </button>
          </div>
          <div className="flex-1 h-7 px-3 py-1 bg-[#2b3544] rounded-lg flex justify-center items-center">
            <button
              disabled={cancellableOpenOrders.length === 0}
              onClick={async () => {
                await cancels(cancellableOpenOrders)
              }}
              className="justify-start text-gray-400 text-[13px] font-semibold leading-none"
            >
              Cancel all
            </button>
          </div>
        </div>

        <div className="flex flex-col px-3 w-full xl:w-auto h-full xl:grid xl:grid-cols-3 gap-4 sm:gap-6">
          {userAddress && (
            <OpenOrderCardList
              chainId={chainId}
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
