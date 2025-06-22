import React, { useCallback } from 'react'
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
import { formatPreciseAmountString } from '../../utils/bignumber'
import { currentTimestampInSeconds } from '../../utils/date'
import { CHAIN_CONFIG } from '../../chain-configs'

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
  const { setConfirmation, queuePendingTransaction, updatePendingTransaction } =
    useTransactionContext()
  const { selectedChain } = useChainContext()
  const { isOpenOrderApproved, allowances, prices } = useCurrencyContext()

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
            const confirmation = {
              title: `Open Book`,
              body: 'Please confirm in your wallet.',
              chain: selectedChain,
              fields: [],
            }
            setConfirmation(confirmation)
            await sendTransaction(
              selectedChain,
              walletClient,
              openTransaction,
              disconnectAsync,
              (hash) => {
                setConfirmation(undefined)
                queuePendingTransaction({
                  ...confirmation,
                  txHash: hash,
                  type: 'open',
                  timestamp: currentTimestampInSeconds(),
                })
              },
              async (receipt) => {
                await queryClient.invalidateQueries({ queryKey: ['market'] })
                updatePendingTransaction({
                  ...confirmation,
                  txHash: receipt.transactionHash,
                  type: 'open',
                  timestamp: currentTimestampInSeconds(),
                  blockNumber: Number(receipt.blockNumber),
                  success: receipt.status === 'success',
                })
              },
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
          await maxApprove(
            selectedChain,
            walletClient,
            inputCurrency,
            spender,
            disconnectAsync,
            (hash) => {
              setConfirmation(undefined)
              queuePendingTransaction({
                ...confirmation,
                txHash: hash,
                type: 'approve',
                timestamp: currentTimestampInSeconds(),
              })
            },
            async (receipt) => {
              updatePendingTransaction({
                ...confirmation,
                txHash: receipt.transactionHash,
                type: 'approve',
                timestamp: currentTimestampInSeconds(),
                blockNumber: Number(receipt.blockNumber),
                success: receipt.status === 'success',
              })
              await queryClient.invalidateQueries({ queryKey: ['allowances'] })
            },
          )
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
            roundingDownTakenBid: false,
            roundingUpTakenAsk: false,
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
                value: formatPreciseAmountString(
                  result.make.amount,
                  prices[inputCurrency.address] ?? 0,
                ),
              },
            ] as Confirmation['fields'],
          }
          setConfirmation(confirmation)

          await sendTransaction(
            selectedChain,
            walletClient,
            transaction,
            disconnectAsync,
            (hash) => {
              setConfirmation(undefined)
              queuePendingTransaction({
                ...confirmation,
                txHash: hash,
                type: 'make',
                timestamp: currentTimestampInSeconds(),
              })
            },
            (receipt) => {
              updatePendingTransaction({
                ...confirmation,
                txHash: receipt.transactionHash,
                type: 'make',
                timestamp: currentTimestampInSeconds(),
                blockNumber: Number(receipt.blockNumber),
                success: receipt.status === 'success',
              })
            },
          )
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
                value: formatPreciseAmountString(
                  Number(result.make.amount) + Number(result.spent.amount),
                  prices[inputCurrency.address] ?? 0,
                ),
              },
              {
                direction: result.taken.direction,
                currency: result.taken.currency,
                label: result.taken.currency.symbol,
                value: formatPreciseAmountString(
                  result.taken.amount,
                  prices[outputCurrency.address] ?? 0,
                ),
              },
            ] as Confirmation['fields'],
          }
          setConfirmation(confirmation)

          const makeRatio = (Number(result.make.amount) * 100) / Number(amount)
          await sendTransaction(
            selectedChain,
            walletClient,
            transaction,
            disconnectAsync,
            (hash) => {
              setConfirmation(undefined)
              if (makeRatio < 0.01) {
                queuePendingTransaction({
                  ...confirmation,
                  txHash: hash,
                  type: 'take',
                  timestamp: currentTimestampInSeconds(),
                })
              } else {
                queuePendingTransaction({
                  ...confirmation,
                  txHash: hash,
                  type: 'limit',
                  timestamp: currentTimestampInSeconds(),
                })
              }
            },
            (receipt) => {
              if (makeRatio < 0.01) {
                updatePendingTransaction({
                  ...confirmation,
                  txHash: receipt.transactionHash,
                  type: 'take',
                  timestamp: currentTimestampInSeconds(),
                  blockNumber: Number(receipt.blockNumber),
                  success: receipt.status === 'success',
                })
              } else {
                updatePendingTransaction({
                  ...confirmation,
                  txHash: receipt.transactionHash,
                  type: 'limit',
                  timestamp: currentTimestampInSeconds(),
                  blockNumber: Number(receipt.blockNumber),
                  success: receipt.status === 'success',
                })
              }
            },
          )
        }
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['open-orders'] }),
          queryClient.invalidateQueries({ queryKey: ['market'] }),
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
      updatePendingTransaction,
      walletClient,
    ],
  )

  const cancels = useCallback(
    async (openOrders: OpenOrder[]) => {
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
            await queryClient.invalidateQueries({ queryKey: ['allowances'] })
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
            value: formatPreciseAmountString(
              amount,
              prices[currency.address] ?? 0,
            ),
            direction,
          })),
        }
        setConfirmation(confirmation)
        await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
          (hash) => {
            setConfirmation(undefined)
            queuePendingTransaction({
              ...confirmation,
              txHash: hash,
              type: 'cancel',
              timestamp: currentTimestampInSeconds(),
            })
          },
          (receipt) => {
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              type: 'cancel',
              timestamp: currentTimestampInSeconds(),
              blockNumber: Number(receipt.blockNumber),
              success: receipt.status === 'success',
            })
          },
        )
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['open-orders'] }),
          queryClient.invalidateQueries({ queryKey: ['market'] }),
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
      updatePendingTransaction,
      walletClient,
    ],
  )

  const claims = useCallback(
    async (openOrders: OpenOrder[]) => {
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
            await queryClient.invalidateQueries({ queryKey: ['allowances'] })
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
            value: formatPreciseAmountString(
              amount,
              prices[currency.address] ?? 0,
            ),
            direction,
          })),
        }
        setConfirmation(confirmation)
        await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
          (hash) => {
            setConfirmation(undefined)
            queuePendingTransaction({
              ...confirmation,
              txHash: hash,
              type: 'claim',
              timestamp: currentTimestampInSeconds(),
            })
          },
          (receipt) => {
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              type: 'claim',
              timestamp: currentTimestampInSeconds(),
              blockNumber: Number(receipt.blockNumber),
              success: receipt.status === 'success',
            })
          },
        )
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['open-orders'] }),
          queryClient.invalidateQueries({ queryKey: ['market'] }),
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
      updatePendingTransaction,
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
