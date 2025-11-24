import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useDisconnect, useWalletClient } from 'wagmi'
import { createPublicClient, http, numberToHex } from 'viem'

import { SupportedChainIds } from '../apis/orderly/networks'
import {
  addOrderlyKey,
  getAccountId,
  isWalletRegistered,
  registerAccount,
} from '../apis/orderly/account'
import {
  base64DecodeURL,
  base64EncodeURL,
  getBaseUrl,
  signAndSendRequest,
} from '../apis/orderly/utils'
import { getReferralStatus, verifyReferralCode } from '../apis/orderly/referral'
import { buildTransaction, sendTransaction } from '../utils/transaction'
import { CHAIN_CONFIG } from '../chain-configs'
import { currentTimestampInSeconds } from '../utils/date'
import { REFERRAL_MANAGER_ABI } from '../abis/referral-manager-abi'
import Modal from '../components/modal/modal'
import { ActionButton } from '../components/button/action-button'

import { useChainContext } from './chain-context'
import { Confirmation, useTransactionContext } from './transaction-context'

type ReferralContext = {
  referrerCode: string | null
}

const Context = React.createContext<ReferralContext>({
  referrerCode: null,
})

const ORDERLY_KEY = (address: `0x${string}`, chainId: SupportedChainIds) =>
  `orderly-key-${chainId}-${address}`
const BROKER_ID = 'clober_dex'

export const ReferralProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { address: userAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { selectedChain } = useChainContext()
  const { disconnectAsync } = useDisconnect()
  const {
    setConfirmation,
    gasPrice,
    queuePendingTransaction,
    updatePendingTransaction,
  } = useTransactionContext()
  const chainHexId = useMemo(
    () => numberToHex(selectedChain.id) as SupportedChainIds,
    [selectedChain.id],
  )
  const [isBindReferralCodeModalOpen, setIsBindReferralCodeModalOpen] =
    useState(false)
  const onConfirmRef = useRef<null | (() => Promise<void>)>(null)

  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: selectedChain,
      transport: http(CHAIN_CONFIG.RPC_URL),
    })
  }, [selectedChain])

  const [pendingCodeToBind, setPendingCodeToBind] = useState<string | null>(
    null,
  )
  const [isValidReferralCode, setIsValidReferralCode] = useState<boolean>(true)
  const [referrerCode, setReferrerCode] = useState<string | null>(null)

  const bindReferrerOnOrderly = useCallback(
    async (code: string, orderlyKey: string) => {
      if (userAddress) {
        const res = await signAndSendRequest(
          getAccountId(userAddress),
          base64DecodeURL(orderlyKey),
          `${getBaseUrl(chainHexId)}/v1/referral/bind`,
          {
            method: 'POST',
            body: JSON.stringify({
              referral_code: code,
            }),
          },
        )
        const { success } = (await res.json()) as {
          success: boolean
          timestamp: number
        }
        if (!success) {
          throw new Error(`Failed to bind referral code: ${code}`)
        }
      }
    },
    [chainHexId, userAddress],
  )

  const registerOnChainReferee = useCallback(
    async (code: string) => {
      try {
        if (!walletClient) {
          return
        }

        const confirmation = {
          title: `Register for Referral`,
          body: 'Please confirm in your wallet.',
          chain: selectedChain,
          fields: [
            {
              label: 'Referral Code',
              primaryText: code,
            },
          ] as Confirmation['fields'],
        }
        setConfirmation(confirmation)

        const transaction = await buildTransaction(
          publicClient,
          {
            chain: selectedChain,
            address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.ReferralManager,
            abi: REFERRAL_MANAGER_ABI,
            functionName: 'registerReferee',
            args: [code],
          },
          200000n,
        )
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
              type: 'register',
              timestamp: currentTimestampInSeconds(),
            })
          },
          (receipt) => {
            setConfirmation(undefined)
            updatePendingTransaction({
              ...confirmation,
              txHash: receipt.transactionHash,
              success: receipt.status === 'success',
              blockNumber: Number(receipt.blockNumber),
              type: 'register',
              timestamp: currentTimestampInSeconds(),
            })
          },
          gasPrice,
          null,
        )
      } catch (error) {
        console.error('Error registering referral code:', error)
      } finally {
        setConfirmation(undefined)
      }
    },
    [
      disconnectAsync,
      gasPrice,
      publicClient,
      queuePendingTransaction,
      selectedChain,
      setConfirmation,
      updatePendingTransaction,
      walletClient,
    ],
  )
  const searchParams = new URLSearchParams(window.location.search)
  const refFromUrl = searchParams.get('ref')

  useEffect(
    () => {
      const action = async () => {
        if (!userAddress || !walletClient || !refFromUrl) {
          return
        }
        console.log('Processing referral code from URL:', { refFromUrl })
        await walletClient.switchChain({ id: selectedChain.id }).catch(() => {})

        const result = await isWalletRegistered(
          chainHexId,
          BROKER_ID,
          userAddress,
        )
        if (!result) {
          await registerAccount(walletClient, chainHexId, BROKER_ID)
        }

        let orderlyKey = localStorage.getItem(
          ORDERLY_KEY(userAddress, chainHexId),
        )

        if (!orderlyKey) {
          const key = await addOrderlyKey(
            walletClient,
            chainHexId,
            BROKER_ID,
            'read,trading,asset',
          )
          localStorage.setItem(
            ORDERLY_KEY(userAddress, chainHexId),
            base64EncodeURL(key),
          )
        }

        orderlyKey = localStorage.getItem(ORDERLY_KEY(userAddress, chainHexId))

        if (orderlyKey) {
          const {
            referrerCode: orderlyReferrerCode,
            onChainRefereeRegistered,
          } = await getReferralStatus(
            publicClient,
            base64DecodeURL(orderlyKey),
            userAddress,
          )

          console.log('Referral Status:', {
            referrerCode: orderlyReferrerCode,
            onChainRefereeRegistered,
            refFromUrl,
            userAddress,
          })

          if (orderlyReferrerCode && onChainRefereeRegistered) {
            setReferrerCode(orderlyReferrerCode)
          }

          if (orderlyReferrerCode && !onChainRefereeRegistered) {
            setIsBindReferralCodeModalOpen(true)
            setPendingCodeToBind(orderlyReferrerCode)
            onConfirmRef.current = async () => {
              await registerOnChainReferee(orderlyReferrerCode)
              setReferrerCode(orderlyReferrerCode)
            }
          } else if (
            refFromUrl &&
            !orderlyReferrerCode &&
            !onChainRefereeRegistered
          ) {
            const exists = await verifyReferralCode(chainHexId, refFromUrl)
            if (!exists) {
              setIsValidReferralCode(false)
            }
            setIsBindReferralCodeModalOpen(true)
            setPendingCodeToBind(refFromUrl)
            onConfirmRef.current = async () => {
              await bindReferrerOnOrderly(refFromUrl, orderlyKey!)
              await registerOnChainReferee(refFromUrl)
              setReferrerCode(refFromUrl)
            }
          }
        }
      }

      if (typeof window === 'undefined') {
        return
      }

      setIsBindReferralCodeModalOpen(false)
      setPendingCodeToBind(null)
      setReferrerCode(null)
      setIsValidReferralCode(true)

      action()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedChain.id, userAddress, walletClient, refFromUrl],
  )

  return (
    <Context.Provider value={{ referrerCode }}>
      {isBindReferralCodeModalOpen &&
      pendingCodeToBind &&
      onConfirmRef.current ? (
        <Modal show onClose={() => setIsBindReferralCodeModalOpen(false)}>
          <div className="flex flex-col gap-4">
            <h6 className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1 text-gray-400">
                <h1 className="flex font-semibold text-xl mb-2 text-white">
                  Bind Referral Code
                </h1>
                <div>
                  •{' '}
                  <span className="font-semibold text-white">
                    10% extra Vault Points
                  </span>
                </div>
                <div>
                  •{' '}
                  <span className="font-semibold text-white">
                    20% fee refund
                  </span>{' '}
                  on perp trades
                </div>
              </div>
              <div className="flex flex-col relative rounded-[10px] shadow-sm bg-[#24272e] outline outline-1 outline-offset-[-1px] outline-[#39393b]">
                <div className="inline-block">
                  <input
                    type="search"
                    name="token-search"
                    id="search"
                    autoComplete="off"
                    disabled
                    className="focus:outline-none focus-visible:outline-none focus:ring-1 focus:rounded-[10px] focus:ring-gray-400 inline w-full rounded-md border-0 pl-3 py-3 bg-[#2a2b2f] placeholder:text-gray-400 text-xs sm:text-sm text-white"
                    placeholder={pendingCodeToBind || 'Referral Code'}
                  />
                </div>
              </div>
            </h6>
            <ActionButton
              disabled={!isValidReferralCode}
              onClick={async () => {
                if (onConfirmRef.current) {
                  await onConfirmRef.current()
                  setIsBindReferralCodeModalOpen(false)
                }
              }}
              text={isValidReferralCode ? 'Confirm' : 'Invalid Referral Code'}
            />
          </div>
        </Modal>
      ) : null}
      {children}
    </Context.Provider>
  )
}

export const useReferralContext = () =>
  React.useContext(Context) as ReferralContext
