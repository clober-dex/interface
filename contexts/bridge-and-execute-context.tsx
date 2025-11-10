import React, { useCallback } from 'react'
import { BridgeAndExecuteParams, NEXUS_EVENTS } from '@avail-project/nexus-core'
import { parseUnits } from 'viem'
import { CurrencyFlow } from '@clober/v2-sdk'
import { usePublicClient } from 'wagmi'

import { Chain } from '../model/chain'
import { formatWithCommas, toPreciseString } from '../utils/bignumber'
import { formatDollarValue, toUnitString } from '../utils/bigint'
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
  const { prices, balances } = useCurrencyContext()
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
      const footer = `Bridge Fee: ${toPreciseString(
        bridgeAndExecuteSimulationResult.bridgeSimulation?.intent?.fees
          ?.total ?? '0',
        prices[inputCurrency.contractAddress],
        formatWithCommas,
      )} ${bridgeAndExecuteSimulationResult.bridgeSimulation?.token.symbol}`

      const bridgeInFields: Confirmation['fields'] = (
        bridgeAndExecuteSimulationResult.bridgeSimulation?.intent?.sources ?? []
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
      }))

      const bridgeConfirmation: Confirmation = {
        title: `Bridge`,
        body: 'Please confirm in your wallet.',
        chain: selectedChain,
        fields: [
          ...bridgeInFields,
          bridgeAndExecuteSimulationResult.bridgeSimulation?.intent
            ? {
                currency: {
                  ...inputCurrency,
                  address: inputCurrency.contractAddress,
                },
                label: inputCurrency.symbol,
                direction: 'out',
                chain: selectedChain,
                primaryText: toPreciseString(
                  bridgeAndExecuteSimulationResult.bridgeSimulation?.intent
                    .destination.amount ?? '0',
                  prices[inputCurrency.contractAddress],
                  formatWithCommas,
                ),
                secondaryText: formatDollarValue(
                  parseUnits(
                    bridgeAndExecuteSimulationResult.bridgeSimulation?.intent
                      .destination.amount ?? '0',
                    inputCurrency.decimals,
                  ),
                  inputCurrency.decimals,
                  prices[inputCurrency.contractAddress],
                ),
              }
            : null,
        ].filter(
          (field): field is Exclude<typeof field, null> => field !== null,
        ) as Confirmation['fields'],
        footer,
      }

      const bridgeAndExecuteConfirmation: Confirmation = {
        title: `Bridge & ${transactionType.charAt(0).toUpperCase()}${transactionType.slice(1)}`,
        body: 'Please confirm in your wallet.',
        chain: selectedChain,
        fields: [
          balances[inputCurrency.contractAddress] > 0n
            ? {
                currency: {
                  ...inputCurrency,
                  address: inputCurrency.contractAddress,
                },
                label: inputCurrency.symbol,
                direction: 'in',
                chain: selectedChain,
                primaryText: toPreciseString(
                  toUnitString(
                    balances[inputCurrency.contractAddress],
                    inputCurrency.decimals,
                  ),
                  prices[inputCurrency.contractAddress],
                  formatWithCommas,
                ),
                secondaryText: formatDollarValue(
                  balances[inputCurrency.contractAddress],
                  inputCurrency.decimals,
                  prices[inputCurrency.contractAddress],
                ),
              }
            : null,
          ...bridgeInFields,
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
        ].filter(
          (field): field is Exclude<typeof field, null> => field !== null,
        ) as Confirmation['fields'],
        footer,
      }
      setConfirmation(bridgeAndExecuteConfirmation)

      let hexIntentID: `0x${string}` | undefined = undefined
      const bridgeAndExecuteResult = await nexusSDK.bridgeAndExecute(params, {
        onEvent: (event) => {
          if (event.name === NEXUS_EVENTS.STEP_COMPLETE) {
            if (event.args.type === 'INTENT_SUBMITTED') {
              hexIntentID = `0x${BigInt(event.args.data.intentID)
                .toString(16)
                .padStart(64, '0')}`
              queuePendingTransaction({
                ...bridgeConfirmation,
                txHash: hexIntentID,
                type: 'bridge',
                timestamp: currentTimestampInSeconds(),
                externalLink: event.args.data.explorerURL,
              })
            } else if (event.args.type === 'INTENT_FULFILLED' && hexIntentID) {
              updatePendingTransaction({
                ...bridgeAndExecuteConfirmation,
                txHash: hexIntentID,
                type: transactionType,
                timestamp: currentTimestampInSeconds(),
                blockNumber: 0,
                success: true,
              })
            }
          }
        },
      })

      queuePendingTransaction({
        ...bridgeAndExecuteConfirmation,
        txHash: bridgeAndExecuteResult.executeTransactionHash as `0x${string}`,
        type: transactionType,
        timestamp: currentTimestampInSeconds(),
      })

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: bridgeAndExecuteResult.executeTransactionHash as `0x${string}`,
      })

      updatePendingTransaction({
        ...bridgeAndExecuteConfirmation,
        txHash: receipt.transactionHash,
        type: transactionType,
        timestamp: currentTimestampInSeconds(),
        blockNumber: Number(receipt.blockNumber),
        success: receipt.status === 'success',
      })
    },
    [
      balances,
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
