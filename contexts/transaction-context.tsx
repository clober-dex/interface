import React, { useCallback, useContext, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getSubgraphBlockNumber } from '@clober/v2-sdk'

import ConfirmationModal from '../components/modal/confirmation-modal'
import { Currency, LpCurrency } from '../model/currency'
import { Chain } from '../model/chain'
import { TransactionType } from '../model/transaction-type'
import { CHAIN_CONFIG } from '../chain-configs'
import { NamedUrl } from '../model/named-url'

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
  selectedExplorer: string | null
  setSelectedExplorer: (explorer: string) => void
  selectedRpcEndpoint: string
  setSelectedRpcEndpoint: (rpcEndpoint: string) => void
  customRpcEndpoint: string
  setCustomRpcEndpoint: (rpcEndpoint: string) => void
  rpcEndpointList: (NamedUrl & {
    connectionDurationInMs: number
  })[]
}

const Context = React.createContext<TransactionContext>({
  setConfirmation: () => {},
  pendingTransactions: [],
  transactionHistory: [],
  queuePendingTransaction: () => {},
  updatePendingTransaction: () => {},
  lastIndexedBlockNumber: 0,
  selectedExplorer: null,
  setSelectedExplorer: () => {},
  selectedRpcEndpoint: null,
  setSelectedRpcEndpoint: () => {},
  customRpcEndpoint: '',
  setCustomRpcEndpoint: () => {},
  rpcEndpointList: [],
})

export const LOCAL_STORAGE_EXPLORER_KEY = (chainId: number) =>
  `selected-explorer-${chainId}`
export const LOCAL_STORAGE_RPC_ENDPOINT_KEY = (chainId: number) =>
  `selected-rpc-endpoint-${chainId}`
export const LOCAL_STORAGE_CUSTOM_RPC_ENDPOINT_KEY = (chainId: number) =>
  `custom-rpc-endpoint-${chainId}`

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
  const [selectedExplorer, _setSelectedExplorer] = React.useState(
    CHAIN_CONFIG.EXPLORER_LIST[0].url ?? null,
  )
  const setSelectedExplorer = useCallback(
    (explorer: string) => {
      _setSelectedExplorer(explorer)
      localStorage.setItem(
        LOCAL_STORAGE_EXPLORER_KEY(selectedChain.id),
        JSON.stringify(explorer),
      )
    },
    [selectedChain.id],
  )

  const [selectedRpcEndpoint, _setSelectedRpcEndpoint] = React.useState(
    CHAIN_CONFIG.RPC_URL_LIST[0].url ?? CHAIN_CONFIG.RPC_URL,
  )
  const setSelectedRpcEndpoint = useCallback(
    (rpcEndpoint: string) => {
      _setSelectedRpcEndpoint(rpcEndpoint)
      localStorage.setItem(
        LOCAL_STORAGE_RPC_ENDPOINT_KEY(selectedChain.id),
        JSON.stringify(rpcEndpoint),
      )
    },
    [selectedChain.id],
  )

  const [customRpcEndpoint, _setCustomRpcEndpoint] = React.useState('')
  const setCustomRpcEndpoint = useCallback(
    (rpcEndpoint: string) => {
      _setCustomRpcEndpoint(rpcEndpoint)
      localStorage.setItem(
        LOCAL_STORAGE_CUSTOM_RPC_ENDPOINT_KEY(selectedChain.id),
        JSON.stringify(rpcEndpoint),
      )
    },
    [selectedChain.id],
  )

  useEffect(() => {
    const storedExplorer = localStorage.getItem(
      LOCAL_STORAGE_EXPLORER_KEY(selectedChain.id),
    )
    if (storedExplorer) {
      _setSelectedExplorer(JSON.parse(storedExplorer))
    }

    const storedRpcEndpoint = localStorage.getItem(
      LOCAL_STORAGE_RPC_ENDPOINT_KEY(selectedChain.id),
    )
    if (storedRpcEndpoint) {
      _setSelectedRpcEndpoint(JSON.parse(storedRpcEndpoint))
    }

    const storedCustomRpcEndpoint = localStorage.getItem(
      LOCAL_STORAGE_CUSTOM_RPC_ENDPOINT_KEY(selectedChain.id),
    )
    if (storedCustomRpcEndpoint) {
      _setCustomRpcEndpoint(JSON.parse(storedCustomRpcEndpoint))
    }
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

  const { data: rpcDurations } = useQuery({
    queryKey: ['rpc-connection-durations', selectedChain.id],
    queryFn: async () => {
      const results = await Promise.allSettled(
        CHAIN_CONFIG.RPC_URL_LIST.map(async ({ name, url }) => {
          const start = performance.now()
          try {
            await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_blockNumber',
                params: [],
              }),
            })
            const end = performance.now()
            return {
              name,
              url,
              connectionDurationInMs: end - start,
            }
          } catch (e) {
            return {
              name,
              url,
              connectionDurationInMs: 5000,
            }
          }
        }),
      )

      return results
        .filter(
          (
            r,
          ): r is PromiseFulfilledResult<{
            name: string
            url: string
            connectionDurationInMs: number
          }> => r.status === 'fulfilled',
        )
        .map((r) => r.value)
    },
    initialData: CHAIN_CONFIG.RPC_URL_LIST.map(({ name, url }) => ({
      name,
      url,
      connectionDurationInMs: 0,
    })),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })

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
        selectedExplorer,
        setSelectedExplorer,
        selectedRpcEndpoint,
        setSelectedRpcEndpoint,
        customRpcEndpoint,
        setCustomRpcEndpoint,
        rpcEndpointList: rpcDurations ?? [],
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
