import React, { useCallback, useMemo, useState } from 'react'
import { isAddressEqual, parseUnits } from 'viem'
import { CHAIN_IDS, Market } from '@clober/v2-sdk'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'

import { SearchSvg } from '../components/svg/search-svg'
import CheckIcon from '../components/icon/check-icon'
import { ActionButton } from '../components/button/action-button'
import { OpenOrderCardList } from '../components/card/open-order/open-order-card-list'
import { useOpenOrderContext } from '../contexts/trade/open-order-context'
import { useLimitContractContext } from '../contexts/trade/limit-contract-context'

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
      {/*<div className="flex flex-col w-full lg:flex-row gap-4 lg:gap-0 mt-[20px] mb-4 lg:mt-12 text-white">*/}
      {/*  <div className="border-b-blue-500 text-[13px] lg:text-base border-solid lg:border-0 flex w-1/2 lg:w-[161px] h-[37px] px-6 lg:px-0 lg:justify-start pt-1.5 pb-2.5 border-b-2 border-[#ffc32d] justify-center items-center gap-2">*/}
      {/*    <div className="text-white font-semibold">Open Order</div>*/}
      {/*    <div className="flex px-2 py-0.5 lg:h-7 lg:px-2.5 lg:py-0.5 bg-blue-500/20 rounded-[17.02px] flex-col justify-center items-center">*/}
      {/*      <div className="text-blue-500 text-[13px] font-semibold">*/}
      {/*        {filteredOpenOrders.length}*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}

      {/*  <div className="flex flex-row mb-4 gap-5 max-w-[480px] lg:max-w-full lg:ml-auto lg:flex-row-reverse">*/}
      {/*    <div className="w-full lg:w-[246px] flex flex-col relative rounded shadow-sm">*/}
      {/*      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">*/}
      {/*        <div className="relative h-4 w-4">*/}
      {/*          <SearchSvg />*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      <div className="inline-block">*/}
      {/*        <div className="invisible h-0 mx-[29px]" aria-hidden="true">*/}
      {/*          Search by symbol*/}
      {/*        </div>*/}
      {/*        <input*/}
      {/*          type="search"*/}
      {/*          name="open-order-search"*/}
      {/*          id="search"*/}
      {/*          autoComplete="off"*/}
      {/*          className="inline w-full pl-10 py-1.5 lg:py-2.5 text-white bg-transparent rounded-xl border border-solid border-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-400 flex-col placeholder:text-gray-400 text-xs sm:text-sm"*/}
      {/*          placeholder="Search tokens"*/}
      {/*          value={searchValue}*/}
      {/*          onChange={(event) => setSearchValue(event.target.value)}*/}
      {/*        />*/}
      {/*      </div>*/}
      {/*    </div>*/}

      {/*    <button className="flex justify-start items-center gap-2">*/}
      {/*      <CheckIcon*/}
      {/*        checked={searchInCurrentMarket}*/}
      {/*        onCheck={setSearchInCurrentMarket}*/}
      {/*        text="Current Market"*/}
      {/*      />*/}
      {/*    </button>*/}
      {/*  </div>*/}
      {/*</div>*/}

      {/*pc open order card*/}
      <div className="hidden lg:flex flex-col w-full max-w-[1176px] bg-[#17181e] border border-[#2d2d2e] outline outline-1 outline-offset-[-1px] outline-[#272930] rounded-t-[20px] rounded-b-none">
        <div className="flex flex-row w-full h-[58px]">
          <div className="w-[180px] h-full relative">
            <div className="flex flex-row gap-1.5 absolute left-[27px] top-[18px] justify-center items-center">
              <div className="text-[#65a7ff] text-base font-semibold leading-tight">
                Open Orders
              </div>
              <div className="px-2 py-[3px] bg-blue-500/25 rounded-[17.02px] flex flex-col text-blue-400 text-sm font-semibold">
                {filteredOpenOrders.length}
              </div>
            </div>

            <div className="absolute bottom-0 w-[180px] h-0.5 bg-[#65a7ff]" />
          </div>

          <div className="flex flex-row gap-4 items-center w-auto ml-auto">
            <div>1</div>
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
            <div className="flex w-[145px]">Price</div>
            <div className="flex w-[205px]">Amount</div>
            <div className="flex w-[100px]">Filled</div>
            <div className="flex w-[200px]">Claimable</div>
          </div>
          <div className="h-full ml-auto justify-center items-center gap-4 flex mr-4">
            <ActionButton
              disabled={claimableOpenOrders.length === 0}
              onClick={async () => {
                await claims(claimableOpenOrders)
              }}
              text="Claim all"
              className="disabled:text-gray-400 disabled:bg-[#2b3544] w-[99px] h-8 px-3 py-2 bg-[#367fff]/25 rounded-[10px] inline-flex justify-center items-center gap-1 flex-1 opacity-90 text-center text-[#86c0ff] text-sm font-medium leading-tight"
            />
            <ActionButton
              disabled={cancellableOpenOrders.length === 0}
              onClick={async () => {
                await cancels(cancellableOpenOrders)
              }}
              text="Cancel all"
              className="disabled:text-gray-400 disabled:bg-[#2b3544] w-[99px] h-8 px-3 py-2 bg-[#367fff]/25 rounded-[10px] inline-flex justify-center items-center gap-1 flex-1 opacity-90 text-center text-[#86c0ff] text-sm font-medium leading-tight"
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
