import React from 'react'

import { Currency } from '../../model/currency'
import { Balances } from '../../model/balances'
import { RemoteChainBalances } from '../../model/remote-chain-balances'
import { Prices } from '../../model/prices'
import { formatDollarValue, toUnitString } from '../../utils/bigint'
import { formatWithCommas } from '../../utils/bignumber'
import CrossChainBalances from '../cross-chain-balances'

import Modal from './modal'

const BalanceSourcesModal = ({
  currency,
  balances,
  remoteChainBalances,
  prices,
  onClose,
}: {
  currency: Currency
  balances: Balances
  remoteChainBalances: RemoteChainBalances
  prices: Prices
  onClose: () => void
}) => {
  return (
    <Modal show onClose={onClose}>
      <div className="flex flex-col w-full h-full gap-6">
        <div className="flex flex-col items-start gap-4 self-stretch">
          <div className="flex flex-col items-start gap-2 sm:gap-4 self-stretch">
            <div className="flex items-start gap-1.5 text-white text-sm sm:text-lg font-semibold leading-tight">
              My Balance Sources
            </div>
            <div className="flex flex-col w-full justify-center items-center text-xl text-white font-semibold">
              {toUnitString(
                balances[currency.address] +
                  remoteChainBalances[currency.address].total,
                currency.decimals,
                prices[currency.address],
                formatWithCommas,
              )}
              <div className="text-gray-500 text-xs">
                {formatDollarValue(
                  balances[currency.address] +
                    remoteChainBalances[currency.address].total,
                  currency.decimals,
                  prices[currency.address],
                )}
              </div>
            </div>
          </div>

          <CrossChainBalances
            remoteChainBalances={remoteChainBalances}
            currency={currency}
            balance={balances[currency.address]}
            price={prices[currency.address]}
          />
        </div>
      </div>
    </Modal>
  )
}

export default BalanceSourcesModal
