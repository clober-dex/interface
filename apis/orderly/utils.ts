import { encodeBase58 } from 'ethers'
import { getPublicKeyAsync, signAsync } from '@noble/ed25519'

import { SupportedChainIds } from './networks'
import { isTestnet } from './constants'

export async function signAndSendRequest(
  accountId: string,
  orderlyKey: Uint8Array,
  input: URL | string,
  init?: RequestInit | undefined,
): Promise<Response> {
  const timestamp = Date.now()
  const encoder = new TextEncoder()

  const url = new URL(input)
  let message = `${String(timestamp)}${init?.method ?? 'GET'}${url.pathname}`
  if (init?.body) {
    message += init.body
  }
  const orderlySignature = await signAsync(encoder.encode(message), orderlyKey)

  return fetch(input, {
    headers: {
      'Content-Type':
        init?.method !== 'GET' && init?.method !== 'DELETE'
          ? 'application/json'
          : 'application/x-www-form-urlencoded',
      'orderly-timestamp': String(timestamp),
      'orderly-account-id': accountId,
      'orderly-key': `ed25519:${encodeBase58(await getPublicKeyAsync(orderlyKey))}`,
      'orderly-signature': base64EncodeURL(orderlySignature),
      ...(init?.headers ?? {}),
    },
    ...(init ?? {}),
  })
}

export function getBaseUrl(chainId: SupportedChainIds): string {
  return isTestnet(chainId)
    ? 'https://testnet-api-evm.orderly.org'
    : 'https://api-evm.orderly.org'
}

export function base64EncodeURL(byteArray: Uint8Array) {
  return btoa(
    Array.from(new Uint8Array(byteArray))
      .map((val) => {
        return String.fromCharCode(val)
      })
      .join(''),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function base64DecodeURL(b64urlstring: string): Uint8Array {
  return new Uint8Array(
    atob(b64urlstring.replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map((val) => {
        return val.charCodeAt(0)
      }),
  )
}
