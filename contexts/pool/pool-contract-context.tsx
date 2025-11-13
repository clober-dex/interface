import React, { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDisconnect, useWalletClient } from 'wagmi'
import {
  addLiquidity,
  getContractAddresses,
  getPool,
  removeLiquidity,
  unwrapFromERC20,
  wrapToERC20,
} from '@clober/v2-sdk'
import { isAddressEqual, parseUnits, zeroAddress } from 'viem'
import BigNumber from 'bignumber.js'

import { Currency } from '../../model/currency'
import { Confirmation, useTransactionContext } from '../transaction-context'
import { useChainContext } from '../chain-context'
import { useCurrencyContext } from '../currency-context'
import { maxApprove as maxApproveERC20 } from '../../utils/approve20'
import {
  getAllowance as getERC6909Allowance,
  maxApprove as maxApproveERC6909,
} from '../../utils/approve6909'
import {
  formatWithCommas,
  toPreciseString,
  toSignificantString,
} from '../../utils/bignumber'
import { sendTransaction } from '../../utils/transaction'
import { currentTimestampInSeconds } from '../../utils/date'
import { CHAIN_CONFIG } from '../../chain-configs'
import { aggregators } from '../../chain-configs/aggregators'
import Modal from '../../components/modal/modal'
import { formatDollarValue } from '../../utils/bigint'

export type PoolContractContext = {
  mint: (
    currency0: Currency,
    currency1: Currency,
    salt: `0x${string}`,
    amount0: string,
    amount1: string,
    disableSwap: boolean,
    slippage: number,
    lpPrice: number,
  ) => Promise<void>
  burn: (
    currency0: Currency,
    currency1: Currency,
    salt: `0x${string}`,
    lpCurrencyAmount: string,
    slippageInput: string,
    lpPrice: number,
  ) => Promise<void>
  wrap: (
    currency0: Currency,
    currency1: Currency,
    salt: `0x${string}`,
    amount: string,
    lpPrice: number,
  ) => Promise<void>
  unwrap: (
    currency0: Currency,
    currency1: Currency,
    salt: `0x${string}`,
    amount: string,
    lpPrice: number,
  ) => Promise<void>
}

const Context = React.createContext<PoolContractContext>({
  mint: () => Promise.resolve(),
  burn: () => Promise.resolve(),
  wrap: () => Promise.resolve(),
  unwrap: () => Promise.resolve(),
})

export const PoolContractProvider = ({
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
    gasPrice,
  } = useTransactionContext()
  const { selectedChain } = useChainContext()
  const { getAllowance, prices } = useCurrencyContext()

  const mint = useCallback(
    async (
      currency0: Currency,
      currency1: Currency,
      salt: `0x${string}`,
      amount0: string,
      amount1: string,
      disableSwap: boolean,
      slippage: number,
      lpPrice: number,
    ) => {
      if (!walletClient || !selectedChain) {
        return
      }
      console.log('mint', {
        currency0,
        currency1,
        salt,
        amount0,
        amount1,
        disableSwap,
        slippage,
      })

      try {
        setConfirmation({
          title: `Add Liquidity`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })

        const spender = getContractAddresses({
          chainId: selectedChain.id,
        }).Minter
        // Max approve for currency0
        if (
          !isAddressEqual(currency0.address, zeroAddress) &&
          getAllowance(spender, currency0) <
            parseUnits(amount0, currency0.decimals)
        ) {
          const confirmation = {
            title: `Max Approve ${currency0.symbol}`,
            body: 'Please confirm in your wallet.',
            chain: selectedChain,
            fields: [],
          }
          setConfirmation(confirmation)
          await maxApproveERC20(
            selectedChain,
            walletClient,
            currency0,
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
          )
        }

        // Max approve for currency1
        else if (
          !isAddressEqual(currency1.address, zeroAddress) &&
          getAllowance(spender, currency1) <
            parseUnits(amount1, currency1.decimals)
        ) {
          const confirmation = {
            title: `Max Approve ${currency1.symbol}`,
            body: 'Please confirm in your wallet.',
            chain: selectedChain,
            fields: [],
          }
          setConfirmation(confirmation)
          await maxApproveERC20(
            selectedChain,
            walletClient,
            currency1,
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
          )
        }

        // If both currencies have sufficient allowance, proceed to add liquidity
        else {
          const { transaction, result } = await addLiquidity({
            chainId: selectedChain.id,
            userAddress: walletClient.account.address,
            token0: currency0.address,
            token1: currency1.address,
            salt,
            amount0,
            amount1,
            quotes: aggregators.map((aggregator) => aggregator.quote),
            options: {
              useSubgraph: false,
              rpcUrl: CHAIN_CONFIG.RPC_URL,
              disableSwap,
              slippage,
              timeoutForQuotes: 2000,
            },
          })

          const confirmation = {
            title: `Add Liquidity`,
            body: 'Please confirm in your wallet.',
            chain: selectedChain,
            fields: [
              new BigNumber(result.currencyA.amount).isZero()
                ? undefined
                : {
                    direction: result.currencyA.direction,
                    currency: result.currencyA.currency,
                    label: result.currencyA.currency.symbol,
                    primaryText: toPreciseString(
                      result.currencyA.amount,
                      prices[result.currencyA.currency.address],
                      formatWithCommas,
                    ),
                    secondaryText: formatDollarValue(
                      parseUnits(
                        result.currencyA.amount,
                        result.currencyA.currency.decimals,
                      ),
                      result.currencyA.currency.decimals,
                      prices[result.currencyA.currency.address],
                    ),
                  },
              new BigNumber(result.currencyB.amount).isZero()
                ? undefined
                : {
                    direction: result.currencyB.direction,
                    currency: result.currencyB.currency,
                    label: result.currencyB.currency.symbol,
                    primaryText: toPreciseString(
                      result.currencyB.amount,
                      prices[result.currencyB.currency.address],
                      formatWithCommas,
                    ),
                    secondaryText: formatDollarValue(
                      parseUnits(
                        result.currencyB.amount,
                        result.currencyB.currency.decimals,
                      ),
                      result.currencyB.currency.decimals,
                      prices[result.currencyB.currency.address],
                    ),
                  },
              new BigNumber(result.lpCurrency.amount).isZero()
                ? undefined
                : {
                    direction: result.lpCurrency.direction,
                    currency: {
                      currencyA: result.currencyA.currency,
                      currencyB: result.currencyB.currency,
                    },
                    label: result.lpCurrency.currency.symbol,
                    primaryText: toPreciseString(
                      result.lpCurrency.amount,
                      lpPrice,
                      formatWithCommas,
                    ),
                    secondaryText: formatDollarValue(
                      parseUnits(
                        result.lpCurrency.amount,
                        result.lpCurrency.currency.decimals,
                      ),
                      result.lpCurrency.currency.decimals,
                      lpPrice,
                    ),
                  },
              result.quoteResponse &&
              result.quoteRequest &&
              result.quoteResponse.amountOut > 0n
                ? {
                    label: 'Swap Rate',
                    primaryText: `${formatWithCommas(
                      toSignificantString(result.quoteResponse.exchangeRate),
                    )}`,
                  }
                : undefined,
            ].filter((field) => field !== undefined) as Confirmation['fields'],
          }
          setConfirmation(confirmation)
          if (transaction) {
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
                  type: 'mint',
                  timestamp: currentTimestampInSeconds(),
                })
              },
              (receipt) => {
                updatePendingTransaction({
                  ...confirmation,
                  txHash: receipt.transactionHash,
                  type: 'mint',
                  timestamp: currentTimestampInSeconds(),
                  blockNumber: Number(receipt.blockNumber),
                  success: receipt.status === 'success',
                })
              },
              gasPrice,
              null,
            )
          }
        }
      } catch (e: any) {
        if (
          !disableSwap &&
          !(e as any).toString().includes('User rejected the request')
        ) {
          setShowRevertModal(true)
        }
        console.error(e)
      } finally {
        setConfirmation(undefined)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['pool'] }),
          queryClient.invalidateQueries({ queryKey: ['lp-balances'] }),
        ])
      }
    },
    [
      gasPrice,
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

  const burn = useCallback(
    async (
      currency0: Currency,
      currency1: Currency,
      salt: `0x${string}`,
      lpCurrencyAmount: string,
      slippageInput: string,
      lpPrice: number,
    ) => {
      if (!walletClient || !selectedChain) {
        return
      }
      console.log('burn', {
        currency0,
        currency1,
        salt,
        lpCurrencyAmount,
        slippageInput,
      })

      try {
        setConfirmation({
          title: `Remove Liquidity`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })

        const { result, transaction } = await removeLiquidity({
          chainId: selectedChain.id,
          userAddress: walletClient.account.address,
          token0: currency0.address,
          token1: currency1.address,
          salt,
          amount: lpCurrencyAmount,
          options: {
            gasLimit: 2_000_000n,
            useSubgraph: false,
            rpcUrl: CHAIN_CONFIG.RPC_URL,
            slippage: Number(slippageInput),
          },
        })

        const confirmation = {
          title: `Remove Liquidity`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            new BigNumber(result.currencyA.amount).isZero()
              ? undefined
              : {
                  direction: result.currencyA.direction,
                  currency: result.currencyA.currency,
                  label: result.currencyA.currency.symbol,
                  primaryText: toPreciseString(
                    result.currencyA.amount,
                    prices[result.currencyA.currency.address],
                    formatWithCommas,
                  ),
                  secondaryText: formatDollarValue(
                    parseUnits(
                      result.currencyA.amount,
                      result.currencyA.currency.decimals,
                    ),
                    result.currencyA.currency.decimals,
                    prices[result.currencyA.currency.address],
                  ),
                },
            new BigNumber(result.currencyB.amount).isZero()
              ? undefined
              : {
                  direction: result.currencyB.direction,
                  currency: result.currencyB.currency,
                  label: result.currencyB.currency.symbol,
                  primaryText: toPreciseString(
                    result.currencyB.amount,
                    prices[result.currencyB.currency.address],
                    formatWithCommas,
                  ),
                  secondaryText: formatDollarValue(
                    parseUnits(
                      result.currencyB.amount,
                      result.currencyB.currency.decimals,
                    ),
                    result.currencyB.currency.decimals,
                    prices[result.currencyB.currency.address],
                  ),
                },
            new BigNumber(result.lpCurrency.amount).isZero()
              ? undefined
              : {
                  direction: result.lpCurrency.direction,
                  currency: {
                    currencyA: result.currencyA.currency,
                    currencyB: result.currencyB.currency,
                  },
                  label: result.lpCurrency.currency.symbol,
                  primaryText: toPreciseString(
                    result.lpCurrency.amount,
                    lpPrice,
                    formatWithCommas,
                  ),
                  secondaryText: formatDollarValue(
                    parseUnits(
                      result.lpCurrency.amount,
                      result.lpCurrency.currency.decimals,
                    ),
                    result.lpCurrency.currency.decimals,
                    lpPrice,
                  ),
                },
          ].filter((field) => field !== undefined) as Confirmation['fields'],
        }
        setConfirmation(confirmation)

        if (transaction) {
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
                type: 'burn',
                timestamp: currentTimestampInSeconds(),
              })
            },
            (receipt) => {
              updatePendingTransaction({
                ...confirmation,
                txHash: receipt.transactionHash,
                type: 'burn',
                timestamp: currentTimestampInSeconds(),
                blockNumber: Number(receipt.blockNumber),
                success: receipt.status === 'success',
              })
            },
            gasPrice,
            null,
          )
        }
      } catch (e) {
        console.error(e)
      } finally {
        setConfirmation(undefined)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['pool'] }),
          queryClient.invalidateQueries({ queryKey: ['lp-balances'] }),
        ])
      }
    },
    [
      disconnectAsync,
      prices,
      gasPrice,
      queryClient,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
      walletClient,
    ],
  )

  const wrap = useCallback(
    async (
      currency0: Currency,
      currency1: Currency,
      salt: `0x${string}`,
      amount: string,
      lpPrice: number,
    ) => {
      if (!walletClient || !selectedChain) {
        return
      }

      try {
        setConfirmation({
          title: `Wrap LP`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })

        const pool = await getPool({
          chainId: selectedChain.id,
          token0: currency0.address,
          token1: currency1.address,
          salt,
          options: {
            useSubgraph: true,
            rpcUrl: CHAIN_CONFIG.RPC_URL,
          },
        })
        const spender = getContractAddresses({
          chainId: selectedChain.id,
        }).Wrapped6909Factory
        const allownace = await getERC6909Allowance(
          selectedChain,
          walletClient.account.address,
          pool.lpCurrency,
          spender,
          pool.key,
        )
        // Max approve for lp currency
        if (allownace < parseUnits(amount, pool.lpCurrency.decimals)) {
          const confirmation = {
            title: `Max Approve ${pool.lpCurrency.symbol}`,
            body: 'Please confirm in your wallet.',
            chain: selectedChain,
            fields: [],
          }
          setConfirmation(confirmation)
          await maxApproveERC6909(
            selectedChain,
            walletClient,
            pool.lpCurrency,
            spender,
            pool.key,
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
            null,
          )
        }
        // If currency has sufficient allowance, proceed to wrap
        const { transaction } = await wrapToERC20({
          chainId: selectedChain.id,
          userAddress: walletClient.account.address,
          token0: currency0.address,
          token1: currency1.address,
          salt,
          amount,
          options: {
            pool,
          },
        })

        const confirmation = {
          title: `Wrap LP`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              direction: 'in',
              currency: {
                currencyA: currency0,
                currencyB: currency1,
              },
              label: 'LP Token',
              primaryText: toPreciseString(amount, lpPrice, formatWithCommas),
              secondaryText: formatDollarValue(
                parseUnits(amount, pool.lpCurrency.decimals),
                pool.lpCurrency.decimals,
                lpPrice,
              ),
            },
            {
              direction: 'out',
              currency: {
                currencyA: currency0,
                currencyB: currency1,
              },
              label: 'LP Token (ERC20)',
              primaryText: toPreciseString(amount, lpPrice, formatWithCommas),
              secondaryText: formatDollarValue(
                parseUnits(amount, pool.lpCurrency.decimals),
                pool.lpCurrency.decimals,
                lpPrice,
              ),
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)
        if (transaction) {
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
                type: 'lp-wrap',
                timestamp: currentTimestampInSeconds(),
              })
            },
            (receipt) => {
              updatePendingTransaction({
                ...confirmation,
                txHash: receipt.transactionHash,
                type: 'lp-wrap',
                timestamp: currentTimestampInSeconds(),
                blockNumber: Number(receipt.blockNumber),
                success: receipt.status === 'success',
              })
            },
            gasPrice,
            null,
          )
        }
      } catch (e) {
        console.error(e)
      } finally {
        setConfirmation(undefined)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['lp-balances'] }),
        ])
      }
    },
    [
      gasPrice,
      walletClient,
      selectedChain,
      setConfirmation,
      disconnectAsync,
      queuePendingTransaction,
      updatePendingTransaction,
      queryClient,
    ],
  )

  const unwrap = useCallback(
    async (
      currency0: Currency,
      currency1: Currency,
      salt: `0x${string}`,
      amount: string,
      lpPrice: number,
    ) => {
      if (!walletClient || !selectedChain) {
        return
      }

      try {
        setConfirmation({
          title: `Unwrap LP`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [],
        })

        const pool = await getPool({
          chainId: selectedChain.id,
          token0: currency0.address,
          token1: currency1.address,
          salt,
          options: {
            useSubgraph: true,
            rpcUrl: CHAIN_CONFIG.RPC_URL,
          },
        })
        const { transaction } = await unwrapFromERC20({
          chainId: selectedChain.id,
          userAddress: walletClient.account.address,
          token0: pool.currencyA.address,
          token1: pool.currencyB.address,
          salt: pool.key,
          amount,
          options: {
            pool,
          },
        })

        const confirmation = {
          title: `Unwrap LP`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              direction: 'out',
              currency: {
                currencyA: pool.currencyA,
                currencyB: pool.currencyB,
              },
              label: 'LP Token (ERC20)',
              primaryText: toPreciseString(amount, lpPrice, formatWithCommas),
              secondaryText: formatDollarValue(
                parseUnits(amount, pool.lpCurrency.decimals),
                pool.lpCurrency.decimals,
                lpPrice,
              ),
            },
            {
              direction: 'in',
              currency: {
                currencyA: pool.currencyA,
                currencyB: pool.currencyB,
              },
              label: 'LP Token',
              primaryText: toPreciseString(amount, lpPrice, formatWithCommas),
              secondaryText: formatDollarValue(
                parseUnits(amount, pool.lpCurrency.decimals),
                pool.lpCurrency.decimals,
                lpPrice,
              ),
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)
        if (transaction) {
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
                type: 'lp-unwrap',
                timestamp: currentTimestampInSeconds(),
              })
            },
            (receipt) => {
              updatePendingTransaction({
                ...confirmation,
                txHash: receipt.transactionHash,
                type: 'lp-unwrap',
                timestamp: currentTimestampInSeconds(),
                blockNumber: Number(receipt.blockNumber),
                success: receipt.status === 'success',
              })
            },
            gasPrice,
            null,
          )
        }
      } catch (e) {
        console.error(e)
      } finally {
        setConfirmation(undefined)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['lp-balances'] }),
        ])
      }
    },
    [
      gasPrice,
      disconnectAsync,
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
        mint,
        burn,
        wrap,
        unwrap,
      }}
    >
      {showRevertModal && (
        <Modal show onClose={() => setShowRevertModal(false)}>
          <h1 className="flex font-semibold text-xl mb-2">
            Transaction Reverted
          </h1>
          <h6 className="text-sm">
            The transaction has been reverted. Please try again with the
            <span className="font-bold text-blue-500">
              {' '}
              Auto-Balance Liquidity
            </span>{' '}
            feature turned off.
          </h6>
        </Modal>
      )}
      {children}
    </Context.Provider>
  )
}

export const usePoolContractContext = () =>
  React.useContext(Context) as PoolContractContext
