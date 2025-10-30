import React from 'react'

import { Currency } from '../../model/currency'
import { Balances } from '../../model/balances'
import { RemoteChainBalances } from '../../model/remote-chain-balances'
import { Prices } from '../../model/prices'
import { formatDollarValue, toUnitString } from '../../utils/bigint'
import { formatWithCommas } from '../../utils/bignumber'
import ChainIcon from '../icon/chain-icon'
import { Chain } from '../../model/chain'

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

          <div className="w-full px-3 sm:p-4 bg-gray-800 rounded-xl flex-col justify-center items-start gap-2 flex">
            {Object.entries(remoteChainBalances).map(
              ([address, remoteChainBalance]) => {
                if (remoteChainBalance.total === 0n) {
                  return null
                }
                return (
                  <div
                    key={address}
                    className="flex flex-col w-full items-start gap-2"
                  >
                    <div className="text-sm text-white font-semibold">
                      {currency.symbol} on other chains
                    </div>
                    {remoteChainBalance.breakdown.map((balanceInfo) => (
                      <div
                        key={balanceInfo.chain.id}
                        className="flex flex-row w-full justify-between items-center"
                      >
                        <div className="flex flex-row gap-2 text-white text-sm items-center">
                          <ChainIcon
                            chain={
                              {
                                id: balanceInfo.chain.id,
                                name: balanceInfo.chain.name,
                                icon: balanceInfo.chain.logo,
                              } as Chain
                            }
                            className="inline-block w-6 h-6"
                          />
                          {balanceInfo.chain.name}
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm text-white font-medium">
                            {toUnitString(
                              balanceInfo.balance,
                              currency.decimals,
                              undefined,
                              formatWithCommas,
                            )}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {formatDollarValue(
                              balanceInfo.balance,
                              currency.decimals,
                              prices[currency.address],
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default BalanceSourcesModal
