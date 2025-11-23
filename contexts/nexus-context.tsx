'use client'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useAccount } from 'wagmi'
import {
  EthereumProvider,
  NexusSDK,
  OnAllowanceHookData,
} from '@avail-project/nexus-core'

import { CHAIN_CONFIG } from '../chain-configs'

interface NexusContextType {
  nexusSDK: NexusSDK | null
  isInitialized: boolean
  cleanupSDK: () => void
  useRemoteChainBalances: boolean
  setUseRemoteChainBalances: (value: boolean) => void
}

const USE_REMOTE_CHAIN_BALANCES_KEY = 'use-remote-chain-balances'
const NexusContext = createContext<NexusContextType | null>(null)

const NexusProvider = ({ children }: { children: React.ReactNode }) => {
  const { status, connector } = useAccount()

  const [nexusSDK, setNexusSDK] = useState<NexusSDK | null>(null)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  const initializeSDK = useCallback(async () => {
    if (status === 'connected' && !nexusSDK && connector) {
      try {
        // Get the EIP-1193 provider from the connector
        // For ConnectKit/wagmi, we need to get the provider from the connector
        const provider = (await connector.getProvider()) as EthereumProvider

        if (!provider) {
          throw new Error('No EIP-1193 provider available')
        }

        const sdk = new NexusSDK({
          network: CHAIN_CONFIG.CHAIN.testnet ? 'testnet' : 'mainnet',
          siweChain: CHAIN_CONFIG.CHAIN.id,
        })

        await sdk.initialize(provider)
        setNexusSDK(sdk)

        setIsInitialized(true)

        sdk.setOnAllowanceHook(async (data: OnAllowanceHookData) => {
          // This is a hook for the dev to show user the allowances that need to be setup for the current tx to happen
          // where,
          // sources: an array of objects with minAllowance, chainID, token symbol, etc.
          // allow(allowances): continues the transaction flow with the specified allowances; `allowances` is an array with the chosen allowance for each of the requirements (allowances.length === sources.length), either 'min', 'max', a bigint or a string
          // deny(): stops the flow
          data.allow(data.sources.map(() => 'min'))
        })
      } catch (error) {
        console.error('Failed to initialize NexusSDK:', error)
        setIsInitialized(false)
      }
    }
  }, [connector, nexusSDK, status])

  const cleanupSDK = useCallback(async () => {
    if (nexusSDK) {
      await nexusSDK.deinit()
      setNexusSDK(null)
      setIsInitialized(false)
    }
  }, [nexusSDK])

  const [useRemoteChainBalances, _setUseRemoteChainBalances] =
    useState<boolean>(false)

  const setUseRemoteChainBalances = useCallback((value: boolean) => {
    _setUseRemoteChainBalances(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        USE_REMOTE_CHAIN_BALANCES_KEY,
        value ? 'true' : 'false',
      )
    }
  }, [])

  useEffect(() => {
    if (!useRemoteChainBalances) {
      return
    }

    const run = async () => {
      if (status === 'disconnected') {
        await cleanupSDK()
      } else if (status === 'connected') {
        await initializeSDK()
      }
    }

    run()

    return () => {
      cleanupSDK()
    }
  }, [cleanupSDK, initializeSDK, status, useRemoteChainBalances])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (!CHAIN_CONFIG.ENABLE_REMOTE_CHAIN_BALANCES) {
      return
    }

    const stored = localStorage.getItem(USE_REMOTE_CHAIN_BALANCES_KEY)
    _setUseRemoteChainBalances(stored ? stored === 'true' : false)
  }, [])

  return (
    <NexusContext.Provider
      value={{
        nexusSDK,
        isInitialized,
        cleanupSDK,
        useRemoteChainBalances,
        setUseRemoteChainBalances,
      }}
    >
      {children}
    </NexusContext.Provider>
  )
}

export function useNexus() {
  const context = useContext(NexusContext)
  if (!context) {
    throw new Error('useNexus must be used within a NexusProvider')
  }
  return context
}

export default NexusProvider
