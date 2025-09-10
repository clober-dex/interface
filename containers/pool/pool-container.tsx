import React, { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { Tooltip } from 'react-tooltip'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'

import { usePoolContext } from '../../contexts/pool/pool-context'
import { useChainContext } from '../../contexts/chain-context'
import { QuestionMarkSvg } from '../../components/svg/question-mark-svg'
import { useCurrencyContext } from '../../contexts/currency-context'
import { Loading } from '../../components/loading'
import { LpPositionCard } from '../../components/card/pool/lp-position-card'
import { PoolSnapshotCard } from '../../components/card/pool/pool-snapshot-card'
import { fetchPoolSnapshots } from '../../apis/pool'
import { CHAIN_CONFIG } from '../../chain-configs'
import { formatWithCommas } from '../../utils/bignumber'
import { WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES } from '../../chain-configs/pool'
import { usePoolContractContext } from '../../contexts/pool/pool-contract-context'
import { Toast } from '../../components/toast'
import { ClipboardSvg } from '../../components/svg/clipboard-svg'

export const PoolContainer = () => {
  const router = useRouter()
  const { address: userAddress } = useAccount()
  const { lpBalances } = usePoolContext()
  const { selectedChain } = useChainContext()
  const { prices, balances } = useCurrencyContext()
  const { wrap, unwrap } = usePoolContractContext()
  const [isCopyToast, setIsCopyToast] = useState(false)

  const [tab, setTab] = React.useState<'my-liquidity' | 'pool'>('pool')

  const { data: poolSnapshots } = useQuery({
    queryKey: [
      'pool-snapshots',
      selectedChain.id,
      Object.keys(prices).length !== 0,
    ],
    queryFn: async () => {
      return fetchPoolSnapshots(selectedChain)
    },
    initialData: [],
  })

  const [totalTvl, total24hVolume] = React.useMemo(() => {
    const totalTvl = poolSnapshots.reduce(
      (acc, poolSnapshot) => acc + Number(poolSnapshot.totalTvlUSD),
      0,
    )
    const total24hVolume = poolSnapshots.reduce(
      (acc, { performanceHistories }) =>
        acc +
        Number(
          performanceHistories.sort((a, b) => b.timestamp - a.timestamp)?.[0]
            ?.volumeUSD ?? 0,
        ),
      0,
    )
    return [totalTvl, total24hVolume]
  }, [poolSnapshots])

  const hasLpBalance = useMemo(() => {
    if (!userAddress) {
      return false
    }
    const totalLpBalance = Object.entries(lpBalances).reduce(
      (acc, [, amount]) => acc + amount,
      0n,
    )
    const totalWrappedLpBalance =
      WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES.reduce(
        (acc, { wrappedLpCurrency }) =>
          wrappedLpCurrency && balances[wrappedLpCurrency.address]
            ? acc + BigInt(balances[wrappedLpCurrency.address])
            : acc,
        0n,
      )
    return totalLpBalance + totalWrappedLpBalance > 0n
  }, [lpBalances, userAddress, balances])

  return (
    <div className="w-full flex flex-col text-white mb-4 pr-4 pl-4 md:pl-0 gap-5 lg:gap-[40px]">
      <Toast
        isCopyToast={isCopyToast}
        setIsCopyToast={setIsCopyToast}
        durationInMs={1300}
      >
        <div className="w-[240px] items-center justify-center flex flex-row gap-1.5 text-white text-sm font-semibold">
          <ClipboardSvg />
          Address copied to clipboard
        </div>
      </Toast>

      <div className="flex justify-center lg:justify-start w-full h-full">
        <div className="mt-8 sm:mt-16 flex flex-col items-center w-full lg:w-fit">
          <div className="flex w-full h-12 sm:h-[72px] flex-col justify-start items-center gap-2 sm:gap-3">
            <div className="self-stretch text-center text-white text-lg sm:text-4xl font-bold">
              {CHAIN_CONFIG.DEX_NAME} Liquidity Vault (
              {CHAIN_CONFIG.DEX_NAME.slice(0, 1)}LV)
            </div>
            <div className="self-stretch text-center text-gray-400 text-xs sm:text-sm font-bold">
              Provide liquidity and earn fees!
            </div>
          </div>
          <div className="flex w-full h-full mt-6 sm:mt-0 justify-start items-center gap-3 sm:gap-4 mb-11 lg:mb-0">
            <div className="md:w-[300px] outline outline-1 outline-offset-[-1px] outline-[#272930] flex-1 w-full h-full p-4 lg:p-6 bg-[#16181d] rounded-2xl flex-col gap-2.5 inline-flex">
              <div className="text-[#8d94a1] text-xs lg:text-sm font-medium">
                TVL
              </div>
              <div className="self-stretch text-white text-lg lg:text-2xl font-medium flex flex-row gap-1">
                <span className="text-[#8d94a1]">$</span>
                {formatWithCommas(totalTvl.toFixed(2))}
              </div>
            </div>
            <div className="md:w-[300px] outline outline-1 outline-offset-[-1px] outline-[#272930] flex-1 w-full h-full p-4 lg:p-6 bg-[#16181d] rounded-2xl flex-col gap-2.5 inline-flex">
              <div className="text-[#8d94a1] text-xs lg:text-sm font-medium">
                24h Volume
              </div>
              <div className="self-stretch text-white text-lg lg:text-2xl font-medium flex flex-row gap-1">
                <span className="text-[#8d94a1]">$</span>
                {formatWithCommas(total24hVolume.toFixed(2))}
              </div>
            </div>
          </div>

          <div className="bg-[#191d25] rounded-[22px] py-1 w-full max-w-[248px] h-10 flex sm:hidden flex-row relative text-blue-300 text-base font-semibold">
            <button
              onClick={() => setTab('pool')}
              disabled={tab === 'pool'}
              className="text-sm flex flex-1 px-[15px] py-1.5 h-full rounded-[20px] text-[#8d94a1] disabled:text-blue-300 disabled:bg-blue-500/40 justify-center items-center gap-1"
            >
              {CHAIN_CONFIG.DEX_NAME.slice(0, 1)}LV
            </button>
            <button
              onClick={() =>
                userAddress && hasLpBalance && setTab('my-liquidity')
              }
              disabled={tab === 'my-liquidity'}
              className="text-sm flex flex-1 px-[15px] py-1.5 h-full rounded-[20px] text-[#8d94a1] disabled:text-blue-300 disabled:bg-blue-500/40 justify-center items-center gap-1"
            >
              My Vaults
            </button>
          </div>

          <div className="w-full sm:max-w-[324px] items-center justify-center hidden sm:flex lg:hidden bg-[#191d25] py-1 h-10 sm:h-12 flex-row relative text-[#8d94a1] text-base font-semibold rounded-3xl">
            <button
              onClick={() => setTab('pool')}
              disabled={tab === 'pool'}
              className="flex flex-1 px-6 py-2 rounded-[18px] text-gray-400 disabled:text-white disabled:bg-blue-500 justify-center items-center gap-1"
            >
              {CHAIN_CONFIG.DEX_NAME.slice(0, 1)}LV
            </button>
            <button
              onClick={() =>
                userAddress && hasLpBalance && setTab('my-liquidity')
              }
              disabled={tab === 'my-liquidity'}
              className="flex flex-1 px-6 py-2 rounded-[18px] text-gray-400 disabled:text-white disabled:bg-blue-500 justify-center items-center gap-1"
            >
              My Vaults
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full lg:w-[1200px] h-full">
        <div className="hidden lg:flex flex-col w-full bg-[#17181e] border border-[#2d2d2e] outline outline-1 outline-offset-[-1px] outline-[#272930] rounded-t-[20px] rounded-b-none">
          <div className="w-full flex justify-start h-[56px] items-center">
            <button
              onClick={() => setTab('pool')}
              disabled={tab === 'pool'}
              className="w-40 justify-start text-[#8d94a1] text-base font-semibold leading-tight relative disabled:text-[#65a7ff] disabled:after:absolute disabled:after:-bottom-4 disabled:after:left-0 disabled:after:w-full disabled:after:h-0.5 disabled:after:bg-[#65a7ff]"
            >
              {CHAIN_CONFIG.DEX_NAME.slice(0, 1)}LV
            </button>
            <button
              onClick={() =>
                userAddress && hasLpBalance && setTab('my-liquidity')
              }
              disabled={tab === 'my-liquidity'}
              className={`w-40 justify-start text-[#8d94a1] text-base font-semibold leading-tight relative disabled:text-[#65a7ff] disabled:after:absolute disabled:after:-bottom-4 disabled:after:left-0 disabled:after:w-full disabled:after:h-0.5 disabled:after:bg-[#65a7ff] ${hasLpBalance ? '' : 'cursor-not-allowed'}`}
            >
              My Vaults
            </button>
          </div>
        </div>

        {tab === 'pool' ? (
          <>
            <div className="text-[#8d94a1] text-sm font-medium hidden lg:flex w-[1200px] py-2.5 px-4 justify-start items-center gap-4 z-[1] h-10 bg-[#222223] border-b border-[#2d2d2e] lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
              <div className="w-[335px] text-gray-400 text-sm font-semibold">
                Liquidity Vault
              </div>
              <div className="flex flex-row gap-2 w-[130px] text-gray-400 text-sm font-semibold">
                APY
                <div className="flex mr-auto justify-center items-center">
                  <QuestionMarkSvg
                    data-tooltip-id="apy-info"
                    data-tooltip-place="bottom-end"
                    data-tooltip-html={'Annualized Return'}
                    className="w-3 h-3"
                  />
                  <Tooltip
                    id="apy-info"
                    className="max-w-[300px] bg-gray-950 !opacity-100 z-[100]"
                    clickable
                  />
                </div>
              </div>
              <div className="w-[130px] text-gray-400 text-sm font-semibold">
                Total Liquidity
              </div>
              <div className="w-[140px] text-gray-400 text-sm font-semibold">
                24h Volume
              </div>
            </div>

            {poolSnapshots.length === 0 && (
              <Loading className="mt-36 sm:mt-48" />
            )}

            {poolSnapshots.length > 0 && (
              <div className="relative flex justify-center w-full h-full lg:h-[660px] lg:bg-[#17181e] lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
                <div className="lg:absolute lg:top-0 lg:overflow-x-scroll w-full h-full items-center flex flex-1 flex-col md:grid md:grid-cols-2 lg:flex gap-3 lg:gap-0">
                  {poolSnapshots.map((poolSnapshot) => (
                    <PoolSnapshotCard
                      chain={selectedChain}
                      key={`pool-snapshot-${poolSnapshot.key}`}
                      poolKey={poolSnapshot.key}
                      currencyA={poolSnapshot.currencyA}
                      currencyB={poolSnapshot.currencyB}
                      apy={poolSnapshot.apy}
                      tvl={Number(poolSnapshot.totalTvlUSD)}
                      volume24h={Number(poolSnapshot.volumeUSD24h)}
                      router={router}
                      setIsCopyToast={setIsCopyToast}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : tab === 'my-liquidity' ? (
          <>
            <div className="text-[#8d94a1] text-sm font-medium hidden lg:flex w-[1200px] py-2.5 px-4 justify-start items-center gap-4 z-[1] h-10 bg-[#222223] border-b border-[#2d2d2e] lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
              <div className="w-[335px] text-gray-400 text-sm font-semibold">
                Liquidity Vault
              </div>
              <div className="flex flex-row gap-2 w-[130px] text-gray-400 text-sm font-semibold">
                Balance
              </div>
              <div className="w-[130px] text-gray-400 text-sm font-semibold">
                LP Price
              </div>
              <div className="w-[140px] text-gray-400 text-sm font-semibold">
                USD Value
              </div>
            </div>

            <div className="relative flex justify-center w-full h-full lg:h-[660px] lg:bg-[#17181e] lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930]">
              <div className="lg:absolute lg:top-0 lg:overflow-x-scroll w-full h-full items-center flex flex-1 flex-col md:grid md:grid-cols-2 lg:flex gap-3 lg:gap-0">
                {Object.entries(lpBalances).flatMap(([poolKey, amount]) => {
                  const poolSnapshot = poolSnapshots.find(
                    ({ key }) => key === poolKey,
                  )
                  if (!poolSnapshot) {
                    return <></>
                  }
                  const wrappedLpCurrency =
                    WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES.find(
                      ({ poolKey: key }) => key === poolKey,
                    )?.wrappedLpCurrency
                  return [
                    amount > 0n && (
                      <LpPositionCard
                        amount={amount}
                        chain={selectedChain}
                        key={`lp-position-${poolKey}`}
                        poolSnapshot={poolSnapshot}
                        isERC20={false}
                        router={router}
                        onWrap={wrap}
                        onUnwrap={unwrap}
                        setIsCopyToast={setIsCopyToast}
                      />
                    ),
                    wrappedLpCurrency &&
                      balances[wrappedLpCurrency.address] > 0n && (
                        <LpPositionCard
                          amount={balances[wrappedLpCurrency.address]}
                          chain={selectedChain}
                          key={`wlp-position-${poolKey}`}
                          poolSnapshot={poolSnapshot}
                          isERC20={true}
                          router={router}
                          onWrap={wrap}
                          onUnwrap={unwrap}
                          setIsCopyToast={setIsCopyToast}
                        />
                      ),
                  ]
                })}
              </div>
            </div>
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  )
}
