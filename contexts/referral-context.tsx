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
  referralCode: string | null
}

const Context = React.createContext<ReferralContext>({
  referralCode: null,
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
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
  const registerActionRef = useRef<null | (() => Promise<void>)>(null)

  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: selectedChain,
      transport: http(CHAIN_CONFIG.RPC_URL),
    })
  }, [selectedChain])

  const [orderlyKey, setOrderlyKey] = useState<string | null>(() => {
    if (!userAddress || typeof window === 'undefined') {
      return null
    }
    const stored = localStorage.getItem(ORDERLY_KEY(userAddress, chainHexId))
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
  })

  const [pendingReferralCode, setPendingReferralCode] = useState<string | null>(
    null,
  )
  const [isExistingReferralCode, setIsExistingReferralCode] =
    useState<boolean>(true)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  const registerOrderlyReferralCode = useCallback(
    async (code: string) => {
      if (orderlyKey && userAddress) {
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
    [chainHexId, orderlyKey, userAddress],
  )

  const registerOnChainReferralCode = useCallback(
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

  useEffect(() => {
    const action = async () => {
      if (!userAddress || !walletClient) {
        return
      }
      await walletClient.switchChain({ id: selectedChain.id }).catch(() => {})

      const result = await isWalletRegistered(
        chainHexId,
        BROKER_ID,
        userAddress,
      )
      if (!result) {
        await registerAccount(walletClient, chainHexId, BROKER_ID)
      }

      if (!orderlyKey) {
        const key = await addOrderlyKey(
          walletClient,
          chainHexId,
          BROKER_ID,
          'read,trading,asset',
        )
        setOrderlyKey(base64EncodeURL(key))
        if (userAddress) {
          localStorage.setItem(
            ORDERLY_KEY(userAddress, chainHexId),
            JSON.stringify(base64EncodeURL(key)),
          )
        }
      }

      if (orderlyKey) {
        const { refererCode, onChainRefereeRegistered } =
          await getReferralStatus(
            publicClient,
            base64DecodeURL(orderlyKey),
            userAddress,
          )
        const searchParams = new URLSearchParams(window.location.search)
        const refFromUrl = searchParams.get('ref')

        console.log('Referral Status:', {
          refererCode,
          onChainRefereeRegistered,
          refFromUrl,
        })
        if (refererCode && !onChainRefereeRegistered) {
          setIsReferralModalOpen(true)
          setPendingReferralCode(refererCode)
          registerActionRef.current = async () => {
            await registerOnChainReferralCode(refererCode)
            setReferralCode(refererCode)
          }
        } else if (refFromUrl && !refererCode && !onChainRefereeRegistered) {
          const exists = await verifyReferralCode(chainHexId, refFromUrl)
          if (!exists) {
            setIsExistingReferralCode(false)
          }
          setIsReferralModalOpen(true)
          setPendingReferralCode(refFromUrl)
          registerActionRef.current = async () => {
            await registerOrderlyReferralCode(refFromUrl)
            await registerOnChainReferralCode(refFromUrl)
            setReferralCode(refFromUrl)
          }
        }
      }
    }

    setIsReferralModalOpen(false)
    setPendingReferralCode(null)
    setReferralCode(null)
    action()
  }, [
    chainHexId,
    orderlyKey,
    publicClient,
    registerOnChainReferralCode,
    registerOrderlyReferralCode,
    selectedChain.id,
    userAddress,
    walletClient,
  ])

  return (
    <Context.Provider value={{ referralCode }}>
      {isReferralModalOpen &&
      pendingReferralCode &&
      registerActionRef.current ? (
        <Modal show onClose={() => setIsReferralModalOpen(false)}>
          <div className="flex flex-col gap-4">
            <h1 className="flex font-semibold text-xl mb-2">
              Referral Registration
            </h1>
            <h6 className="flex flex-col gap-4 text-sm">
              Text.
              <div className="flex flex-col relative rounded-[10px] shadow-sm bg-[#24272e] outline outline-1 outline-offset-[-1px] outline-[#39393b]">
                <div className="inline-block">
                  <input
                    type="search"
                    name="token-search"
                    id="search"
                    autoComplete="off"
                    disabled
                    className="focus:outline-none focus-visible:outline-none focus:ring-1 focus:rounded-[10px] focus:ring-gray-400 inline w-full rounded-md border-0 pl-3 py-3 bg-[#2a2b2f] placeholder:text-gray-400 text-xs sm:text-sm text-white"
                    placeholder={pendingReferralCode || 'Referral Code'}
                  />
                </div>
              </div>
            </h6>
            <ActionButton
              disabled={!isExistingReferralCode}
              onClick={async () => {
                if (registerActionRef.current) {
                  await registerActionRef.current()
                  setIsReferralModalOpen(false)
                }
              }}
              text={
                isExistingReferralCode ? 'Confirm' : 'Invalid Referral Code'
              }
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
