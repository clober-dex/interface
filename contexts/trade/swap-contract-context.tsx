import React, { useCallback } from 'react'
import { getAddress, isAddressEqual, parseUnits, zeroAddress } from 'viem'
import { useDisconnect, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { Transaction, Transaction as SdkTransaction } from '@clober/v2-sdk'

import { Currency } from '../../model/currency'
import { formatDollarValue, toUnitString } from '../../utils/bigint'
import { Confirmation, useTransactionContext } from '../transaction-context'
import { sendTransaction } from '../../utils/transaction'
import { useCurrencyContext } from '../currency-context'
import { maxApprove } from '../../utils/approve20'
import { Aggregator } from '../../model/aggregator'
import { useChainContext } from '../chain-context'
import { currentTimestampInSeconds } from '../../utils/date'
import { toPreciseString, formatWithCommas } from '../../utils/bignumber'
import { CHAIN_CONFIG } from '../../chain-configs'
import { executors } from '../../chain-configs/executors'
import Modal from '../../components/modal/modal'

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
  const [showRevertModal, setShowRevertModal] = React.useState(false)
  const queryClient = useQueryClient()
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
  const { getAllowance, prices } = useCurrencyContext()

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
        if (
          !isAddressEqual(spender, CHAIN_CONFIG.REFERENCE_CURRENCY.address) &&
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
                  aggregator.name === CHAIN_CONFIG.DEX_NAME ? 'market' : 'swap',
                timestamp: currentTimestampInSeconds(),
              })
            },
            (receipt) => {
              updatePendingTransaction({
                ...confirmation,
                txHash: receipt.transactionHash,
                type:
                  aggregator.name === CHAIN_CONFIG.DEX_NAME ? 'market' : 'swap',
                timestamp: currentTimestampInSeconds(),
                blockNumber: Number(receipt.blockNumber),
                success: receipt.status === 'success',
              })
            },
            gasPrice,
            selectedExecutorName,
          )
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
        <Modal
          show
          onClose={() => {
            setShowRevertModal(false)
          }}
          onButtonClick={() => {
            setShowRevertModal(false)
          }}
        >
          <h1 className="flex font-bold text-xl mb-2">Transaction Reverted</h1>
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
