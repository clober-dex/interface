import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount, useDisconnect, useWalletClient } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPublicClient,
  erc20Abi,
  getAddress,
  http,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { getContractAddresses } from '@clober/v2-sdk'
import { Transaction as SdkTransaction } from '@clober/v2-sdk/dist/types/types/transaction'

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
import { currentTimestampInSeconds } from '../utils/date'
import { formatPreciseAmountString } from '../utils/bignumber'
import { formatUnits } from '../utils/bigint'
import { buildTransaction, sendTransaction } from '../utils/transaction'
import { shortAddress } from '../utils/address'
import { executors } from '../chain-configs/executors'

import { Confirmation, useTransactionContext } from './transaction-context'
import { useChainContext } from './chain-context'

type CurrencyContext = {
  whitelistCurrencies: Currency[]
  currencies: Currency[]
  setCurrencies: (currencies: Currency[]) => void
  prices: Prices
  balances: Balances
  getAllowance: (spender: `0x${string}`, currency: Currency) => bigint
  isOpenOrderApproved: boolean
  transfer: (
    currency: Currency,
    amount: bigint,
    recipient: `0x${string}`,
  ) => Promise<void>
}

const Context = React.createContext<CurrencyContext>({
  whitelistCurrencies: [],
  currencies: [],
  setCurrencies: () => {},
  prices: {},
  balances: {},
  getAllowance: () => 0n,
  isOpenOrderApproved: false,
  transfer: () => Promise.resolve(),
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
  const queryClient = useQueryClient()
  const { disconnectAsync } = useDisconnect()

  const { address: userAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { selectedChain } = useChainContext()
  const {
    setConfirmation,
    queuePendingTransaction,
    updatePendingTransaction,
    gasPrice,
  } = useTransactionContext()

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
        ...executors.map((executor) => executor.contract),
        CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
      ].filter(
        (spender) =>
          spender &&
          isAddress(spender) &&
          !isAddressEqual(spender, zeroAddress),
      )
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

  const transfer = useCallback(
    async (currency: Currency, amount: bigint, recipient: `0x${string}`) => {
      if (!walletClient || !prices || !userAddress) {
        return
      }

      try {
        const confirmation = {
          title: 'Transfer',
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              label: 'From',
              value: shortAddress(userAddress, 6),
            },
            {
              label: 'To',
              value: shortAddress(recipient, 6),
            },
            {
              currency: currency,
              label: currency.symbol,
              direction: 'in',
              value: formatPreciseAmountString(
                formatUnits(amount, currency.decimals),
                prices[currency.address],
              ),
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)

        let transaction = undefined
        if (!isAddressEqual(currency.address, zeroAddress)) {
          transaction = await buildTransaction(
            publicClient,
            {
              chain: selectedChain,
              address: currency.address,
              abi: erc20Abi,
              functionName: 'transfer',
              args: [recipient, amount],
            },
            100_000n,
          )
        } else {
          transaction = {
            chain: selectedChain,
            to: recipient,
            from: userAddress,
            value: amount,
          }
        }
        if (!transaction) {
          return
        }
        await sendTransaction(
          selectedChain,
          walletClient,
          transaction as SdkTransaction,
          disconnectAsync,
          (hash) => {
            setConfirmation(undefined)
            queuePendingTransaction({
              ...confirmation,
              txHash: hash,
              type: 'transfer',
              timestamp: currentTimestampInSeconds(),
            })
          },
          (receipt) => {
            setConfirmation(undefined)
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              type: 'transfer',
              timestamp: currentTimestampInSeconds(),
              blockNumber: Number(receipt.blockNumber),
              success: receipt.status === 'success',
            })
          },
          gasPrice,
          null,
        )
      } catch (e) {
        console.error(e)
      } finally {
        setConfirmation(undefined)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
        ])
      }
    },
    [
      gasPrice,
      disconnectAsync,
      prices,
      publicClient,
      queryClient,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
      userAddress,
      walletClient,
    ],
  )

  const getAllowance = useCallback(
    (spender: `0x${string}`, currency: Currency) => {
      if (isAddressEqual(currency.address, zeroAddress)) {
        return 2n ** 256n - 1n // native currency has unlimited allowance
      }
      const spenderAddress = getAddress(spender)
      const currencyAddress = getAddress(currency.address)
      return (data?.allowances?.[spenderAddress]?.[currencyAddress] ??
        0n) as bigint
    },
    [data],
  )

  return (
    <Context.Provider
      value={{
        whitelistCurrencies,
        prices: new Proxy(prices ?? {}, {
          get: (target, prop: `0x${string}`) =>
            target[prop as keyof typeof target] ?? 0,
        }),
        balances: new Proxy(balances ?? {}, {
          get: (target, prop: `0x${string}`) =>
            target[prop as keyof typeof target] ?? 0n,
        }),
        getAllowance,
        isOpenOrderApproved: data?.isOpenOrderApproved ?? false,
        currencies,
        setCurrencies,
        transfer,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useCurrencyContext = () =>
  React.useContext(Context) as CurrencyContext
