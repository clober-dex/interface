import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import {
  createPublicClient,
  getAddress,
  http,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { getContractAddresses } from '@clober/v2-sdk'

import { Currency } from '../model/currency'
import { Prices } from '../model/prices'
import { Balances } from '../model/balances'
import { ERC20_PERMIT_ABI } from '../abis/@openzeppelin/erc20-permit-abi'
import { fetchPrices } from '../apis/swap/price'
import { aggregators } from '../chain-configs/aggregators'
import { Allowances } from '../model/allowances'
import { deduplicateCurrencies } from '../utils/currency'
import { CHAIN_CONFIG } from '../chain-configs'
import { fetchWhitelistCurrenciesFromGithub } from '../apis/token'

import { useChainContext } from './chain-context'

type CurrencyContext = {
  whitelistCurrencies: Currency[]
  currencies: Currency[]
  setCurrencies: (currencies: Currency[]) => void
  prices: Prices
  balances: Balances
  allowances: Allowances
  isOpenOrderApproved: boolean
}

const Context = React.createContext<CurrencyContext>({
  whitelistCurrencies: [],
  currencies: [],
  setCurrencies: () => {},
  prices: {},
  balances: {},
  allowances: {},
  isOpenOrderApproved: false,
})

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
    ],
    name: 'isApprovedForAll',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const CurrencyProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { address: userAddress } = useAccount()
  const { selectedChain } = useChainContext()
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: selectedChain,
      transport: http(CHAIN_CONFIG.RPC_URL),
    })
  }, [selectedChain])

  const { data: whitelistCurrencies } = useQuery({
    queryKey: ['currencies', selectedChain.id],
    queryFn: async () => {
      const whitelistCurrencies =
        await fetchWhitelistCurrenciesFromGithub(selectedChain)
      return deduplicateCurrencies([
        ...whitelistCurrencies,
        ...CHAIN_CONFIG.WHITELISTED_CURRENCIES,
      ]).map((currency) => ({
        ...currency,
        isVerified: true,
      }))
    },
    initialData: [],
  }) as {
    data: Currency[]
  }
  const [currencies, _setCurrencies] = useState<Currency[]>([])
  const setCurrencies = useCallback((newCurrencies: Currency[]) => {
    _setCurrencies((prev) => {
      const existingAddresses = new Set(
        prev.map((c) => c.address.toLowerCase()),
      )
      const deduped = newCurrencies.filter(
        (c) => !existingAddresses.has(c.address.toLowerCase()),
      )
      return [...prev, ...deduped]
    })
  }, [])

  useEffect(() => {
    if (whitelistCurrencies.length === 0) {
      return
    }
    setCurrencies(whitelistCurrencies)
  }, [setCurrencies, whitelistCurrencies])

  const { data: balances } = useQuery({
    queryKey: [
      'balances',
      selectedChain.id,
      userAddress,
      currencies
        .map((c) => c.address)
        .sort()
        .join(''),
    ],
    queryFn: async () => {
      if (!userAddress || currencies.length === 0) {
        return {}
      }
      const uniqueCurrencies = deduplicateCurrencies(currencies).filter(
        (currency) => !isAddressEqual(currency.address, zeroAddress),
      )
      const [results, balance] = await Promise.all([
        publicClient.multicall({
          contracts: uniqueCurrencies.map((currency) => ({
            chainId: selectedChain.id,
            address: currency.address,
            abi: ERC20_PERMIT_ABI,
            functionName: 'balanceOf',
            args: [userAddress],
          })),
        }),
        publicClient.getBalance({
          address: userAddress,
        }),
      ])
      return results.reduce(
        (acc: {}, { result }, index: number) => {
          const currency = uniqueCurrencies[index]
          return {
            ...acc,
            [getAddress(currency.address)]: result ?? 0n,
            [currency.address.toLowerCase()]: result ?? 0n,
          }
        },
        {
          [zeroAddress]: balance ?? 0n,
        },
      )
    },
    refetchInterval: 5 * 1000, // checked
    refetchIntervalInBackground: true,
  }) as {
    data: Balances
  }

  const { data: prices } = useQuery({
    queryKey: ['prices', selectedChain.id],
    queryFn: async () => {
      return fetchPrices()
    },
    refetchInterval: 5 * 1000, // checked
    refetchIntervalInBackground: true,
  })

  const { data } = useQuery({
    queryKey: [
      'allowances',
      selectedChain.id,
      userAddress,
      currencies
        .map((c) => c.address)
        .sort()
        .join(''),
    ],
    queryFn: async () => {
      const spenders: `0x${string}`[] = [
        getContractAddresses({ chainId: selectedChain.id }).Controller,
        getContractAddresses({ chainId: selectedChain.id }).Minter,
        ...aggregators.map((aggregator) => aggregator.contract),
        CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
      ]
      const _currencies = currencies.filter(
        (currency) => !isAddressEqual(currency.address, zeroAddress),
      )
      if (!userAddress || _currencies.length === 0 || !selectedChain) {
        return {
          allowances: {},
          isOpenOrderApproved: false,
        }
      }
      const contracts = [
        ...spenders
          .filter((spender) => !isAddressEqual(spender, zeroAddress))
          .map((spender) => {
            return _currencies.map((currency) => ({
              chainId: selectedChain.id,
              address: currency.address,
              abi: ERC20_PERMIT_ABI,
              functionName: 'allowance',
              args: [userAddress, spender],
            }))
          }, [])
          .flat(),
        {
          chainId: selectedChain.id,
          address: getContractAddresses({ chainId: selectedChain.id })
            .BookManager,
          abi: _abi,
          functionName: 'isApprovedForAll',
          args: [
            userAddress,
            getContractAddresses({ chainId: selectedChain.id }).Controller,
          ],
        },
      ]
      const results = await publicClient.multicall({
        contracts,
      })
      return {
        isOpenOrderApproved: results.slice(-1)?.[0]?.result ?? false,
        allowances: results.slice(0, -1).reduce(
          (
            acc: {
              [key in `0x${string}`]: { [key in `0x${string}`]: bigint }
            },
            { result },
            i,
          ) => {
            const currency = _currencies[i % _currencies.length]
            const spender = getAddress(
              spenders[Math.floor(i / _currencies.length)],
            )
            const resultValue = (result ?? 0n) as bigint
            return {
              ...acc,
              [spender]: {
                ...acc[spender],
                [getAddress(currency.address)]: resultValue,
              },
            }
          },
          spenders.reduce((acc, spender) => ({ ...acc, [spender]: {} }), {}),
        ),
      }
    },
  }) as {
    data: { allowances: Allowances; isOpenOrderApproved: boolean }
  }

  return (
    <Context.Provider
      value={{
        whitelistCurrencies,
        prices: prices ?? {},
        balances: balances ?? {},
        allowances: data?.allowances ?? {},
        isOpenOrderApproved: data?.isOpenOrderApproved ?? false,
        currencies,
        setCurrencies,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useCurrencyContext = () =>
  React.useContext(Context) as CurrencyContext
