import React, { useCallback, useMemo } from 'react'
import { BridgeAndExecuteParams, NEXUS_EVENTS } from '@avail-project/nexus-core'
import { numberToHex, parseUnits } from 'viem'
import { usePublicClient } from 'wagmi'

import { Chain } from '../model/chain'
import { formatWithCommas, toPreciseString } from '../utils/bignumber'
import { formatDollarValue, toUnitString } from '../utils/bigint'
import { Currency, LpCurrency } from '../model/currency'
import { currentTimestampInSeconds } from '../utils/date'
import { TransactionType } from '../model/transaction-type'
import { OutlinkSvg } from '../components/svg/outlink-svg'

import { useNexus } from './nexus-context'
import { Confirmation, useTransactionContext } from './transaction-context'
import { useCurrencyContext } from './currency-context'
import { useChainContext } from './chain-context'

type BridgeAndExecuteContext = {
  bridgeAndExecute(
    params: BridgeAndExecuteParams,
    transactionType: TransactionType,
    title: string,
    outputCurrencyFlow?: {
      currency: Currency | LpCurrency
      amount: string
      direction: 'in' | 'out'
      price?: number
    },
  ): Promise<void>
}

const Context = React.createContext<BridgeAndExecuteContext | null>(null)

const STEPS = [
  { name: 'INTENT_SUBMITTED', index: 0 },
  { name: 'INTENT_COLLECTION', index: 1 },
  { name: 'INTENT_COLLECTION_COMPLETE', index: 2 },
  { name: 'INTENT_FULFILLED', index: 3 },
]

const Steps = ({
  type,
  externalLink,
}: {
  type: string
  externalLink?: string
}) => {
  const currentStep = useMemo(
    () => STEPS.find(({ name }) => name === type),
    [type],
  )

  return (
    currentStep && (
      <nav
        aria-label="Progress"
        className="flex items-center justify-center mt-1 w-full"
      >
        <a
          href={externalLink}
          target="_blank"
          className="flex flex-row gap-1.5 items-center justify-center text-xs text-white underline"
          rel="noopener"
        >
          Step {currentStep.index + 1} of {STEPS.length}
          <OutlinkSvg className="w-3 h-3" />
        </a>
        <ol role="list" className="ml-6 flex items-center space-x-5">
          {STEPS.map((step) => (
            <li key={step.name}>
              {step.index < currentStep.index ? (
                <div className="block size-2.5 rounded-full hover:bg-indigo-900 bg-indigo-500 dark:hover:bg-indigo-400">
                  <span className="sr-only">Step {step.index + 1}</span>
                </div>
              ) : step.index === currentStep.index ? (
                <div
                  aria-current="step"
                  className="relative flex items-center justify-center"
                >
                  <span
                    aria-hidden="true"
                    className="absolute flex size-5 p-px"
                  >
                    <span className="size-full rounded-full bg-indigo-900" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="relative block size-2.5 rounded-full bg-indigo-500"
                  />
                  <span className="sr-only">Step {step.index + 1}</span>
                </div>
              ) : (
                <div className="block size-2.5 rounded-full bg-white/15 hover:bg-white/25">
                  <span className="sr-only">Step {step.index + 1}</span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>
    )
  )
}

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
      transactionType: TransactionType,
      title: string,
      outputCurrencyFlow?: {
        currency: Currency | LpCurrency
        amount: string
        direction: 'in' | 'out'
        price?: number
      },
    ) => {
      if (!nexusSDK || !publicClient) {
        return
      }

      const bridgeAndExecuteSimulationResult =
        await nexusSDK.simulateBridgeAndExecute(params)

      const inputCurrency =
        bridgeAndExecuteSimulationResult.bridgeSimulation?.token!

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

      const footer = (
        <div className="flex flex-row gap-1 text-xs justify-end">
          <span className="text-gray-50">Bridge Fee:</span>
          {toPreciseString(
            bridgeAndExecuteSimulationResult.bridgeSimulation?.intent?.fees
              ?.total ?? '0',
            prices[inputCurrency.contractAddress],
            formatWithCommas,
          )}{' '}
          {bridgeAndExecuteSimulationResult.bridgeSimulation?.token.symbol}
        </div>
      )

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
        title,
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
          outputCurrencyFlow
            ? {
                currency: outputCurrencyFlow.currency,
                label: outputCurrencyFlow.currency.symbol,
                direction: 'out',
                chain: selectedChain,
                primaryText: toPreciseString(
                  outputCurrencyFlow.amount,
                  outputCurrencyFlow.price ??
                    prices[outputCurrencyFlow.currency.address] ??
                    undefined,
                  formatWithCommas,
                ),
                secondaryText: formatDollarValue(
                  parseUnits(
                    outputCurrencyFlow.amount,
                    outputCurrencyFlow.currency.decimals,
                  ),
                  outputCurrencyFlow.currency.decimals,
                  outputCurrencyFlow.price ??
                    prices[outputCurrencyFlow.currency.address] ??
                    undefined,
                ),
              }
            : null,
        ].filter(
          (field): field is Exclude<typeof field, null> => field !== null,
        ) as Confirmation['fields'],
        footer,
      }
      setConfirmation(bridgeAndExecuteConfirmation)

      let hexIntentID: `0x${string}` | undefined = undefined
      const bridgeAndExecuteResult = await nexusSDK.bridgeAndExecute(params, {
        onEvent: async (event) => {
          if (event.name === NEXUS_EVENTS.STEP_COMPLETE) {
            setConfirmation({
              ...bridgeAndExecuteConfirmation,
              footer: (
                <div className="flex flex-col gap-1 w-full">
                  {!STEPS.find(({ name }) => name === event.args.type) &&
                    footer}
                  <Steps
                    type={event.args.type}
                    externalLink={(event.args as any).data?.explorerURL}
                  />
                </div>
              ),
            })

            if (event.args.type === 'INTENT_SUBMITTED') {
              hexIntentID = numberToHex(
                event.args.data.intentID,
              ) as `0x${string}`

              queuePendingTransaction({
                ...bridgeConfirmation,
                txHash: hexIntentID,
                type: 'bridge',
                timestamp: currentTimestampInSeconds(),
                externalLink: event.args.data.explorerURL,
              })
            } else if (event.args.type === 'INTENT_FULFILLED' && hexIntentID) {
              const intents = await nexusSDK.getMyIntents()
              const currentIntent = intents.find(
                (intent) => hexIntentID === numberToHex(intent.id),
              )

              if (currentIntent) {
                const now = currentTimestampInSeconds()
                updatePendingTransaction({
                  ...bridgeAndExecuteConfirmation,
                  txHash: hexIntentID,
                  type: transactionType,
                  timestamp: now,
                  blockNumber: 1,
                  success: true,
                })
              }
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
