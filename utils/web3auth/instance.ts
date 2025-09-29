import { Web3Auth } from '@web3auth/modal'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base'
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector'

import { CHAIN_CONFIG } from '../../chain-configs'

export let web3AuthInstance: Web3Auth | null = null

export default function Web3AuthConnectorInstance() {
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: `0x${CHAIN_CONFIG.CHAIN.id.toString(16)}`,
    rpcTarget: CHAIN_CONFIG.RPC_URL,
    displayName: CHAIN_CONFIG.CHAIN.name,
    tickerName: CHAIN_CONFIG.CHAIN.nativeCurrency?.name,
    ticker: CHAIN_CONFIG.CHAIN.nativeCurrency?.symbol,
    blockExplorerUrl: CHAIN_CONFIG.CHAIN.blockExplorers?.default
      .url[0] as string,
  }

  const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
  })

  if (web3AuthInstance) {
    // If an instance already exists, return it
    return Web3AuthConnector({
      web3AuthInstance,
    })
  }

  web3AuthInstance = new Web3Auth({
    clientId: CHAIN_CONFIG.WEB3_AUTH_CLIENT_ID,
    privateKeyProvider,
    web3AuthNetwork: CHAIN_CONFIG.CHAIN.testnet
      ? WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
      : WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    uiConfig: {
      loginMethodsOrder: [],
      defaultLanguage: 'en',
      modalZIndex: '2147483647',
      logoLight: '/chain-configs/favicon.png',
      logoDark: '/chain-configs/favicon.png',
      uxMode: 'popup',
      mode: 'dark',
    },
  })

  return Web3AuthConnector({
    web3AuthInstance,
  })
}
