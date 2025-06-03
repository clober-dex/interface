// https://github.com/rainbow-me/rainbowkit/blob/main/packages/rainbowkit/src/types/utils.ts

// window.ethereum types
import { EIP1193Provider } from 'viem'

type WalletProviderFlags =
  | 'isApexWallet'
  | 'isAvalanche'
  | 'isBackpack'
  | 'isBifrost'
  | 'isBitKeep'
  | 'isBitski'
  | 'isBinance'
  | 'isBlockWallet'
  | 'isBraveWallet'
  | 'isCoinbaseWallet'
  | 'isDawn'
  | 'isEnkrypt'
  | 'isExodus'
  | 'isFrame'
  | 'isFrontier'
  | 'isGamestop'
  | 'isHyperPay'
  | 'isImToken'
  | 'isKuCoinWallet'
  | 'isMathWallet'
  | 'isMetaMask'
  | 'isNestWallet'
  | 'isOkxWallet'
  | 'isOKExWallet'
  | 'isOneInchAndroidWallet'
  | 'isOneInchIOSWallet'
  | 'isOpera'
  | 'isPhantom'
  | 'isZilPay'
  | 'isPortal'
  | 'isxPortal'
  | 'isRabby'
  | 'isRainbow'
  | 'isStatus'
  | 'isTally'
  | 'isTokenPocket'
  | 'isTokenary'
  | 'isTrust'
  | 'isTrustWallet'
  | 'isXDEFI'
  | 'isZerion'
  | 'isTalisman'
  | 'isZeal'
  | 'isCoin98'
  | 'isMEWwallet'
  | 'isSafeheron'
  | 'isSafePal'
  | 'isWigwam'
  | '__seif'

type Evaluate<type> = { [key in keyof type]: type[key] } & unknown

type WalletProvider = Evaluate<
  EIP1193Provider & {
    [key in WalletProviderFlags]?: true | undefined
  } & {
    providers?: any[] | undefined
    /** Only exists in MetaMask as of 2022/04/03 */
    _events?: { connect?: (() => void) | undefined } | undefined
    /** Only exists in MetaMask as of 2022/04/03 */
    _state?:
      | {
          accounts?: string[]
          initialized?: boolean
          isConnected?: boolean
          isPermanentlyDisconnected?: boolean
          isUnlocked?: boolean
        }
      | undefined
  }
>

type WindowProvider = {
  coinbaseWalletExtension?: WalletProvider | undefined
  ethereum?: WalletProvider | undefined
  phantom?: { ethereum: WalletProvider } | undefined
  providers?: any[] | undefined // Adjust the type as needed
}

/*
 * Gets the `window.namespace` window provider if it exists
 */
function getWindowProviderNamespace(namespace: string) {
  const providerSearch = (provider: any, namespace: string): any => {
    const [property, ...path] = namespace.split('.')
    const _provider = provider[property]
    if (_provider) {
      if (path.length === 0) {
        return _provider
      }
      return providerSearch(_provider, path.join('.'))
    }
  }
  if (typeof window !== 'undefined') {
    return providerSearch(window, namespace)
  }
}

/*
 * Returns the explicit window provider that matches the flag and the flag is true
 */
function getExplicitInjectedProvider(flag: WalletProviderFlags) {
  const _window =
    typeof window !== 'undefined' ? (window as WindowProvider) : undefined
  if (
    typeof _window === 'undefined' ||
    typeof _window.ethereum === 'undefined'
  ) {
    return
  }
  const providers = _window.ethereum.providers
  return providers
    ? providers.find((provider) => provider[flag])
    : _window.ethereum[flag]
      ? _window.ethereum
      : undefined
}

/*
 * Checks if the explict provider or window ethereum exists
 */
export function hasInjectedProvider({
  flag,
  namespace,
}: {
  flag?: WalletProviderFlags
  namespace?: string
}): boolean {
  if (
    namespace &&
    typeof getWindowProviderNamespace(namespace) !== 'undefined'
  ) {
    return true
  }
  if (flag && typeof getExplicitInjectedProvider(flag) !== 'undefined') {
    return true
  }
  return false
}
