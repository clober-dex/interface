import type {
  EthereumProvider,
  NexusSDK,
  OnAllowanceHookData,
  OnIntentHookData,
} from '@avail-project/nexus-core'
import { useCallback, useRef, useState } from 'react'
import { useAccount } from 'wagmi'

/**
 * Hook for safely initializing and managing a Nexus SDK instance.
 * - compatible with lazy-loaded SDKs
 * - prevents race conditions during init/deinit
 * - works only on client (window) side
 */
const useInitNexus = (sdk: NexusSDK | null) => {
  const { connector } = useAccount()

  const [nexusSDK, setNexusSDK] = useState<NexusSDK | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  const intentRefCallback = useRef<OnIntentHookData | null>(null)
  const allowanceRefCallback = useRef<OnAllowanceHookData | null>(null)

  /**
   * Initialize the SDK instance with the current wallet provider.
   * Skips initialization if the SDK is already ready or not yet loaded.
   */
  const initializeNexus = useCallback(async () => {
    if (typeof window === 'undefined') {
      return
    }
    if (!sdk) {
      console.warn('[Nexus] SDK not loaded yet')
      return
    }
    if (isInitializing) {
      console.warn('[Nexus] already initializing...')
      return
    }

    try {
      setIsInitializing(true)
      if (sdk.isInitialized()) {
        console.log('[Nexus] already initialized')
        setNexusSDK(sdk)
        return
      }

      const provider = (await connector?.getProvider()) as EthereumProvider
      if (!provider) {
        console.warn('[Nexus] no provider found for wallet connector')
        return
      }

      await sdk.initialize(provider)
      setNexusSDK(sdk)
      console.log('[Nexus] initialized successfully')
    } catch (error) {
      console.error('[Nexus] error initializing SDK:', error)
    } finally {
      setIsInitializing(false)
    }
  }, [sdk, connector, isInitializing])

  /**
   * Deinitialize the SDK instance and clear stored refs.
   */
  const deinitializeNexus = useCallback(async () => {
    if (!sdk) {
      return
    }
    try {
      if (sdk.isInitialized()) {
        await sdk.deinit()
        console.log('[Nexus] deinitialized')
      }
      setNexusSDK(null)
      intentRefCallback.current = null
      allowanceRefCallback.current = null
    } catch (error) {
      console.error('[Nexus] error deinitializing:', error)
    }
  }, [sdk])

  /**
   * Attach event hooks for intent and allowance flows.
   * These hooks are triggered during SDK-driven user interactions.
   */
  const attachEventHooks = useCallback(() => {
    if (!sdk) {
      return
    }
    try {
      sdk.setOnAllowanceHook((data: OnAllowanceHookData) => {
        console.log('[Nexus] allowance hook received:', data)
        allowanceRefCallback.current = data
      })

      sdk.setOnIntentHook((data: OnIntentHookData) => {
        console.log('[Nexus] intent hook received:', data)
        intentRefCallback.current = data
      })
    } catch (err) {
      console.error('[Nexus] failed to attach event hooks:', err)
    }
  }, [sdk])

  return {
    nexusSDK,
    initializeNexus,
    deinitializeNexus,
    attachEventHooks,
    intentRefCallback,
    allowanceRefCallback,
  }
}

export default useInitNexus
