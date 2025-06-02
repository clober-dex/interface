// Web3Auth Libraries
import { CHAIN_NAMESPACES, UX_MODE, WEB3AUTH_NETWORK } from '@web3auth/base'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector'
import { AuthAdapter } from '@web3auth/auth-adapter'
import { Web3AuthNoModal } from '@web3auth/no-modal'
import { LOGIN_PROVIDER_TYPE } from '@web3auth/auth'

import { CHAIN_CONFIG } from '../../chain-configs'

export default function Web3AuthConnectorInstance({
  socialType,
}: {
  socialType: LOGIN_PROVIDER_TYPE
}) {
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

  const web3AuthInstance = new Web3AuthNoModal({
    clientId: CHAIN_CONFIG.WEB3_AUTH_CLIENT_ID,
    privateKeyProvider,
    web3AuthNetwork: CHAIN_CONFIG.CHAIN.testnet
      ? WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
      : WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  })

  // Add openlogin adapter for customisations
  const authAdapterInstance = new AuthAdapter({
    adapterSettings: {
      uxMode: UX_MODE.POPUP,
    },
  })
  web3AuthInstance.configureAdapter(authAdapterInstance)

  return Web3AuthConnector({
    web3AuthInstance,
    name: socialType,
    loginParams: {
      loginProvider: socialType,
      redirectUrl: window.location.origin,
      extraLoginOptions: {
        domain: window.location.hostname,
      },
    },
    id: socialType,
    type: socialType,
    modalConfig: {},
  })
}
