import React, { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDisconnect, useWalletClient } from 'wagmi'
import {
  addLiquidity,
  getContractAddresses,
  getQuoteToken,
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
  maxApprove as maxApproveERC6909,
  getAllowance as getERC6909Allowance,
} from '../../utils/approve6909'
import { formatPreciseAmountString } from '../../utils/bignumber'
import { sendTransaction } from '../../utils/transaction'
import { currentTimestampInSeconds } from '../../utils/date'
import { CHAIN_CONFIG } from '../../chain-configs'
import { Pool } from '../../model/pool'

type PoolContractContext = {
  mint: (
    currency0: Currency,
    currency1: Currency,
    salt: `0x${string}`,
    amount0: string,
    amount1: string,
    disableSwap: boolean,
    slippage: number,
  ) => Promise<void>
  burn: (
    currency0: Currency,
    currency1: Currency,
    salt: `0x${string}`,
    lpCurrencyAmount: string,
    slippageInput: string,
  ) => Promise<void>
  wrap: (pool: Pool, amount: string) => Promise<void>
  unwrap: (pool: Pool, amount: string) => Promise<void>
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
  const queryClient = useQueryClient()
  const { disconnectAsync } = useDisconnect()

  const { data: walletClient } = useWalletClient()
  const { setConfirmation, queuePendingTransaction, updatePendingTransaction } =
    useTransactionContext()
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
          const baseCurrency = isAddressEqual(
            getQuoteToken({
              chainId: selectedChain.id,
              token0: currency0.address,
              token1: currency1.address,
            }),
            currency0.address,
          )
            ? currency1
            : currency0

          const { transaction, result } = await addLiquidity({
            chainId: selectedChain.id,
            userAddress: walletClient.account.address,
            token0: currency0.address,
            token1: currency1.address,
            salt,
            amount0,
            amount1,
            options: {
              useSubgraph: false,
              rpcUrl: CHAIN_CONFIG.RPC_URL,
              disableSwap,
              slippage,
              testnetPrice: prices[baseCurrency.address],
              token0Price: prices[currency0.address],
              token1Price: prices[currency1.address],
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
                    value: formatPreciseAmountString(
                      result.currencyA.amount,
                      prices[result.currencyA.currency.address],
                    ),
                  },
              new BigNumber(result.currencyB.amount).isZero()
                ? undefined
                : {
                    direction: result.currencyB.direction,
                    currency: result.currencyB.currency,
                    label: result.currencyB.currency.symbol,
                    value: formatPreciseAmountString(
                      result.currencyB.amount,
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
                    value: formatPreciseAmountString(
                      result.lpCurrency.amount,
                      prices[baseCurrency.address],
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
            )
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['pool'] }),
          queryClient.invalidateQueries({ queryKey: ['lp-balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
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

        const baseCurrency = isAddressEqual(
          getQuoteToken({
            chainId: selectedChain.id,
            token0: currency0.address,
            token1: currency1.address,
          }),
          currency0.address,
        )
          ? currency1
          : currency0

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
                  value: formatPreciseAmountString(
                    result.currencyA.amount,
                    prices[result.currencyA.currency.address],
                  ),
                },
            new BigNumber(result.currencyB.amount).isZero()
              ? undefined
              : {
                  direction: result.currencyB.direction,
                  currency: result.currencyB.currency,
                  label: result.currencyB.currency.symbol,
                  value: formatPreciseAmountString(
                    result.currencyB.amount,
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
                  value: formatPreciseAmountString(
                    result.lpCurrency.amount,
                    prices[baseCurrency.address],
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
          )
        }
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['pool'] }),
          queryClient.invalidateQueries({ queryKey: ['lp-balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
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

  const wrap = useCallback(
    async (pool: Pool, amount: string) => {
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
          )
        }
        // If currency has sufficient allowance, proceed to wrap
        const { transaction } = await wrapToERC20({
          chainId: selectedChain.id,
          userAddress: walletClient.account.address,
          token0: pool.currencyA.address,
          token1: pool.currencyB.address,
          salt: pool.key,
          amount,
          options: {
            useSubgraph: false,
            rpcUrl: CHAIN_CONFIG.RPC_URL,
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
                currencyA: pool.currencyA,
                currencyB: pool.currencyB,
              },
              label: pool.lpCurrency.symbol,
              value: formatPreciseAmountString(
                amount,
                prices[pool.currencyA.address] ||
                  prices[pool.currencyB.address] ||
                  0,
              ),
            },
            {
              direction: 'out',
              currency: {
                currencyA: pool.currencyA,
                currencyB: pool.currencyB,
              },
              label: pool.wrappedLpCurrency.symbol,
              value: formatPreciseAmountString(
                amount,
                prices[pool.currencyA.address] ||
                  prices[pool.currencyB.address] ||
                  0,
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
          )
        }
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['lp-balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
      walletClient,
      selectedChain,
      setConfirmation,
      disconnectAsync,
      queuePendingTransaction,
      updatePendingTransaction,
      queryClient,
      prices,
    ],
  )

  const unwrap = useCallback(
    async (pool: Pool, amount: string) => {
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

        const { transaction } = await unwrapFromERC20({
          chainId: selectedChain.id,
          userAddress: walletClient.account.address,
          token0: pool.currencyA.address,
          token1: pool.currencyB.address,
          salt: pool.key,
          amount,
          options: {
            useSubgraph: false,
            rpcUrl: CHAIN_CONFIG.RPC_URL,
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
              label: pool.lpCurrency.symbol,
              value: formatPreciseAmountString(
                amount,
                prices[pool.currencyA.address] ||
                  prices[pool.currencyB.address] ||
                  0,
              ),
            },
            {
              direction: 'in',
              currency: {
                currencyA: pool.currencyA,
                currencyB: pool.currencyB,
              },
              label: pool.wrappedLpCurrency.symbol,
              value: formatPreciseAmountString(
                amount,
                prices[pool.currencyA.address] ||
                  prices[pool.currencyB.address] ||
                  0,
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
          )
        }
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balances'] }),
          queryClient.invalidateQueries({ queryKey: ['lp-balances'] }),
        ])
        setConfirmation(undefined)
      }
    },
    [
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
        mint,
        burn,
        wrap,
        unwrap,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const usePoolContractContext = () =>
  React.useContext(Context) as PoolContractContext
