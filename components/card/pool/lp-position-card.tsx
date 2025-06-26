import React from 'react'
import { NextRouter } from 'next/router'

import { CurrencyIcon } from '../../icon/currency-icon'
import { formatDollarValue, formatUnits } from '../../../utils/bigint'
import { Chain } from '../../../model/chain'
import { formatWithCommas } from '../../../utils/bignumber'
import { LpWrapModal } from '../../modal/lp-wrap-modal'
import { PoolContractContext } from '../../../contexts/pool/pool-contract-context'
import { PoolSnapshot } from '../../../model/pool'
import { LpUnwrapModal } from '../../modal/lp-unwrap-modal'

export const LpPositionCard = ({
  chain,
  poolSnapshot,
  amount,
  isERC20,
  onWrap,
  onUnwrap,
  router,
}: {
  chain: Chain
  poolSnapshot: PoolSnapshot
  amount: bigint
  isERC20: boolean
  router: NextRouter
  onWrap: PoolContractContext['wrap']
  onUnwrap: PoolContractContext['unwrap']
}) => {
  const [showWrapOrUnwrapModal, setShowWrapOrUnwrapModal] =
    React.useState(false)

  return (
    <>
      {showWrapOrUnwrapModal &&
        (!isERC20 ? (
          <LpWrapModal
            chain={chain}
            lpBalance={amount}
            poolSnapshot={poolSnapshot}
            onClose={() => setShowWrapOrUnwrapModal(false)}
            onWrap={onWrap}
          />
        ) : (
          <LpUnwrapModal
            chain={chain}
            lpBalance={amount}
            poolSnapshot={poolSnapshot}
            onClose={() => setShowWrapOrUnwrapModal(false)}
            onUnwrap={onUnwrap}
          />
        ))}

      <div className="hidden lg:flex w-full h-[204px] p-3 bg-gray-800 rounded-2xl flex-col justify-center items-center gap-6">
        <div className="flex flex-col items-center gap-4 self-stretch">
          <div className="flex justify-center items-center gap-2 self-stretch">
            <div className="w-14 h-8 relative">
              <CurrencyIcon
                chain={chain}
                currency={poolSnapshot.currencyA}
                className="w-8 h-8 absolute left-0 top-0 z-[1] rounded-full"
              />
              <CurrencyIcon
                chain={chain}
                currency={poolSnapshot.currencyB}
                className="w-8 h-8 absolute left-6 top-0 rounded-full"
              />
            </div>
            <div className="flex gap-1 items-center text-white text-sm sm:text-base font-bold text-nowrap">
              {isERC20
                ? `${poolSnapshot.lpCurrency.symbol} (ERC20)`
                : `${poolSnapshot.lpCurrency.symbol}`}
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <div className="text-gray-400 text-sm">LP in wallet</div>
            <div className="justify-center items-center gap-1 flex">
              <div className="text-right text-white text-base">
                {formatWithCommas(
                  formatUnits(
                    amount,
                    poolSnapshot.lpCurrency.decimals,
                    Number(poolSnapshot.lpPriceUSD),
                  ),
                )}
              </div>
              <div className="text-center text-gray-400 text-sm font-semibold">
                (
                {formatDollarValue(
                  amount,
                  poolSnapshot.lpCurrency.decimals,
                  Number(poolSnapshot.lpPriceUSD),
                )}
                )
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-row gap-2 justify-center items-center">
          {!isERC20 && (
            <div className="flex flex-1 self-stretch h-8 px-3 py-2 rounded-lg border-2 border-blue-500 border-solid justify-center items-center gap-1">
              <button
                onClick={() => router.push(`/earn/${poolSnapshot.key}`)}
                className="grow shrink basis-0 opacity-90 text-center text-blue-500 text-sm font-bold"
              >
                Remove Liquidity
              </button>
            </div>
          )}

          <div className="flex flex-1 self-stretch h-8 px-3 py-2 rounded-lg border-2 border-blue-500 border-solid justify-center items-center gap-1">
            <button
              onClick={() => setShowWrapOrUnwrapModal(true)}
              className="grow shrink basis-0 opacity-90 text-center text-blue-500 text-sm font-bold"
            >
              {isERC20 ? 'Unwrap' : 'Wrap'}
            </button>
          </div>
        </div>
      </div>
      <div className="flex lg:hidden w-full h-[164px] p-4 bg-gray-800 rounded-xl flex-col justify-center items-start gap-4">
        <div className="flex items-center gap-2 self-stretch">
          <div className="w-10 h-6 relative">
            <CurrencyIcon
              chain={chain}
              currency={poolSnapshot.currencyA}
              className="w-6 h-6 absolute left-0 top-0 z-[1]"
            />
            <CurrencyIcon
              chain={chain}
              currency={poolSnapshot.currencyB}
              className="w-6 h-6 absolute left-[16px] top-0"
            />
          </div>
          <div className="flex gap-1 items-center text-white text-sm sm:text-base font-bold text-nowrap">
            {isERC20
              ? `${poolSnapshot.lpCurrency.symbol} (ERC20)`
              : `${poolSnapshot.lpCurrency.symbol}`}
          </div>
        </div>
        <div className="flex flex-col justify-center items-start gap-2 h-11">
          <div className="self-stretch text-gray-400 text-xs font-medium">
            LP in wallet
          </div>
          <div className="justify-start items-center gap-1 sm:gap-2 flex">
            <div className="text-white text-sm font-bold">
              {formatWithCommas(
                formatUnits(
                  amount,
                  poolSnapshot.lpCurrency.decimals,
                  Number(poolSnapshot.lpPriceUSD),
                ),
              )}
            </div>
            <div className="text-gray-400 text-xs font-semibold">
              (
              {formatDollarValue(
                amount,
                poolSnapshot.lpCurrency.decimals,
                Number(poolSnapshot.lpPriceUSD),
              )}
              )
            </div>
          </div>
        </div>

        <div className="flex w-full flex-row gap-2 justify-center items-center">
          {!isERC20 && (
            <div className="flex flex-1 self-stretch h-7 px-2 py-1 rounded-lg border border-solid border-blue-500 justify-center items-center gap-1">
              <button
                onClick={() => router.push(`/earn/${poolSnapshot.key}`)}
                className="grow shrink basis-0 opacity-90 text-center text-blue-500 text-xs font-bold"
              >
                Remove Liquidity
              </button>
            </div>
          )}

          <div className="flex flex-1 self-stretch h-7 px-3 py-2 rounded-lg border border-solid border-blue-500 justify-center items-center gap-1">
            <button
              onClick={() => setShowWrapOrUnwrapModal(true)}
              className="grow shrink basis-0 opacity-90 text-center text-blue-500 text-xs font-bold"
            >
              {isERC20 ? 'Unwrap' : 'Wrap'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
