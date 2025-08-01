import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useAccount, useGasPrice } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getSubgraphBlockNumber } from '@clober/v2-sdk'

import ConfirmationModal from '../components/modal/confirmation-modal'
import { Currency, LpCurrency } from '../model/currency'
import { Chain } from '../model/chain'
import { TransactionType } from '../model/transaction-type'
import { applyPercent } from '../utils/bigint'

import { useChainContext } from './chain-context'

export type Confirmation = {
  title: string
  body?: string
  chain: Chain
  fields: {
    direction?: 'in' | 'out'
    currency?: Currency | LpCurrency
    label: string
    value: string
  }[]
}

export type Transaction = Confirmation & {
  txHash: `0x${string}`
  type: TransactionType
  timestamp: number
  blockNumber?: number
  success?: boolean
}

type TransactionContext = {
  confirmation?: Confirmation
  setConfirmation: (confirmation?: Confirmation) => void
  pendingTransactions: Transaction[]
  transactionHistory: Transaction[]
  queuePendingTransaction: (transaction: Transaction) => void
  updatePendingTransaction: (transaction: Transaction) => void
  lastIndexedBlockNumber: number
  selectedExecutorName: string | null
  setSelectedExecutorName: (executor: string | null) => void
  gasPriceMultiplier: string
  setGasPriceMultiplier: (multiplier: string) => void
  gasPrice: bigint
}

const Context = React.createContext<TransactionContext>({
  setConfirmation: () => {},
  pendingTransactions: [],
  transactionHistory: [],
  queuePendingTransaction: () => {},
  updatePendingTransaction: () => {},
  lastIndexedBlockNumber: 0,
  selectedExecutorName: null,
  setSelectedExecutorName: () => {},
  gasPriceMultiplier: '1',
  setGasPriceMultiplier: () => {},
  gasPrice: 0n,
})

const GAS_PRICE_MULTIPLIER_KEY = (chainId: number) =>
  `gas-price-multiplier-${chainId}`
const LOCAL_STORAGE_SELECTED_EXECUTOR_KEY = (chainId: number) =>
  `selected-executor-name-${chainId}`
const LOCAL_STORAGE_TRANSACTIONS_KEY = (
  address: `0x${string}`,
  status: 'pending' | 'confirmed',
) => `transactions-${address}-${status}`

export const TransactionProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const { data: gasPrice } = useGasPrice()
  const { selectedChain } = useChainContext()
  const { address: userAddress } = useAccount()
  const [confirmation, setConfirmation] = React.useState<Confirmation>()
  const [pendingTransactions, setPendingTransactions] = React.useState<
    Transaction[]
  >([])
  const [transactionHistory, setTransactionHistory] = React.useState<
    Transaction[]
  >([])
  const [gasPriceMultiplier, _setGasPriceMultiplier] = useState('1.05')
  const setGasPriceMultiplier = useCallback(
    (multiplier: string) => {
      _setGasPriceMultiplier(multiplier)
      localStorage.setItem(
        GAS_PRICE_MULTIPLIER_KEY(selectedChain.id),
        multiplier,
      )
    },
    [selectedChain.id],
  )

  const [selectedExecutorName, _setSelectedExecutorName] = React.useState<
    string | null
  >(null)
  const setSelectedExecutorName = useCallback(
    (executor: string | null) => {
      _setSelectedExecutorName(executor)
      localStorage.setItem(
        LOCAL_STORAGE_SELECTED_EXECUTOR_KEY(selectedChain.id),
        executor ?? '',
      )
    },
    [selectedChain.id],
  )

  useEffect(() => {
    const multiplier = localStorage.getItem(
      GAS_PRICE_MULTIPLIER_KEY(selectedChain.id),
    )
    if (multiplier) {
      _setGasPriceMultiplier(multiplier)
    }

    const storedExecutorName = localStorage.getItem(
      LOCAL_STORAGE_SELECTED_EXECUTOR_KEY(selectedChain.id),
    )
    _setSelectedExecutorName(
      storedExecutorName && storedExecutorName.length > 0
        ? storedExecutorName
        : null,
    )
  }, [selectedChain.id])

  useEffect(() => {
    setPendingTransactions(
      userAddress
        ? JSON.parse(
            localStorage.getItem(
              LOCAL_STORAGE_TRANSACTIONS_KEY(userAddress, 'pending'),
            ) ?? '[]',
          )
        : [],
    )

    setTransactionHistory(
      userAddress
        ? JSON.parse(
            localStorage.getItem(
              LOCAL_STORAGE_TRANSACTIONS_KEY(userAddress, 'confirmed'),
            ) ?? '[]',
          )
        : [],
    )
  }, [userAddress])

  const queuePendingTransaction = useCallback(
    (transaction: Transaction) => {
      if (userAddress && transaction.chain.id === selectedChain.id) {
        setPendingTransactions((previous) => {
          const updatedTransactions = [...previous, transaction]
          localStorage.setItem(
            LOCAL_STORAGE_TRANSACTIONS_KEY(userAddress, 'pending'),
            JSON.stringify(updatedTransactions),
          )
          return updatedTransactions
        })

        try {
          // @ts-ignore
          window.gtag('event', transaction.type, {
            user_address: userAddress,
            chain_id: transaction.chain?.id,
            transaction: {
              tx_hash: transaction.txHash,
              timestamp: transaction.timestamp,
              block_number: transaction.blockNumber,
              success: transaction.success,
              currency_flow: transaction.fields,
            },
          })

          // @ts-ignore
          window.__adrsbl.run(transaction.type, true, [
            { name: 'user_address', value: userAddress },
            { name: 'chain_id', value: transaction.chain?.id },
            {
              name: 'tx_hash',
              value: transaction.txHash,
            },
            {
              name: 'timestamp',
              value: transaction.timestamp,
            },
            {
              name: 'block_number',
              value: transaction.blockNumber,
            },
            {
              name: 'success',
              value: transaction.success,
            },
          ])
        } catch (e) {
          console.error('Error sending transaction event', e)
        }
      }
    },
    [selectedChain.id, userAddress],
  )

  const updatePendingTransaction = useCallback(
    (transaction: Transaction) => {
      if (userAddress) {
        setPendingTransactions((previous) => {
          const updatedTransactions = previous.map((prevTx) =>
            prevTx.txHash === transaction.txHash
              ? {
                  ...prevTx,
                  blockNumber: transaction.blockNumber,
                  success: transaction.success,
                }
              : prevTx,
          )
          localStorage.setItem(
            LOCAL_STORAGE_TRANSACTIONS_KEY(userAddress, 'pending'),
            JSON.stringify(updatedTransactions),
          )
          return updatedTransactions
        })
      }
    },
    [userAddress],
  )

  const dequeuePendingTransaction = useCallback(
    (txHash: `0x${string}`) => {
      const transaction = pendingTransactions.find(
        (transaction) => transaction.txHash === txHash,
      )
      if (userAddress && transaction) {
        setTransactionHistory((previous) => {
          const updatedTransactions = [transaction, ...previous]
          localStorage.setItem(
            LOCAL_STORAGE_TRANSACTIONS_KEY(userAddress, 'confirmed'),
            JSON.stringify(updatedTransactions),
          )
          return updatedTransactions
        })

        setPendingTransactions((previous) => {
          const updatedTransactions = previous.filter(
            (transaction) => transaction.txHash !== txHash,
          )
          localStorage.setItem(
            LOCAL_STORAGE_TRANSACTIONS_KEY(userAddress, 'pending'),
            JSON.stringify(updatedTransactions),
          )
          return updatedTransactions
        })
      }
    },
    [pendingTransactions, userAddress],
  )

  const { data: lastIndexedBlockNumber } = useQuery({
    queryKey: ['last-indexed-block-number', selectedChain.id],
    queryFn: async () => {
      return getSubgraphBlockNumber({
        chainId: selectedChain.id,
      })
    },
    initialData: 0,
    refetchInterval: 1000, // checked
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    pendingTransactions.forEach((transaction) => {
      // subgraph error
      if (lastIndexedBlockNumber === 0) {
        return
      }
      // transaction not confirmed yet
      if (
        transaction.blockNumber === undefined ||
        transaction.success === undefined
      ) {
        return
      }
      if ((transaction?.blockNumber ?? 0) > lastIndexedBlockNumber) {
        return
      }

      dequeuePendingTransaction(transaction.txHash)
    })
  }, [
    dequeuePendingTransaction,
    lastIndexedBlockNumber,
    pendingTransactions,
    selectedChain.id,
  ])

  return (
    <Context.Provider
      value={{
        confirmation,
        setConfirmation,
        pendingTransactions: pendingTransactions.filter(
          (tx) => tx.chain.id === selectedChain.id,
        ),
        transactionHistory: transactionHistory.filter(
          (tx) => tx.chain.id === selectedChain.id,
        ),
        queuePendingTransaction,
        updatePendingTransaction,
        lastIndexedBlockNumber,
        selectedExecutorName,
        setSelectedExecutorName,
        gasPriceMultiplier,
        setGasPriceMultiplier,
        gasPrice: applyPercent(
          gasPrice ?? 0n,
          100 * Number(gasPriceMultiplier),
        ),
      }}
    >
      {children}
      <ConfirmationModal confirmation={confirmation} />
    </Context.Provider>
  )
}

export function useTransactionContext() {
  return useContext(Context) as TransactionContext
}
