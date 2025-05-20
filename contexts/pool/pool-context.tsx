import React, { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getContractAddresses } from '@clober/v2-sdk'
import { useAccount } from 'wagmi'
import { createPublicClient, http } from 'viem'

import { Balances } from '../../model/balances'
import {
  deduplicateCurrencies,
  fetchCurrenciesDone,
} from '../../utils/currency'
import { useChainContext } from '../chain-context'
import { useCurrencyContext } from '../currency-context'
import { CHAIN_CONFIG } from '../../chain-configs'

type PoolContext = {
  lpCurrencyAmount: string
  setLpCurrencyAmount: (inputCurrencyAmount: string) => void
  currency0Amount: string
  setCurrency0Amount: (inputCurrencyAmount: string) => void
  currency1Amount: string
  setCurrency1Amount: (inputCurrencyAmount: string) => void
  disableSwap: boolean
  setDisableSwap: (value: boolean) => void
  slippageInput: string
  setSlippageInput: (slippageInput: string) => void
  lpBalances: Balances
}

const Context = React.createContext<PoolContext>({
  lpCurrencyAmount: '',
  setLpCurrencyAmount: () => {},
  currency0Amount: '',
  setCurrency0Amount: () => {},
  currency1Amount: '',
  setCurrency1Amount: () => {},
  disableSwap: false,
  setDisableSwap: () => {},
  slippageInput: '1',
  setSlippageInput: () => {},
  lpBalances: {},
})

export const PoolProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { selectedChain } = useChainContext()
  const { address: userAddress } = useAccount()
  const { prices, setCurrencies, whitelistCurrencies } = useCurrencyContext()
  const [lpCurrencyAmount, setLpCurrencyAmount] = React.useState('')
  const [currency0Amount, setCurrency0Amount] = React.useState('')
  const [currency1Amount, setCurrency1Amount] = React.useState('')
  const [disableSwap, setDisableSwap] = React.useState(false)
  const [slippageInput, setSlippageInput] = React.useState('1')
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: selectedChain,
      transport: http(CHAIN_CONFIG.RPC_URL),
    })
  }, [selectedChain])

  const { data: lpBalances } = useQuery({
    queryKey: [
      'lp-balances',
      userAddress,
      selectedChain.id,
      Object.values(prices).reduce((acc, price) => acc + price, 0) !== 0,
    ],
    queryFn: async () => {
      if (!userAddress) {
        return {}
      }
      const results = await publicClient.multicall({
        contracts: CHAIN_CONFIG.WHITELISTED_POOL_KEYS.map((key) => ({
          chainId: selectedChain.id,
          address: getContractAddresses({ chainId: selectedChain.id })
            .Rebalancer,
          abi: [
            {
              inputs: [
                {
                  internalType: 'address',
                  name: '',
                  type: 'address',
                },
                {
                  internalType: 'uint256',
                  name: '',
                  type: 'uint256',
                },
              ],
              name: 'balanceOf',
              outputs: [
                {
                  internalType: 'uint256',
                  name: '',
                  type: 'uint256',
                },
              ],
              stateMutability: 'view',
              type: 'function',
            },
          ] as const,
          functionName: 'balanceOf',
          args: [userAddress, BigInt(key)],
        })),
      })
      return results.reduce((acc: {}, { result }, index: number) => {
        return {
          ...acc,
          [CHAIN_CONFIG.WHITELISTED_POOL_KEYS[index]]: result ?? 0n,
        }
      }, {})
    },
    refetchInterval: 5 * 1000,
    refetchIntervalInBackground: true,
  }) as {
    data: Balances
  }

  useEffect(() => {
    const action = () => {
      if (!fetchCurrenciesDone(whitelistCurrencies)) {
        return
      }

      setCurrencies(deduplicateCurrencies(whitelistCurrencies))
    }
    if (window.location.href.includes('/earn')) {
      action()
    }
  }, [selectedChain, setCurrencies, whitelistCurrencies])

  return (
    <Context.Provider
      value={{
        lpCurrencyAmount,
        setLpCurrencyAmount,
        currency0Amount,
        setCurrency0Amount,
        currency1Amount,
        setCurrency1Amount,
        disableSwap,
        setDisableSwap,
        slippageInput,
        setSlippageInput,
        lpBalances: lpBalances ?? {},
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const usePoolContext = () => React.useContext(Context) as PoolContext
