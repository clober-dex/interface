import React, { useCallback } from 'react'
import { getAddress, isAddressEqual, zeroAddress } from 'viem'
import { useAccount, useDisconnect, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import {
  getReferenceCurrency,
  Transaction,
  Transaction as SdkTransaction,
} from '@clober/v2-sdk'

import { Currency } from '../../model/currency'
import { formatDollarValue, toUnitString } from '../../utils/bigint'
import { Confirmation, useTransactionContext } from '../transaction-context'
import { sendTransaction } from '../../utils/transaction'
import { useCurrencyContext } from '../currency-context'
import { maxApprove } from '../../utils/approve20'
import { Aggregator } from '../../model/aggregator'
import { useChainContext } from '../chain-context'
import { currentTimestampInSeconds } from '../../utils/date'
import { formatWithCommas, toPreciseString } from '../../utils/bignumber'
import { CHAIN_CONFIG } from '../../chain-configs'
import { executors } from '../../chain-configs/executors'
import Modal from '../../components/modal/modal'
import { useNexus } from '../nexus-context'
import { useBridgeAndExecuteContext } from '../bridge-and-execute-context'
import { aggregators } from '../../chain-configs/aggregators'

type SwapContractContext = {
  swap: (
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    expectedAmountOut: bigint,
    aggregator: Aggregator,
    slippageLimitPercent: number,
    transaction?: Transaction,
  ) => Promise<void>
}

const Context = React.createContext<SwapContractContext>({
  swap: () => Promise.resolve(),
})

export const SwapContractProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const [showRevertModal, setShowRevertModal] = React.useState(false)
  const queryClient = useQueryClient()
  const { nexusSDK } = useNexus()
  const { disconnectAsync } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const {
    setConfirmation,
    queuePendingTransaction,
    updatePendingTransaction,
    selectedExecutorName,
    gasPrice,
  } = useTransactionContext()
  const { selectedChain } = useChainContext()
  const { getAllowance, prices, balances, remoteChainBalances } =
    useCurrencyContext()
  const { address: userAddress } = useAccount()
  const { bridgeAndExecute } = useBridgeAndExecuteContext()

  const swap = useCallback(
    async (
      inputCurrency: Currency,
      amountIn: bigint,
      outputCurrency: Currency,
      expectedAmountOut: bigint,
      aggregator: Aggregator,
      slippageLimitPercent: number,
      transaction?: Transaction,
    ) => {
      if (!walletClient) {
        return
      }

      try {
        setConfirmation({
          title: 'Swap',
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })

        let spender = getAddress(aggregator.contract)
        if (selectedExecutorName) {
          spender = getAddress(
            executors.find((executor) => executor.name === selectedExecutorName)
              ?.contract || aggregator.contract,
          )
        }
        const ref = getReferenceCurrency({
          chainId: selectedChain.id,
        }).address
        if (
          !isAddressEqual(spender, ref) &&
          !isAddressEqual(inputCurrency.address, zeroAddress) &&
          getAllowance(spender, inputCurrency) < amountIn
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
              await new Promise((resolve) => setTimeout(resolve, 100))
            },
          )
        }
        // do swap
        else if (transaction) {
          const remoteChainBalance =
            remoteChainBalances?.[inputCurrency.address].total ?? 0n
          const balance = balances[inputCurrency.address]

          if (
            nexusSDK &&
            remoteChainBalance + balance >= amountIn &&
            amountIn > balance
          ) {
            await bridgeAndExecute(
              {
                token: inputCurrency.symbol,
                amount: amountIn,
                toChainId: CHAIN_CONFIG.CHAIN.id,
                sourceChains: remoteChainBalances?.[
                  inputCurrency.address
                ].breakdown.map((b) => b.chain.id),
                execute: transaction,
                waitForReceipt: false,
              },
              'swap',
              'Bridge & Swap',
              {
                currency: outputCurrency,
                direction: 'out',
                amount: toUnitString(
                  expectedAmountOut,
                  outputCurrency.decimals,
                ),
              },
              undefined,
              async () => {
                const results = (
                  await Promise.allSettled(
                    aggregators.map(async (aggregator) =>
                      aggregator.quote(
                        inputCurrency,
                        amountIn,
                        outputCurrency,
                        slippageLimitPercent,
                        gasPrice,
                        userAddress,
                      ),
                    ),
                  )
                )
                  .map((result) =>
                    result.status === 'fulfilled' ? result.value : undefined,
                  )
                  .filter(
                    (quote): quote is any =>
                      quote !== undefined && quote.amountOut > 0n,
                  )
                  .map((quote) => ({
                    amountOut: quote.amountOut.toString(),
                    aggregator: quote.aggregator.name,
                    transaction:
                      quote.transaction && userAddress
                        ? {
                            data: quote.transaction.data,
                            gas: quote.transaction.gas.toString(),
                            gasPrice: quote.transaction.gasPrice.toString(),
                            value: quote.transaction.value.toString(),
                            to: quote.transaction.to,
                            from: userAddress,
                          }
                        : null,
                    executionMilliseconds: quote.executionMilliseconds,
                  }))
                  .sort((a, b) => Number(b.amountOut - a.amountOut))

                console.log(
                  'Swap results after bridge:',
                  results?.[0],
                  expectedAmountOut.toString(),
                )
                let newTransaction: Transaction = transaction
                if (
                  results.length > 0 &&
                  results[0].transaction &&
                  results[0].amountOut >= expectedAmountOut.toString()
                ) {
                  newTransaction = results[0].transaction as Transaction
                }

                return {
                  value: newTransaction.value,
                  to: newTransaction.to,
                  data: newTransaction.data,
                }
              },
            )
          } else {
            const confirmation = {
              title: 'Swap',
              body: 'Please confirm in your wallet.',
              chain: selectedChain,
              fields: [
                {
                  currency: inputCurrency,
                  label: inputCurrency.symbol,
                  direction: 'in',
                  primaryText: toPreciseString(
                    toUnitString(amountIn, inputCurrency.decimals),
                    prices[inputCurrency.address],
                    formatWithCommas,
                  ),
                  secondaryText: formatDollarValue(
                    amountIn,
                    inputCurrency.decimals,
                    prices[inputCurrency.address],
                  ),
                },
                {
                  currency: outputCurrency,
                  label: outputCurrency.symbol,
                  direction: 'out',
                  primaryText: toPreciseString(
                    toUnitString(expectedAmountOut, outputCurrency.decimals),
                    prices[outputCurrency.address],
                    formatWithCommas,
                  ),
                  secondaryText: formatDollarValue(
                    expectedAmountOut,
                    outputCurrency.decimals,
                    prices[outputCurrency.address],
                  ),
                },
              ] as Confirmation['fields'],
            }
            setConfirmation(confirmation)

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
                  type:
                    aggregator.name === CHAIN_CONFIG.DEX_NAME
                      ? 'market'
                      : 'swap',
                  timestamp: currentTimestampInSeconds(),
                })
              },
              (receipt) => {
                updatePendingTransaction({
                  ...confirmation,
                  txHash: receipt.transactionHash,
                  type:
                    aggregator.name === CHAIN_CONFIG.DEX_NAME
                      ? 'market'
                      : 'swap',
                  timestamp: currentTimestampInSeconds(),
                  blockNumber: Number(receipt.blockNumber),
                  success: receipt.status === 'success',
                })
              },
              gasPrice,
              selectedExecutorName,
            )
          }
        }
      } catch (e) {
        console.error(e)
        if (!(e as any).toString().includes('User rejected the request.')) {
          setShowRevertModal(true)
        }
      } finally {
        setConfirmation(undefined)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['quotes'] }),
        ])
      }
    },
    [
      userAddress,
      remoteChainBalances,
      bridgeAndExecute,
      balances,
      nexusSDK,
      gasPrice,
      selectedExecutorName,
      getAllowance,
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

  return (
    <Context.Provider
      value={{
        swap,
      }}
    >
      {showRevertModal && selectedExecutorName && (
        <Modal show onClose={() => setShowRevertModal(false)}>
          <h1 className="flex font-semibold text-xl mb-2">
            Transaction Reverted
          </h1>
          <h6 className="text-sm">
            The transaction has been reverted. Please try again with the
            <span className="font-bold text-blue-500">
              {' '}
              Mev Protection
            </span>{' '}
            feature turned off.
          </h6>
        </Modal>
      )}
      {children}
    </Context.Provider>
  )
}

export const useSwapContractContext = () =>
  React.useContext(Context) as SwapContractContext
