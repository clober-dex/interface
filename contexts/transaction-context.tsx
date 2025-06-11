import React, { useCallback, useContext, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { CHAIN_IDS, getSubgraphBlockNumber } from '@clober/v2-sdk'

import ConfirmationModal from '../components/modal/confirmation-modal'
import { Currency, LpCurrency } from '../model/currency'
import { Chain } from '../model/chain'
import { TransactionType } from '../model/transaction-type'

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
  blockNumber: number
  success: boolean
}

type TransactionContext = {
  confirmation?: Confirmation
  setConfirmation: (confirmation?: Confirmation) => void
  pendingTransactions: Transaction[]
  transactionHistory: Transaction[]
  queuePendingTransaction: (transaction: Transaction) => void
  latestSubgraphBlockNumber: {
    blockNumber: number
    chainId: CHAIN_IDS
  }
}

const Context = React.createContext<TransactionContext>({
  setConfirmation: () => {},
  pendingTransactions: [],
  transactionHistory: [],
  queuePendingTransaction: () => {},
  latestSubgraphBlockNumber: {
    blockNumber: 0,
    chainId: CHAIN_IDS.MONAD_TESTNET,
  },
})

export const LOCAL_STORAGE_TRANSACTIONS_KEY = (
  address: `0x${string}`,
  status: 'pending' | 'confirmed',
) => `transactions-${address}-${status}`

export const TransactionProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const { selectedChain } = useChainContext()
  const { address: userAddress } = useAccount()
  const [confirmation, setConfirmation] = React.useState<Confirmation>()
  const [pendingTransactions, setPendingTransactions] = React.useState<
    Transaction[]
  >([])
  const [transactionHistory, setTransactionHistory] = React.useState<
    Transaction[]
  >([])

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
      if (userAddress) {
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
        } catch (e) {
          console.error('Error sending transaction event', e)
        }
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

  const { data: latestSubgraphBlockNumber } = useQuery({
    queryKey: ['latest-subgraph-block-number', selectedChain.id],
    queryFn: async () => {
      const latestSubgraphBlockNumber = await getSubgraphBlockNumber({
        chainId: selectedChain.id,
      })
      return {
        blockNumber: latestSubgraphBlockNumber,
        chainId: selectedChain.id,
      }
    },
    initialData: { blockNumber: 0, chainId: selectedChain.id },
    refetchInterval: 1000, // checked
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    pendingTransactions.forEach((transaction) => {
      if (latestSubgraphBlockNumber.chainId !== selectedChain.id) {
        return
      }
      if (
        latestSubgraphBlockNumber.blockNumber === 0 ||
        transaction.blockNumber > latestSubgraphBlockNumber.blockNumber
      ) {
        return
      }

      dequeuePendingTransaction(transaction.txHash)
    })
  }, [
    dequeuePendingTransaction,
    latestSubgraphBlockNumber,
    pendingTransactions,
    selectedChain.id,
  ])

  return (
    <Context.Provider
      value={{
        confirmation,
        setConfirmation,
        pendingTransactions,
        transactionHistory,
        queuePendingTransaction,
        latestSubgraphBlockNumber,
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
