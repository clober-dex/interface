import React, { useCallback, useEffect } from 'react'
import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { useDisconnect, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { Transaction, Transaction as SdkTransaction } from '@clober/v2-sdk'

import { Currency } from '../../model/currency'
import { formatUnits } from '../../utils/bigint'
import { Confirmation, useTransactionContext } from '../transaction-context'
import { sendTransaction } from '../../utils/transaction'
import { useCurrencyContext } from '../currency-context'
import { maxApprove } from '../../utils/approve20'
import { Aggregator } from '../../model/aggregator'
import { useChainContext } from '../chain-context'
import { currentTimestampInSeconds } from '../../utils/date'
import { toPlacesAmountString } from '../../utils/bignumber'
import { CHAIN_CONFIG } from '../../chain-configs'

type SwapContractContext = {
  swap: (
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    expectedAmountOut: bigint,
    aggregator: Aggregator,
    transaction: Transaction,
  ) => Promise<void>
}

const Context = React.createContext<SwapContractContext>({
  swap: () => Promise.resolve(),
})

export const SwapContractProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const queryClient = useQueryClient()
  const { disconnectAsync } = useDisconnect()

  const { data: walletClient } = useWalletClient()
  const {
    setConfirmation,
    pendingTransactions,
    queuePendingTransaction,
    dequeuePendingTransaction,
  } = useTransactionContext()
  const { selectedChain } = useChainContext()
  const { allowances, prices, balances } = useCurrencyContext()

  useEffect(() => {
    pendingTransactions.forEach((transaction) => {
      if (!transaction.success) {
        dequeuePendingTransaction(transaction.txHash)
        return
      }
      if (transaction.type === 'swap' || transaction.type === 'market') {
        dequeuePendingTransaction(transaction.txHash)
      }
    })
  }, [
    dequeuePendingTransaction,
    pendingTransactions,
    balances, // for 'swap' type or 'market' type
  ])

  const swap = useCallback(
    async (
      inputCurrency: Currency,
      amountIn: bigint,
      outputCurrency: Currency,
      expectedAmountOut: bigint,
      aggregator: Aggregator,
      transaction: Transaction,
    ) => {
      if (!walletClient) {
        return
      }
      let isAllowanceChanged = false

      try {
        setConfirmation({
          title: 'Swap',
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })

        const spender = getAddress(aggregator.contract)
        if (
          !isAddressEqual(spender, CHAIN_CONFIG.REFERENCE_CURRENCY.address) &&
          !isAddressEqual(inputCurrency.address, zeroAddress) &&
          allowances[getAddress(spender)][getAddress(inputCurrency.address)] <
            amountIn
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

        const confirmation = {
          title: 'Swap',
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              currency: inputCurrency,
              label: inputCurrency.symbol,
              direction: 'in',
              value: toPlacesAmountString(
                formatUnits(amountIn, inputCurrency.decimals),
                prices[getAddress(inputCurrency.address)] ?? 0,
              ),
            },
            {
              currency: outputCurrency,
              label: outputCurrency.symbol,
              direction: 'out',
              value: toPlacesAmountString(
                formatUnits(expectedAmountOut, outputCurrency.decimals),
                prices[getAddress(outputCurrency.address)] ?? 0,
              ),
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)

        const transactionReceipt = await sendTransaction(
          selectedChain,
          walletClient,
          transaction as SdkTransaction,
          disconnectAsync,
        )
        if (transactionReceipt) {
          queuePendingTransaction({
            ...confirmation,
            txHash: transactionReceipt.transactionHash,
            success: transactionReceipt.status === 'success',
            blockNumber: Number(transactionReceipt.blockNumber),
            type: aggregator.name === 'CloberV2' ? 'market' : 'swap',
            timestamp: currentTimestampInSeconds(),
          })
        }
      } catch (e) {
        await queryClient.invalidateQueries({ queryKey: ['quotes'] })
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          isAllowanceChanged
            ? queryClient.invalidateQueries({ queryKey: ['allowances'] })
            : undefined,
        ])
        setConfirmation(undefined)
      }
    },
    [
      walletClient,
      setConfirmation,
      selectedChain,
      allowances,
      prices,
      disconnectAsync,
      queuePendingTransaction,
      queryClient,
    ],
  )

  return (
    <Context.Provider
      value={{
        swap,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useSwapContractContext = () =>
  React.useContext(Context) as SwapContractContext
