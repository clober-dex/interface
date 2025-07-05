import React, { useCallback, useEffect, useMemo } from 'react'
import { useAccount, useDisconnect, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import {
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  Hash,
  http,
  isAddressEqual,
  parseAbiParameters,
  zeroAddress,
} from 'viem'
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js'

import { Asset } from '../../model/futures/asset'
import { useCurrencyContext } from '../currency-context'
import { Confirmation, useTransactionContext } from '../transaction-context'
import { maxApprove } from '../../utils/approve20'
import { useChainContext } from '../chain-context'
import { formatUnits } from '../../utils/bigint'
import { FUTURES_MARKET_ABI } from '../../abis/futures/futures-market-abi'
import { FuturesPosition } from '../../model/futures/futures-position'
import { buildTransaction, sendTransaction } from '../../utils/transaction'
import { currentTimestampInSeconds } from '../../utils/date'
import { Currency } from '../../model/currency'
import { deduplicateCurrencies } from '../../utils/currency'
import { formatPreciseAmountString } from '../../utils/bignumber'
import { CHAIN_CONFIG } from '../../chain-configs'
import { PYTH_ORACLE_ABI } from '../../abis/futures/pyth-oracle-abi'

type FuturesContractContext = {
  borrow: (
    asset: Asset,
    collateralAmount: bigint,
    debtAmount: bigint,
    onClose: () => void,
  ) => Promise<Hash | undefined>
  repay: (
    asset: Asset,
    debtAmount: bigint,
    onClose: () => void,
  ) => Promise<Hash | undefined>
  repayAll: (
    position: FuturesPosition,
    onClose: () => void,
  ) => Promise<Hash | undefined>
  settle: (asset: Asset) => Promise<Hash | undefined>
  close: (asset: Asset, collateralReceived: bigint) => Promise<Hash | undefined>
  redeem: (
    asset: Asset,
    amount: bigint,
    collateralReceived: bigint,
  ) => Promise<Hash | undefined>
  addCollateral: (
    asset: Asset,
    amount: bigint,
    onClose: () => void,
  ) => Promise<Hash | undefined>
  removeCollateral: (
    asset: Asset,
    amount: bigint,
    onClose: () => void,
  ) => Promise<Hash | undefined>
  pendingPositionCurrencies: Currency[]
}

const Context = React.createContext<FuturesContractContext>({
  borrow: () => Promise.resolve(undefined),
  repay: () => Promise.resolve(undefined),
  repayAll: () => Promise.resolve(undefined),
  settle: () => Promise.resolve(undefined),
  close: () => Promise.resolve(undefined),
  redeem: () => Promise.resolve(undefined),
  addCollateral: () => Promise.resolve(undefined),
  removeCollateral: () => Promise.resolve(undefined),
  pendingPositionCurrencies: [],
})

export const LOCAL_STORAGE_PENDING_POSITIONS_KEY = (address: `0x${string}`) =>
  `pending-futures-positions-currencies-for-${address}`

export const FuturesContractProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
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
  const { address: userAddress } = useAccount()
  const { getAllowance, prices } = useCurrencyContext()
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: selectedChain,
      transport: http(CHAIN_CONFIG.RPC_URL),
    })
  }, [selectedChain])

  const [pendingPositionCurrencies, setPendingPositionCurrencies] =
    React.useState<Currency[]>([])

  const queuePendingPositionCurrency = useCallback(
    (currency: Currency) => {
      if (userAddress) {
        setPendingPositionCurrencies((prev) => {
          const newCurrencies = deduplicateCurrencies([...prev, currency])
          localStorage.setItem(
            LOCAL_STORAGE_PENDING_POSITIONS_KEY(userAddress),
            JSON.stringify(newCurrencies),
          )
          return newCurrencies
        })
      }
    },
    [userAddress],
  )

  const dequeuePendingPositionCurrency = useCallback(
    (currency: Currency) => {
      if (userAddress) {
        setPendingPositionCurrencies((prev) => {
          const newCurrencies = prev.filter(
            (c) => !isAddressEqual(c.address, currency.address),
          )
          localStorage.setItem(
            LOCAL_STORAGE_PENDING_POSITIONS_KEY(userAddress),
            JSON.stringify(newCurrencies),
          )
          return newCurrencies
        })
      }
    },
    [userAddress],
  )

  useEffect(() => {
    setPendingPositionCurrencies(
      userAddress
        ? JSON.parse(
            localStorage.getItem(
              LOCAL_STORAGE_PENDING_POSITIONS_KEY(userAddress),
            ) ?? '[]',
          )
        : [],
    )
  }, [userAddress])

  const borrow = useCallback(
    async (
      asset: Asset,
      collateralAmount: bigint,
      debtAmount: bigint,
      onClose: () => void,
    ): Promise<Hash | undefined> => {
      if (!walletClient) {
        return
      }

      try {
        setConfirmation({
          title: `Mint ${asset.currency.symbol}`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })

        const spender = CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket
        if (
          !isAddressEqual(spender, CHAIN_CONFIG.REFERENCE_CURRENCY.address) &&
          !isAddressEqual(asset.collateral.address, zeroAddress) &&
          getAllowance(spender, asset.collateral) < collateralAmount
        ) {
          const confirmation = {
            title: `Max Approve ${asset.collateral.symbol}`,
            body: 'Please confirm in your wallet.',
            chain: selectedChain,
            fields: [],
          }
          setConfirmation(confirmation)
          await maxApprove(
            selectedChain,
            walletClient,
            asset.collateral,
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
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['allowances'] }),
              ])
            },
            selectedExecutorName,
          )
        }
        // If the collateral is the native currency, we don't need to approve
        else {
          const confirmation = {
            title: `Mint ${asset.currency.symbol}`,
            body: 'Please confirm in your wallet.',
            chain: selectedChain,
            fields: [
              {
                currency: asset.collateral,
                label: asset.collateral.symbol,
                direction: 'in',
                value: formatPreciseAmountString(
                  formatUnits(collateralAmount, asset.collateral.decimals),
                  prices[asset.collateral.address],
                ),
              },
              {
                currency: asset.currency,
                label: asset.currency.symbol,
                direction: 'out',
                value: formatPreciseAmountString(
                  formatUnits(debtAmount, asset.currency.decimals),
                  prices[asset.currency.address],
                ),
              },
            ].filter((field) => field.value !== '0') as any[],
          }
          setConfirmation(confirmation)

          const evmPriceServiceConnection = new EvmPriceServiceConnection(
            CHAIN_CONFIG.PYTH_HERMES_ENDPOINT,
          )
          const priceFeedUpdateData =
            await evmPriceServiceConnection.getPriceFeedsUpdateData([
              asset.collateral.priceFeedId,
            ])

          if (priceFeedUpdateData.length === 0) {
            console.error('Price feed not found')
            return
          }

          const fee = await publicClient.readContract({
            address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.PythOracle,
            abi: PYTH_ORACLE_ABI,
            functionName: 'getUpdateFee',
            args: [priceFeedUpdateData as any],
          })

          const transaction = await buildTransaction(
            publicClient,
            {
              chain: selectedChain,
              address: spender,
              functionName: 'multicall',
              abi: FUTURES_MARKET_ABI,
              value: fee,
              args: [
                [
                  encodeFunctionData({
                    abi: FUTURES_MARKET_ABI,
                    functionName: 'updateOracle',
                    args: [
                      encodeAbiParameters(parseAbiParameters('bytes[]'), [
                        priceFeedUpdateData as any,
                      ]),
                    ],
                  }),
                  encodeFunctionData({
                    abi: FUTURES_MARKET_ABI,
                    functionName: 'deposit',
                    args: [
                      asset.currency.address,
                      walletClient.account.address,
                      collateralAmount,
                    ],
                  }),
                  encodeFunctionData({
                    abi: FUTURES_MARKET_ABI,
                    functionName: 'mint',
                    args: [
                      asset.currency.address,
                      walletClient.account.address,
                      debtAmount,
                    ],
                  }),
                ],
              ],
            },
            5_000_000n,
          )
          const transactionReceipt = await sendTransaction(
            selectedChain,
            walletClient,
            transaction,
            disconnectAsync,
            (hash) => {
              setConfirmation(undefined)
              onClose()
              queuePendingPositionCurrency(asset.currency)
              queuePendingTransaction({
                ...confirmation,
                txHash: hash,
                type: 'borrow',
                timestamp: currentTimestampInSeconds(),
              })
            },
            async (receipt) => {
              await queryClient.invalidateQueries({
                queryKey: ['futures-positions'],
              })
              dequeuePendingPositionCurrency(asset.currency)
              updatePendingTransaction({
                ...confirmation,
                txHash: receipt.transactionHash,
                type: 'borrow',
                timestamp: currentTimestampInSeconds(),
                blockNumber: Number(receipt.blockNumber),
                success: receipt.status === 'success',
              })
            },
            gasPrice,
            selectedExecutorName,
          )
          return transactionReceipt?.transactionHash
        }
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          // queryClient.invalidateQueries({ queryKey: ['futures-positions'] }),
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
      gasPrice,
      selectedExecutorName,
      getAllowance,
      dequeuePendingPositionCurrency,
      disconnectAsync,
      prices,
      publicClient,
      queryClient,
      queuePendingPositionCurrency,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
      walletClient,
    ],
  )

  const repay = useCallback(
    async (
      asset: Asset,
      debtAmount: bigint,
      onClose: () => void,
    ): Promise<Hash | undefined> => {
      if (!walletClient) {
        return
      }

      try {
        setConfirmation({
          title: `Repay ${asset.currency.symbol}`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })

        const confirmation = {
          title: `Repay ${asset.currency.symbol}`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              currency: asset.currency,
              label: asset.currency.symbol,
              direction: 'in',
              value: formatPreciseAmountString(
                formatUnits(debtAmount, asset.currency.decimals),
                prices[asset.currency.address],
              ),
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)

        const transaction = await buildTransaction(
          publicClient,
          {
            chain: selectedChain,
            address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
            functionName: 'multicall',
            abi: FUTURES_MARKET_ABI,
            args: [
              [
                encodeFunctionData({
                  abi: FUTURES_MARKET_ABI,
                  functionName: 'burn',
                  args: [
                    asset.currency.address,
                    walletClient.account.address,
                    debtAmount,
                  ],
                }),
              ],
            ],
          },
          5_000_000n,
        )
        const transactionReceipt = await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
          (hash) => {
            setConfirmation(undefined)
            onClose()
            queuePendingPositionCurrency(asset.currency)
            queuePendingTransaction({
              ...confirmation,
              txHash: hash,
              type: 'repay',
              timestamp: currentTimestampInSeconds(),
            })
          },
          async (receipt) => {
            await queryClient.invalidateQueries({
              queryKey: ['futures-positions'],
            })
            dequeuePendingPositionCurrency(asset.currency)
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              type: 'repay',
              timestamp: currentTimestampInSeconds(),
              blockNumber: Number(receipt.blockNumber),
              success: receipt.status === 'success',
            })
          },
          gasPrice,
          selectedExecutorName,
        )
        return transactionReceipt?.transactionHash
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          // queryClient.invalidateQueries({ queryKey: ['futures-positions'] }),
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
      gasPrice,
      selectedExecutorName,
      dequeuePendingPositionCurrency,
      disconnectAsync,
      prices,
      publicClient,
      queryClient,
      queuePendingPositionCurrency,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
      walletClient,
    ],
  )

  const repayAll = useCallback(
    async (
      userPosition: FuturesPosition,
      onClose: () => void,
    ): Promise<Hash | undefined> => {
      if (!walletClient) {
        return
      }

      try {
        setConfirmation({
          title: `Close ${userPosition.asset.currency.symbol}`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })

        const confirmation = {
          title: `Close ${userPosition.asset.currency.symbol}`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              currency: userPosition.asset.currency,
              label: userPosition.asset.currency.symbol,
              direction: 'in',
              value: formatPreciseAmountString(
                formatUnits(
                  userPosition?.debtAmount ?? 0n,
                  userPosition.asset.currency.decimals,
                ),
                prices[userPosition.asset.currency.address],
              ),
            },
            {
              currency: userPosition.asset.collateral,
              label: userPosition.asset.collateral.symbol,
              direction: 'out',
              value: formatPreciseAmountString(
                formatUnits(
                  userPosition?.collateralAmount ?? 0n,
                  userPosition.asset.collateral.decimals,
                ),
                prices[userPosition.asset.collateral.address],
              ),
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)

        const evmPriceServiceConnection = new EvmPriceServiceConnection(
          CHAIN_CONFIG.PYTH_HERMES_ENDPOINT,
        )
        const priceFeedUpdateData =
          await evmPriceServiceConnection.getPriceFeedsUpdateData([
            userPosition.asset.collateral.priceFeedId,
          ])

        if (priceFeedUpdateData.length === 0) {
          console.error('Price feed not found')
          return
        }

        const fee = await publicClient.readContract({
          address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.PythOracle,
          abi: PYTH_ORACLE_ABI,
          functionName: 'getUpdateFee',
          args: [priceFeedUpdateData as any],
        })

        const transaction = await buildTransaction(
          publicClient,
          {
            chain: selectedChain,
            address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
            functionName: 'multicall',
            abi: FUTURES_MARKET_ABI,
            value: fee,
            args: [
              [
                encodeFunctionData({
                  abi: FUTURES_MARKET_ABI,
                  functionName: 'updateOracle',
                  args: [
                    encodeAbiParameters(parseAbiParameters('bytes[]'), [
                      priceFeedUpdateData as any,
                    ]),
                  ],
                }),
                encodeFunctionData({
                  abi: FUTURES_MARKET_ABI,
                  functionName: 'burn',
                  args: [
                    userPosition.asset.currency.address,
                    walletClient.account.address,
                    userPosition?.debtAmount ?? 0n,
                  ],
                }),
                encodeFunctionData({
                  abi: FUTURES_MARKET_ABI,
                  functionName: 'withdraw',
                  args: [
                    userPosition.asset.currency.address,
                    walletClient.account.address,
                    userPosition?.collateralAmount ?? 0n,
                  ],
                }),
              ],
            ],
          },
          5_000_000n,
        )
        const transactionReceipt = await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
          (hash) => {
            setConfirmation(undefined)
            onClose()
            queuePendingPositionCurrency(userPosition.asset.currency)
            queuePendingTransaction({
              ...confirmation,
              txHash: hash,
              type: 'repay-all',
              timestamp: currentTimestampInSeconds(),
            })
          },
          async (receipt) => {
            await queryClient.invalidateQueries({
              queryKey: ['futures-positions'],
            })
            dequeuePendingPositionCurrency(userPosition.asset.currency)
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              type: 'repay-all',
              timestamp: currentTimestampInSeconds(),
              blockNumber: Number(receipt.blockNumber),
              success: receipt.status === 'success',
            })
          },
          gasPrice,
          selectedExecutorName,
        )
        return transactionReceipt?.transactionHash
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          // queryClient.invalidateQueries({ queryKey: ['futures-positions'] }),
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
      gasPrice,
      selectedExecutorName,
      dequeuePendingPositionCurrency,
      disconnectAsync,
      prices,
      publicClient,
      queryClient,
      queuePendingPositionCurrency,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
      walletClient,
    ],
  )

  const settle = useCallback(
    async (asset: Asset): Promise<Hash | undefined> => {
      if (!walletClient) {
        return
      }

      try {
        const confirmation = {
          title: `Settle ${asset.currency.symbol}`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        }
        setConfirmation(confirmation)

        const evmPriceServiceConnection = new EvmPriceServiceConnection(
          CHAIN_CONFIG.PYTH_HERMES_ENDPOINT,
        )
        const priceFeedUpdateData =
          await evmPriceServiceConnection.getPriceFeedsUpdateData([
            asset.collateral.priceFeedId,
          ])

        if (priceFeedUpdateData.length === 0) {
          console.error('Price feed not found')
          return
        }

        const fee = await publicClient.readContract({
          address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.PythOracle,
          abi: PYTH_ORACLE_ABI,
          functionName: 'getUpdateFee',
          args: [priceFeedUpdateData as any],
        })

        const transaction = await buildTransaction(
          publicClient,
          {
            chain: selectedChain,
            address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
            functionName: 'multicall',
            abi: FUTURES_MARKET_ABI,
            value: fee,
            args: [
              [
                encodeFunctionData({
                  abi: FUTURES_MARKET_ABI,
                  functionName: 'updateOracle',
                  args: [
                    encodeAbiParameters(parseAbiParameters('bytes[]'), [
                      priceFeedUpdateData as any,
                    ]),
                  ],
                }),
                encodeFunctionData({
                  abi: FUTURES_MARKET_ABI,
                  functionName: 'settle',
                  args: [asset.currency.address],
                }),
              ],
            ],
          },
          5_000_000n,
        )
        const transactionReceipt = await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
          (hash) => {
            setConfirmation(undefined)
            queuePendingTransaction({
              ...confirmation,
              txHash: hash,
              type: 'settle',
              timestamp: currentTimestampInSeconds(),
            })
          },
          (receipt) => {
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              type: 'settle',
              timestamp: currentTimestampInSeconds(),
              blockNumber: Number(receipt.blockNumber),
              success: receipt.status === 'success',
            })
          },
          gasPrice,
          selectedExecutorName,
        )
        return transactionReceipt?.transactionHash
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['futures-assets'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
      gasPrice,
      selectedExecutorName,
      disconnectAsync,
      publicClient,
      queryClient,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
      walletClient,
    ],
  )

  const close = useCallback(
    async (
      asset: Asset,
      collateralReceived: bigint,
    ): Promise<Hash | undefined> => {
      if (!walletClient) {
        return
      }

      try {
        const confirmation = {
          title: `Close`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              currency: asset.collateral,
              label: asset.collateral.symbol,
              direction: 'out',
              value: formatPreciseAmountString(
                formatUnits(collateralReceived, asset.collateral.decimals),
                prices[asset.collateral.address],
              ),
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)

        const transaction = await buildTransaction(
          publicClient,
          {
            chain: selectedChain,
            address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
            functionName: 'close',
            abi: FUTURES_MARKET_ABI,
            args: [asset.currency.address, walletClient.account.address],
          },
          5_000_000n,
        )
        const transactionReceipt = await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
          (hash) => {
            setConfirmation(undefined)
            queuePendingTransaction({
              ...confirmation,
              txHash: hash,
              type: 'close',
              timestamp: currentTimestampInSeconds(),
            })
          },
          (receipt) => {
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              type: 'close',
              timestamp: currentTimestampInSeconds(),
              blockNumber: Number(receipt.blockNumber),
              success: receipt.status === 'success',
            })
          },
          gasPrice,
          selectedExecutorName,
        )
        return transactionReceipt?.transactionHash
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['futures-positions'] }),
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
      gasPrice,
      selectedExecutorName,
      disconnectAsync,
      prices,
      publicClient,
      queryClient,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
      walletClient,
    ],
  )

  const redeem = useCallback(
    async (
      asset: Asset,
      amount: bigint,
      collateralReceived: bigint,
    ): Promise<Hash | undefined> => {
      if (!walletClient) {
        return
      }

      try {
        const confirmation = {
          title: `Redeem`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              currency: asset.currency,
              label: asset.currency.symbol,
              direction: 'in',
              value: formatPreciseAmountString(
                formatUnits(amount, asset.currency.decimals),
                prices[asset.currency.address],
              ),
            },
            {
              currency: asset.collateral,
              label: asset.collateral.symbol,
              direction: 'out',
              value: formatPreciseAmountString(
                formatUnits(collateralReceived, asset.collateral.decimals),
                prices[asset.collateral.address],
              ),
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)

        const transaction = await buildTransaction(
          publicClient,
          {
            chain: selectedChain,
            address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
            functionName: 'redeem',
            abi: FUTURES_MARKET_ABI,
            args: [
              asset.currency.address,
              walletClient.account.address,
              amount,
            ],
          },
          1_000_000n,
        )
        const transactionReceipt = await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
          (hash) => {
            setConfirmation(undefined)
            queuePendingTransaction({
              ...confirmation,
              txHash: hash,
              type: 'redeem',
              timestamp: currentTimestampInSeconds(),
            })
          },
          (receipt) => {
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              type: 'redeem',
              timestamp: currentTimestampInSeconds(),
              blockNumber: Number(receipt.blockNumber),
              success: receipt.status === 'success',
            })
          },
          gasPrice,
          selectedExecutorName,
        )
        return transactionReceipt?.transactionHash
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['futures-positions'] }),
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
      gasPrice,
      selectedExecutorName,
      disconnectAsync,
      prices,
      publicClient,
      queryClient,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
      walletClient,
    ],
  )

  const addCollateral = useCallback(
    async (
      asset: Asset,
      amount: bigint,
      onClose: () => void,
    ): Promise<Hash | undefined> => {
      if (!walletClient) {
        return
      }

      try {
        const confirmation = {
          title: `Add Collateral`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              currency: asset.collateral,
              label: asset.collateral.symbol,
              direction: 'in',
              value: formatPreciseAmountString(
                formatUnits(amount, asset.collateral.decimals),
                prices[asset.collateral.address],
              ),
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)

        const transaction = await buildTransaction(
          publicClient,
          {
            chain: selectedChain,
            address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
            functionName: 'deposit',
            abi: FUTURES_MARKET_ABI,
            args: [
              asset.currency.address,
              walletClient.account.address,
              amount,
            ],
          },
          1_000_000n,
        )
        const transactionReceipt = await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
          (hash) => {
            setConfirmation(undefined)
            onClose()
            queuePendingPositionCurrency(asset.currency)
            queuePendingTransaction({
              ...confirmation,
              txHash: hash,
              type: 'add-collateral',
              timestamp: currentTimestampInSeconds(),
            })
          },
          async (receipt) => {
            await queryClient.invalidateQueries({
              queryKey: ['futures-positions'],
            })
            dequeuePendingPositionCurrency(asset.currency)
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              type: 'add-collateral',
              timestamp: currentTimestampInSeconds(),
              blockNumber: Number(receipt.blockNumber),
              success: receipt.status === 'success',
            })
          },
          gasPrice,
          selectedExecutorName,
        )
        return transactionReceipt?.transactionHash
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          // queryClient.invalidateQueries({ queryKey: ['futures-positions'] }),
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
      gasPrice,
      selectedExecutorName,
      dequeuePendingPositionCurrency,
      disconnectAsync,
      prices,
      publicClient,
      queryClient,
      queuePendingPositionCurrency,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
      walletClient,
    ],
  )

  const removeCollateral = useCallback(
    async (
      asset: Asset,
      amount: bigint,
      onClose: () => void,
    ): Promise<Hash | undefined> => {
      if (!walletClient) {
        return
      }

      try {
        const confirmation = {
          title: `Remove Collateral`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              currency: asset.collateral,
              label: asset.collateral.symbol,
              direction: 'out',
              value: formatPreciseAmountString(
                formatUnits(amount, asset.collateral.decimals),
                prices[asset.collateral.address],
              ),
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)

        const evmPriceServiceConnection = new EvmPriceServiceConnection(
          CHAIN_CONFIG.PYTH_HERMES_ENDPOINT,
        )
        const priceFeedUpdateData =
          await evmPriceServiceConnection.getPriceFeedsUpdateData([
            asset.collateral.priceFeedId,
          ])

        if (priceFeedUpdateData.length === 0) {
          console.error('Price feed not found')
          return
        }

        const fee = await publicClient.readContract({
          address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.PythOracle,
          abi: PYTH_ORACLE_ABI,
          functionName: 'getUpdateFee',
          args: [priceFeedUpdateData as any],
        })

        const transaction = await buildTransaction(
          publicClient,
          {
            chain: selectedChain,
            address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.FuturesMarket,
            functionName: 'multicall',
            abi: FUTURES_MARKET_ABI,
            value: fee,
            args: [
              [
                encodeFunctionData({
                  abi: FUTURES_MARKET_ABI,
                  functionName: 'updateOracle',
                  args: [
                    encodeAbiParameters(parseAbiParameters('bytes[]'), [
                      priceFeedUpdateData as any,
                    ]),
                  ],
                }),
                encodeFunctionData({
                  abi: FUTURES_MARKET_ABI,
                  functionName: 'withdraw',
                  args: [
                    asset.currency.address,
                    walletClient.account.address,
                    amount,
                  ],
                }),
              ],
            ],
          },
          5_000_000n,
        )
        const transactionReceipt = await sendTransaction(
          selectedChain,
          walletClient,
          transaction,
          disconnectAsync,
          (hash) => {
            setConfirmation(undefined)
            onClose()
            queuePendingPositionCurrency(asset.currency)
            queuePendingTransaction({
              ...confirmation,
              txHash: hash,
              type: 'remove-collateral',
              timestamp: currentTimestampInSeconds(),
            })
          },
          async (receipt) => {
            await queryClient.invalidateQueries({
              queryKey: ['futures-positions'],
            })
            dequeuePendingPositionCurrency(asset.currency)
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              type: 'remove-collateral',
              timestamp: currentTimestampInSeconds(),
              blockNumber: Number(receipt.blockNumber),
              success: receipt.status === 'success',
            })
          },
          gasPrice,
          selectedExecutorName,
        )
        return transactionReceipt?.transactionHash
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          // queryClient.invalidateQueries({ queryKey: ['futures-positions'] }),
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
      gasPrice,
      selectedExecutorName,
      dequeuePendingPositionCurrency,
      disconnectAsync,
      prices,
      publicClient,
      queryClient,
      queuePendingPositionCurrency,
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
        borrow,
        repay,
        repayAll,
        settle,
        close,
        redeem,
        addCollateral,
        removeCollateral,
        pendingPositionCurrencies,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useFuturesContractContext = () =>
  React.useContext(Context) as FuturesContractContext
