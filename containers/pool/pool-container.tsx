import React from 'react'
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

export const PoolContainer = () => {
  const router = useRouter()
  const { address: userAddress } = useAccount()
  const { lpBalances } = usePoolContext()
  const { selectedChain } = useChainContext()
  const { prices, balances } = useCurrencyContext()
  const { wrap, unwrap } = usePoolContractContext()

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

  return (
    <div className="w-full flex flex-col text-white mb-4 pr-4 pl-4 md:pl-0">
      {/*<div className="flex justify-center w-auto sm:h-[400px]">*/}
      {/*  <div className="w-[960px] mt-8 sm:mt-16 flex flex-col sm:gap-12 items-center">*/}
      {/*    <div className="flex w-full h-12 sm:h-[72px] flex-col justify-start items-center gap-2 sm:gap-3">*/}
      {/*      <div className="self-stretch text-center text-white text-lg sm:text-4xl font-bold">*/}
      {/*        {CHAIN_CONFIG.DEX_NAME} Liquidity Vault (*/}
      {/*        {CHAIN_CONFIG.DEX_NAME.slice(0, 1)}LV)*/}
      {/*      </div>*/}
      {/*      <div className="self-stretch text-center text-gray-400 text-xs sm:text-sm font-bold">*/}
      {/*        Provide liquidity and earn fees!*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*    <div className="flex w-full h-20 mt-6 sm:mt-0 sm:h-28 px-4 justify-start items-center gap-3 sm:gap-4">*/}
      {/*      <div className="grow shrink basis-0 h-full px-6 py-4 sm:px-8 sm:py-6 bg-[rgba(96,165,250,0.10)] rounded-xl sm:rounded-2xl flex-col justify-center items-center gap-3 inline-flex bg-gray-800">*/}
      {/*        <div className="text-center text-gray-400 text-sm font-semibold">*/}
      {/*          TVL*/}
      {/*        </div>*/}
      {/*        <div className="self-stretch text-center text-white text-lg sm:text-2xl font-bold">*/}
      {/*          ${formatWithCommas(totalTvl.toFixed(2))}*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      <div className="grow shrink basis-0 h-full px-6 py-4 sm:px-8 sm:py-6 bg-[rgba(96,165,250,0.10)] rounded-xl sm:rounded-2xl flex-col justify-center items-center gap-3 inline-flex bg-gray-800">*/}
      {/*        <div className="text-center text-gray-400 text-sm font-semibold">*/}
      {/*          24h Volume*/}
      {/*        </div>*/}
      {/*        <div className="self-stretch text-center text-white text-lg sm:text-2xl font-bold">*/}
      {/*          ${formatWithCommas(total24hVolume.toFixed(2))}*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*    <div className="flex w-full mt-8 sm:mt-0 sm:mr-auto px-4">*/}
      {/*      <div className="w-full sm:w-[378px] h-[40px] sm:h-[56px] items-center flex">*/}
      {/*        <button*/}
      {/*          onClick={() => setTab('pool')}*/}
      {/*          disabled={tab === 'pool'}*/}
      {/*          className="flex flex-1 gap-2 items-center justify-center w-full h-full text-gray-500 disabled:text-white disabled:bg-gray-800 bg-transparent rounded-tl-2xl rounded-tr-2xl"*/}
      {/*        >*/}
      {/*          <div className="text-center text-sm sm:text-base font-bold">*/}
      {/*            CLV*/}
      {/*          </div>*/}
      {/*        </button>*/}

      {/*        <button*/}
      {/*          onClick={() =>*/}
      {/*            userAddress &&*/}
      {/*            Object.entries(lpBalances).reduce(*/}
      {/*              (acc, [, amount]) => acc + amount,*/}
      {/*              0n,*/}
      {/*            ) +*/}
      {/*              WHITELISTED_POOL_KEY_AND_WRAPPED_CURRENCIES.reduce(*/}
      {/*                (acc, { wrappedLpCurrency }) =>*/}
      {/*                  wrappedLpCurrency && balances[wrappedLpCurrency.address]*/}
      {/*                    ? acc + BigInt(balances[wrappedLpCurrency.address])*/}
      {/*                    : acc,*/}
      {/*                0n,*/}
      {/*              ) >*/}
      {/*              0n &&*/}
      {/*            setTab('my-liquidity')*/}
      {/*          }*/}
      {/*          disabled={tab === 'my-liquidity'}*/}
      {/*          className="flex flex-1 gap-2 items-center justify-center w-full h-full text-gray-500 disabled:text-white disabled:bg-gray-800 bg-transparent rounded-tl-2xl rounded-tr-2xl"*/}
      {/*        >*/}
      {/*          <div className="text-center text-sm sm:text-base font-bold">*/}
      {/*            My Vaults*/}
      {/*          </div>*/}
      {/*        </button>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</div>*/}

      <div className="flex flex-col w-full lg:w-[1060px] h-full">
        {tab === 'pool' ? (
          <>
            <div className="text-[#8d94a1] text-sm font-medium hidden lg:flex w-[1060px] py-2.5 px-4 justify-start items-center gap-4 z-[1] h-10 bg-[#222223] border-b border-[#2d2d2e] lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-[#272930] lg:rounded-tl-lg lg:rounded-tr-lg">
              <div className="w-72 text-gray-400 text-sm font-semibold">
                Liquidity Vault
              </div>
              <div className="flex flex-row gap-2 w-[120px] text-gray-400 text-sm font-semibold">
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
              <div className="w-[120px] text-gray-400 text-sm font-semibold">
                Total Liquidity
              </div>
              <div className="w-[140px] text-gray-400 text-sm font-semibold">
                24h Volume
              </div>
            </div>

            {poolSnapshots.length === 0 && (
              <Loading className="flex mt-8 sm:mt-0" />
            )}

            <div className="relative flex justify-center w-full h-full lg:h-[660px]">
              <div className="lg:absolute lg:top-0 lg:overflow-x-scroll w-full h-full items-center flex flex-1 flex-col md:grid md:grid-cols-2 lg:flex gap-3">
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
                  />
                ))}
              </div>
            </div>
          </>
        ) : tab === 'my-liquidity' ? (
          <div className="w-full h-full items-center flex flex-1 flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-[18px]">
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
                    />
                  ),
              ]
            })}
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  )
}
