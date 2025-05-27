import React, { useCallback, useEffect } from 'react'
import { useDisconnect, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { getAddress, isAddressEqual, parseUnits, zeroAddress } from 'viem'
import {
  cancelOrders,
  claimOrders,
  getContractAddresses,
  limitOrder,
  Market,
  openMarket,
  OpenOrder,
  setApprovalOfOpenOrdersForAll,
} from '@clober/v2-sdk'

import { useChainContext } from '../chain-context'
import { Currency } from '../../model/currency'
import { Confirmation, useTransactionContext } from '../transaction-context'
import { sendTransaction, waitTransaction } from '../../utils/transaction'
import { useCurrencyContext } from '../currency-context'
import { maxApprove } from '../../utils/approve20'
import { toPlacesAmountString } from '../../utils/bignumber'
import { currentTimestampInSeconds } from '../../utils/date'
import { CHAIN_CONFIG } from '../../chain-configs'

import { useOpenOrderContext } from './open-order-context'

type LimitContractContext = {
  limit: (
    inputCurrency: Currency,
    outputCurrency: Currency,
    amount: string,
    price: string,
    selectedMarket: Market,
  ) => Promise<void>
  cancels: (openOrders: OpenOrder[]) => Promise<void>
  claims: (openOrders: OpenOrder[]) => Promise<void>
}

const Context = React.createContext<LimitContractContext>({
  limit: () => Promise.resolve(),
  cancels: () => Promise.resolve(),
  claims: () => Promise.resolve(),
})

export const LimitContractProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const queryClient = useQueryClient()
  const { disconnectAsync } = useDisconnect()

  const { data: walletClient } = useWalletClient()
  const { openOrders } = useOpenOrderContext()
  const {
    setConfirmation,
    pendingTransactions,
    queuePendingTransaction,
    dequeuePendingTransaction,
    latestSubgraphBlockNumber,
  } = useTransactionContext()
  const { selectedChain } = useChainContext()
  const { isOpenOrderApproved, allowances, prices, balances } =
    useCurrencyContext()

  useEffect(() => {
    pendingTransactions.forEach((transaction) => {
      if (latestSubgraphBlockNumber.chainId !== selectedChain.id) {
        return
      }
      if (!transaction.success) {
        dequeuePendingTransaction(transaction.txHash)
        return
      }
      if (
        latestSubgraphBlockNumber.blockNumber === 0 ||
        transaction.blockNumber > latestSubgraphBlockNumber.blockNumber
      ) {
        if (transaction.type === 'take') {
          dequeuePendingTransaction(transaction.txHash)
        }
        return
      }

      if (
        transaction.type === 'make' ||
        transaction.type === 'limit' ||
        transaction.type === 'cancel' ||
        transaction.type === 'claim'
      ) {
        dequeuePendingTransaction(transaction.txHash)
      }
    })
  }, [
    dequeuePendingTransaction,
    pendingTransactions,
    openOrders,
    balances,
    latestSubgraphBlockNumber,
    selectedChain.id,
  ])

  const limit = useCallback(
    async (
      inputCurrency: Currency,
      outputCurrency: Currency,
      amount: string,
      price: string,
      selectedMarket: Market,
    ) => {
      if (!walletClient || !selectedChain) {
        return
      }
      let isAllowanceChanged = false

      try {
        const isBid = isAddressEqual(
          selectedMarket.quote.address,
          inputCurrency.address,
        )
        if (
          (isBid && !selectedMarket.bidBook.isOpened) ||
          (!isBid && !selectedMarket.askBook.isOpened)
        ) {
          setConfirmation({
            title: `Checking Book Availability`,
            body: '',
            chain: selectedChain,
            fields: [],
          })
          const openTransaction = await openMarket({
            chainId: selectedChain.id,
            userAddress: walletClient.account.address,
            inputToken: inputCurrency.address,
            outputToken: outputCurrency.address,
            options: {
              rpcUrl: CHAIN_CONFIG.RPC_URL,
            },
          })
          if (openTransaction) {
            setConfirmation({
              title: `Open Book`,
              body: 'Please confirm in your wallet.',
              chain: selectedChain,
              fields: [],
            })
            await sendTransaction(
              selectedChain,
              walletClient,
              openTransaction,
              disconnectAsync,
            )
          }
        }

        setConfirmation({
          title: `Limit ${isBid ? 'Bid' : 'Ask'} @ ${price}`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })

        const spender = getContractAddresses({
          chainId: selectedChain.id,
        }).Controller
        if (
          !isAddressEqual(inputCurrency.address, zeroAddress) &&
          allowances[getAddress(spender)][getAddress(inputCurrency.address)] <
            parseUnits(amount, inputCurrency.decimals)
        ) {
          const confirmation = {
            title: `Max Approve ${inputCurrency.symbol}`,
            body: 'Please confirm in your wallet.',
            chain: selectedChain,
            fields: [],
          }
          setConfirmation(confirmation)
          const transactionReceipt = await maxApprove(
            selectedChain,
            walletClient,
            inputCurrency,
            spender,
            disconnectAsync,
          )
          if (transactionReceipt) {
            queuePendingTransaction({
              ...confirmation,
              txHash: transactionReceipt.transactionHash,
              success: transactionReceipt.status === 'success',
              blockNumber: Number(transactionReceipt.blockNumber),
              type: 'approve',
              timestamp: currentTimestampInSeconds(),
            })
            isAllowanceChanged = true
          }
        }
        const args = {
          chainId: selectedChain.id,
          userAddress: walletClient.account.address,
          inputToken: inputCurrency.address,
          outputToken: outputCurrency.address,
          amount: amount,
          price: price,
          options: {
            rpcUrl: CHAIN_CONFIG.RPC_URL,
            roundingUpMakeBid: true,
            roundingDownMakeAsk: true,
            roundingDownTakenBid: true,
            roundingUpTakenAsk: true,
          },
        }
        const { transaction, result } = await limitOrder(args)
        console.log('limitOrder request: ', args)
        console.log('limitOrder result: ', result)

        // only make order
        if (Number(result.spent.amount) === 0) {
          const confirmation = {
            title: `Limit ${isBid ? 'Bid' : 'Ask'} @ ${price}`,
            body: 'Please confirm in your wallet.',
            chain: selectedChain,
            fields: [
              {
                direction: result.make.direction,
                currency: result.make.currency,
                label: result.make.currency.symbol,
                value: toPlacesAmountString(
                  result.make.amount,
                  prices[inputCurrency.address] ?? 0,
                ),
              },
            ] as Confirmation['fields'],
          }
          setConfirmation(confirmation)

          const transactionReceipt = await sendTransaction(
            selectedChain,
            walletClient,
            transaction,
            disconnectAsync,
          )
          if (transactionReceipt) {
            queuePendingTransaction({
              ...confirmation,
              txHash: transactionReceipt.transactionHash,
              success: transactionReceipt.status === 'success',
              blockNumber: Number(transactionReceipt.blockNumber),
              type: 'make',
              timestamp: currentTimestampInSeconds(),
            })
          }
        }
        // limit order or take order
        else {
          const confirmation = {
            title: `Limit ${isBid ? 'Bid' : 'Ask'} @ ${price}`,
            body: 'Please confirm in your wallet.',
            chain: selectedChain,
            fields: [
              {
                direction: result.make.direction,
                currency: result.make.currency,
                label: result.make.currency.symbol,
                value: toPlacesAmountString(
                  Number(result.make.amount) + Number(result.spent.amount),
                  prices[inputCurrency.address] ?? 0,
                ),
              },
              {
                direction: result.taken.direction,
                currency: result.taken.currency,
                label: result.taken.currency.symbol,
                value: toPlacesAmountString(
                  result.taken.amount,
                  prices[outputCurrency.address] ?? 0,
                ),
              },
            ] as Confirmation['fields'],
          }
          setConfirmation(confirmation)

          const transactionReceipt = await sendTransaction(
            selectedChain,
            walletClient,
            transaction,
            disconnectAsync,
          )
          if (transactionReceipt) {
            const makeRatio =
              (Number(result.make.amount) * 100) / Number(amount)
            // @dev: make.amount is not exact zero
            if (makeRatio < 0.01) {
              queuePendingTransaction({
                ...confirmation,
                txHash: transactionReceipt.transactionHash,
                success: transactionReceipt.status === 'success',
                blockNumber: Number(transactionReceipt.blockNumber),
                type: 'take',
                timestamp: currentTimestampInSeconds(),
              })
            } else {
              queuePendingTransaction({
                ...confirmation,
                txHash: transactionReceipt.transactionHash,
                success: transactionReceipt.status === 'success',
                blockNumber: Number(transactionReceipt.blockNumber),
                type: 'limit',
                timestamp: currentTimestampInSeconds(),
              })
            }
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['open-orders'] }),
          queryClient.invalidateQueries({ queryKey: ['market'] }),
          isAllowanceChanged
            ? queryClient.invalidateQueries({ queryKey: ['allowances'] })
            : undefined,
        ])
        setConfirmation(undefined)
      }
    },
    [
      allowances,
      disconnectAsync,
      prices,
      queryClient,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      walletClient,
    ],
  )

  const cancels = useCallback(
    async (openOrders: OpenOrder[]) => {
      let isAllowanceChanged = false
      if (!walletClient || !selectedChain) {
        return
      }

      try {
        setConfirmation({
          title: `Cancel Order`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })
        if (!isOpenOrderApproved) {
          const hash = await setApprovalOfOpenOrdersForAll({
            chainId: walletClient.chain.id,
            walletClient: walletClient as any,
            options: {
              rpcUrl: CHAIN_CONFIG.RPC_URL,
            },
          })
          if (hash) {
            await waitTransaction(walletClient.chain, hash)
            isAllowanceChanged = true
          }
        }

        const { transaction, result } = await cancelOrders({
          chainId: selectedChain.id,
          userAddress: walletClient.account.address,
          ids: openOrders.map((order) => String(order.id)),
          options: {
            rpcUrl: CHAIN_CONFIG.RPC_URL,
          },
        })

        const confirmation = {
          title: `Cancel Order`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: result.map(({ currency, amount, direction }) => ({
            currency,
            label: currency.symbol,
            value: toPlacesAmountString(amount, prices[currency.address] ?? 0),
            direction,
          })),
        }
        setConfirmation(confirmation)
        const transactionReceipt = await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
        )
        if (transactionReceipt) {
          queuePendingTransaction({
            ...confirmation,
            txHash: transactionReceipt.transactionHash,
            success: transactionReceipt.status === 'success',
            blockNumber: Number(transactionReceipt.blockNumber),
            type: 'cancel',
            timestamp: currentTimestampInSeconds(),
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['open-orders'] }),
          queryClient.invalidateQueries({ queryKey: ['market'] }),
          isAllowanceChanged
            ? queryClient.invalidateQueries({ queryKey: ['allowances'] })
            : undefined,
        ])
        setConfirmation(undefined)
      }
    },
    [
      disconnectAsync,
      isOpenOrderApproved,
      prices,
      queryClient,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      walletClient,
    ],
  )

  const claims = useCallback(
    async (openOrders: OpenOrder[]) => {
      let isAllowanceChanged = false
      if (!walletClient || !selectedChain) {
        return
      }

      try {
        setConfirmation({
          title: `Claim Order`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })
        if (!isOpenOrderApproved) {
          const hash = await setApprovalOfOpenOrdersForAll({
            chainId: walletClient.chain.id,
            walletClient: walletClient as any,
            options: {
              rpcUrl: CHAIN_CONFIG.RPC_URL,
            },
          })
          if (hash) {
            await waitTransaction(walletClient.chain, hash)
            isAllowanceChanged = true
          }
        }

        const { transaction, result } = await claimOrders({
          chainId: selectedChain.id,
          userAddress: walletClient.account.address,
          ids: openOrders.map((order) => String(order.id)),
          options: {
            rpcUrl: CHAIN_CONFIG.RPC_URL,
          },
        })

        const confirmation = {
          title: `Claim Order`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: result.map(({ currency, amount, direction }) => ({
            currency,
            label: currency.symbol,
            value: toPlacesAmountString(amount, prices[currency.address] ?? 0),
            direction,
          })),
        }
        setConfirmation(confirmation)
        const transactionReceipt = await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
        )
        if (transactionReceipt) {
          queuePendingTransaction({
            ...confirmation,
            txHash: transactionReceipt.transactionHash,
            success: transactionReceipt.status === 'success',
            blockNumber: Number(transactionReceipt.blockNumber),
            type: 'claim',
            timestamp: currentTimestampInSeconds(),
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['open-orders'] }),
          queryClient.invalidateQueries({ queryKey: ['market'] }),
          isAllowanceChanged
            ? queryClient.invalidateQueries({ queryKey: ['allowances'] })
            : undefined,
        ])
        setConfirmation(undefined)
      }
    },
    [
      disconnectAsync,
      isOpenOrderApproved,
      prices,
      queryClient,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      walletClient,
    ],
  )

  return (
    <Context.Provider value={{ limit, cancels, claims }}>
      {children}
    </Context.Provider>
  )
}

export const useLimitContractContext = () =>
  React.useContext(Context) as LimitContractContext
