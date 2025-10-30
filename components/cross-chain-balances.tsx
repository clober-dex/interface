import React from 'react'

import { Currency } from '../model/currency'
import { RemoteChainBalances } from '../model/remote-chain-balances'
import { Chain } from '../model/chain'
import { formatDollarValue, toUnitString } from '../utils/bigint'
import { formatWithCommas } from '../utils/bignumber'
import { CHAIN_CONFIG } from '../chain-configs'

import ChainIcon from './icon/chain-icon'

const CrossChainBalances = ({
  currency,
  remoteChainBalances,
  balance,
  price,
}: {
  currency: Currency
  remoteChainBalances: RemoteChainBalances
  balance: bigint
  price?: number
}) => {
  return (
    <div className="w-full px-3 sm:p-4 bg-gray-800 rounded-xl flex-col justify-center items-start gap-2 flex">
      {Object.entries(
        Object.fromEntries(
          Object.entries(remoteChainBalances).map(([addr, data]) => [
            addr.toLowerCase(),
            data,
          ]),
        ),
      )
        .filter(([addr]) => addr === currency.address.toLowerCase())
        .map(([address, remoteChainBalance]) => {
          if (remoteChainBalance.total === 0n) {
            return null
          }
          return (
            <div
              key={address}
              className="flex flex-col w-full items-start gap-2"
            >
              {[
                {
                  chain: {
                    id: CHAIN_CONFIG.CHAIN.id,
                    logo: CHAIN_CONFIG.CHAIN.icon,
                    name: CHAIN_CONFIG.CHAIN.name,
                  },
                  balance,
                },
                ...remoteChainBalance.breakdown,
              ].map((balanceInfo) => (
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
                        price,
                        formatWithCommas,
                      )}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {formatDollarValue(
                        balanceInfo.balance,
                        currency.decimals,
                        price,
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
    </div>
  )
}

export default CrossChainBalances
