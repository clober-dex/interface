import React, { useCallback } from 'react'
import { BridgeAndExecuteParams } from '@avail-project/nexus-core'
import { parseUnits } from 'viem'
import { CurrencyFlow } from '@clober/v2-sdk'
import { usePublicClient } from 'wagmi'

import { Chain } from '../model/chain'
import { formatWithCommas, toPreciseString } from '../utils/bignumber'
import { formatDollarValue } from '../utils/bigint'
import { Currency } from '../model/currency'
import { currentTimestampInSeconds } from '../utils/date'
import { TransactionType } from '../model/transaction-type'

import { useNexus } from './nexus-context'
import { Confirmation, useTransactionContext } from './transaction-context'
import { useCurrencyContext } from './currency-context'
import { useChainContext } from './chain-context'

type BridgeAndExecuteContext = {
  bridgeAndExecute(
    params: BridgeAndExecuteParams,
    outputCurrencyFlow: CurrencyFlow,
    transactionType: TransactionType,
  ): Promise<void>
}

const Context = React.createContext<BridgeAndExecuteContext | null>(null)

export const BridgeAndExecuteProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const publicClient = usePublicClient()
  const { selectedChain } = useChainContext()
  const { setConfirmation, queuePendingTransaction, updatePendingTransaction } =
    useTransactionContext()
  const { prices } = useCurrencyContext()
  const { nexusSDK } = useNexus()

  const bridgeAndExecute = useCallback(
    async (
      params: BridgeAndExecuteParams,
      outputCurrencyFlow: CurrencyFlow,
      transactionType: TransactionType,
    ) => {
      if (!nexusSDK || !publicClient) {
        return
      }

      const bridgeAndExecuteSimulationResult =
        await nexusSDK.simulateBridgeAndExecute(params)

      const inputCurrency =
        bridgeAndExecuteSimulationResult.bridgeSimulation?.token!
      const confirmation = {
        title: `Bridge & ${transactionType.charAt(0).toUpperCase()}${transactionType.slice(1)}`,
        body: 'Please confirm in your wallet.',
        chain: selectedChain,
        fields: [
          ...(
            bridgeAndExecuteSimulationResult.bridgeSimulation?.intent
              ?.allSources ?? []
          ).map(({ amount, chainName, chainID, chainLogo }) => ({
            currency: {
              ...inputCurrency,
              address: inputCurrency.contractAddress,
            },
            label: inputCurrency.symbol,
            direction: 'in',
            chain: {
              id: chainID,
              name: chainName,
              icon: chainLogo,
            } as Chain,
            primaryText: toPreciseString(
              amount,
              prices[inputCurrency.contractAddress],
              formatWithCommas,
            ),
            secondaryText: formatDollarValue(
              parseUnits(amount, inputCurrency.decimals),
              inputCurrency.decimals,
              prices[inputCurrency.contractAddress],
            ),
          })),
          {
            currency: outputCurrencyFlow.currency as Currency,
            label: outputCurrencyFlow.currency.symbol,
            direction: 'out',
            chain: selectedChain,
            primaryText: toPreciseString(
              outputCurrencyFlow.amount,
              prices[outputCurrencyFlow.currency.address],
              formatWithCommas,
            ),
            secondaryText: formatDollarValue(
              parseUnits(
                outputCurrencyFlow.amount,
                outputCurrencyFlow.currency.decimals,
              ),
              outputCurrencyFlow.currency.decimals,
              prices[outputCurrencyFlow.currency.address],
            ),
          },
        ] as Confirmation['fields'],
      }
      setConfirmation(confirmation)

      const bridgeAndExecuteResult = await nexusSDK.bridgeAndExecute(params)

      queuePendingTransaction({
        ...confirmation,
        txHash: bridgeAndExecuteResult.executeTransactionHash as `0x${string}`,
        type: transactionType,
        timestamp: currentTimestampInSeconds(),
      })

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: bridgeAndExecuteResult.executeTransactionHash as `0x${string}`,
      })

      updatePendingTransaction({
        ...confirmation,
        txHash: receipt.transactionHash,
        type: transactionType,
        timestamp: currentTimestampInSeconds(),
        blockNumber: Number(receipt.blockNumber),
        success: receipt.status === 'success',
      })
    },
    [
      nexusSDK,
      prices,
      publicClient,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
    ],
  )

  return (
    <Context.Provider value={{ bridgeAndExecute }}>{children}</Context.Provider>
  )
}

export const useBridgeAndExecuteContext = () =>
  React.useContext(Context) as BridgeAndExecuteContext
