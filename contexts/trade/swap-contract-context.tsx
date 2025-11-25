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
import { useNexus } from '../nexus-context'
import { useBridgeAndExecuteContext } from '../bridge-and-execute-context'
import { aggregators } from '../../chain-configs/aggregators'
import { adjustQuotes } from '../../apis/swap/quote'
import { Quote } from '../../model/aggregator/quote'
import TransactionRevertModal from '../../components/modal/transaction-revert-modal'

import { useTradeContext } from './trade-context'

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
  const [showBridgeRevertModal, setShowBridgeRevertModal] =
    React.useState(false)
  const [showMevRevertModal, setShowMevRevertModal] = React.useState(false)
  const queryClient = useQueryClient()
  const { nexusSDK } = useNexus()
  const { disconnectAsync } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const {
    setConfirmation,
    queuePendingTransaction,
    updatePendingTransaction,
    setSelectedExecutorName,
    selectedExecutorName,
    gasPrice,
  } = useTransactionContext()
  const { setSlippageInput } = useTradeContext()
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
                    timestamp: Date.now(),
                    amountIn,
                    amountOut: quote.amountOut,
                    fee: 0n,
                    gasLimit: quote.gasLimit,
                    gasUsd: 0,
                    netAmountOutUsd: 0,
                    executionMilliseconds: quote.executionMilliseconds,
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
                  }))
                  .filter((quote) => quote.transaction)
                  .sort((a, b) => Number(b.amountOut - a.amountOut))

                const { best } = adjustQuotes(
                  results as Quote[],
                  inputCurrency,
                  outputCurrency,
                )
                let newTransaction: Transaction = transaction
                console.log('best quote after bridge:', {
                  bestAmountOut: expectedAmountOut,
                  newBestAmountOut: (best?.amountOut ?? 0n) - (best?.fee ?? 0n),
                })
                if (
                  best &&
                  best.transaction &&
                  best.amountOut - best.fee >= expectedAmountOut
                ) {
                  newTransaction = best.transaction
                } else {
                  throw new Error('No suitable quote found after bridging.')
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
        if (
          (e as any).message
            .toString()
            .includes('No suitable quote found after bridging.')
        ) {
          setShowBridgeRevertModal(true)
        } else if (
          !(e as any).toString().includes('User rejected the request.')
        ) {
          setShowMevRevertModal(true)
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
      {showMevRevertModal && selectedExecutorName && (
        <TransactionRevertModal
          revertReason={
            'Your transaction was reverted due to MEV protection. Please try again with the MEV protection disabled.'
          }
          buttonText="Disable MEV Protection"
          onClick={() => {
            setSelectedExecutorName(null)
            setShowMevRevertModal(false)
          }}
          onClose={() => setShowMevRevertModal(false)}
        />
      )}
      {showBridgeRevertModal && (
        <TransactionRevertModal
          revertReason={
            'Your transaction was reverted. This may be due to low slippage tolerance. Consider increasing your slippage tolerance and trying again.'
          }
          buttonText="Increase Slippage"
          onClick={() => {
            setSlippageInput(
              (CHAIN_CONFIG.SLIPPAGE_PERCENT.MEDIUM + 0.5).toString(),
            )
            setShowBridgeRevertModal(false)
          }}
          onClose={() => setShowBridgeRevertModal(false)}
        />
      )}
      {children}
    </Context.Provider>
  )
}

export const useSwapContractContext = () =>
  React.useContext(Context) as SwapContractContext
