'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAccount } from 'wagmi'
import type {
  NexusSDK,
  OnAllowanceHookData,
  OnIntentHookData,
} from '@avail-project/nexus-core'

import useInitNexus from '../hooks/useInitNexus'
import { CHAIN_CONFIG } from '../chain-configs'

interface NexusContextType {
  nexusSDK: NexusSDK | null
  intentRefCallback: React.RefObject<OnIntentHookData | null>
  allowanceRefCallback: React.RefObject<OnAllowanceHookData | null>
  handleInit: () => Promise<void>
}

const NexusContext = createContext<NexusContextType | null>(null)

const NexusProvider = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAccount()

  const [nexusSDK, setNexusSDK] = useState<NexusSDK | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const sdkRef = useRef<NexusSDK | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    ;(async () => {
      try {
        const mod = await import('@avail-project/nexus-core')
        const { NexusSDK } = mod
        const instance = new NexusSDK({
          network: CHAIN_CONFIG.CHAIN.testnet ? 'testnet' : 'mainnet',
          debug: true,
          provider: window.ethereum,
        })
        sdkRef.current = instance
        setNexusSDK(instance)
        setSdkReady(true)
      } catch (err) {
        console.error('[Nexus] Failed to load SDK:', err)
      }
    })()
  }, [])

  const {
    initializeNexus,
    deinitializeNexus,
    attachEventHooks,
    intentRefCallback,
    allowanceRefCallback,
  } = useInitNexus(nexusSDK as NexusSDK)

  const handleInit = useCallback(async () => {
    const sdk = sdkRef.current
    if (!sdk || !sdkReady) {
      console.warn('[Nexus] SDK not ready yet')
      return
    }
    if (sdk.isInitialized()) {
      console.log('[Nexus] already initialized')
      return
    }
    await initializeNexus()
    attachEventHooks()
  }, [sdkReady, attachEventHooks, initializeNexus])

  useEffect(() => {
    if (!sdkReady) {
      return
    }
    if (status === 'connected') {
      handleInit()
    } else if (status === 'disconnected') {
      deinitializeNexus()
    }
  }, [status, sdkReady, handleInit, deinitializeNexus])

  const value = useMemo(
    () => ({
      nexusSDK,
      intentRefCallback,
      allowanceRefCallback,
      handleInit,
    }),
    [nexusSDK, intentRefCallback, allowanceRefCallback, handleInit],
  )

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>
}

export function useNexus() {
  const context = useContext(NexusContext)
  if (!context) {
    throw new Error('useNexus must be used within a NexusProvider')
  }
  return context
}

export default NexusProvider
