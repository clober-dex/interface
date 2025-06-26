import React, { useState } from 'react'
import { parseUnits } from 'viem'

import { Chain } from '../../model/chain'
import LpCurrencyAmountInput from '../input/lp-currency-amount-input'
import { ActionButton } from '../button/action-button'
import { PoolContractContext } from '../../contexts/pool/pool-contract-context'
import { PoolSnapshot } from '../../model/pool'

import Modal from './modal'

export const LpWrapModal = ({
  chain,
  lpBalance,
  poolSnapshot,
  onClose,
  onWrap,
}: {
  chain: Chain
  lpBalance: bigint
  poolSnapshot: PoolSnapshot
  onClose: () => void
  onWrap: PoolContractContext['wrap']
}) => {
  const [amount, setAmount] = useState<string>('')

  return (
    <Modal show onClose={onClose}>
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-col h-full max-h-[460px] sm:max-h-[576px]">
          <h1 className="flex font-bold mb-6 sm:text-xl items-center justify-center w-full">
            Wrap LP Token
          </h1>

          <div className="flex flex-col justify-start items-end gap-5">
            <div className="flex flex-col w-full gap-2.5 sm:gap-3 self-stretch items-start">
              <LpCurrencyAmountInput
                chain={chain}
                currency={{
                  ...poolSnapshot.lpCurrency,
                  symbol: 'LP Token',
                }}
                currency0={poolSnapshot.currencyA}
                currency1={poolSnapshot.currencyB}
                value={amount}
                onValueChange={setAmount}
                availableAmount={lpBalance}
                onCurrencyClick={undefined}
                price={Number(poolSnapshot.lpPriceUSD)}
              />
            </div>

            <div className="flex flex-col w-full gap-2.5 sm:gap-3 self-stretch items-start">
              <LpCurrencyAmountInput
                chain={chain}
                currency={{
                  ...poolSnapshot.lpCurrency,
                  symbol: 'LP Token (ERC20)',
                }}
                currency0={poolSnapshot.currencyA}
                currency1={poolSnapshot.currencyB}
                value={amount}
                onValueChange={setAmount}
                availableAmount={0n}
                onCurrencyClick={undefined}
                price={Number(poolSnapshot.lpPriceUSD)}
                disabled={true}
              />
            </div>
          </div>

          <div className="flex flex-col mt-9">
            <ActionButton
              disabled={
                Number(amount) <= 0 ||
                lpBalance < parseUnits(amount, poolSnapshot.lpCurrency.decimals)
              }
              text={
                Number(amount) <= 0
                  ? 'Enter Amount'
                  : lpBalance <
                      parseUnits(amount, poolSnapshot.lpCurrency.decimals)
                    ? 'Insufficient LP Balance'
                    : `Wrap LP Token`
              }
              onClick={async () => {
                await onWrap(
                  poolSnapshot.currencyA,
                  poolSnapshot.currencyB,
                  poolSnapshot.salt,
                  amount,
                  Number(poolSnapshot.lpPriceUSD),
                )
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
