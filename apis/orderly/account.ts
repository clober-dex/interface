import { getPublicKeyAsync, utils } from '@noble/ed25519'
import { WalletClient } from 'viem'
import {
  AbiCoder,
  encodeBase58,
  keccak256,
  solidityPackedKeccak256,
} from 'ethers'

import { getOffChainDomain, MESSAGE_TYPES } from './constants'
import { SupportedChainIds } from './networks'
import { getBaseUrl } from './utils'

export type Scope =
  | 'read'
  | 'read,trading'
  | 'read,asset'
  | 'read,trading,asset'

export function getAccountId(address: string, brokerId: string = 'clober_dex') {
  const abicoder = AbiCoder.defaultAbiCoder()
  return keccak256(
    abicoder.encode(
      ['address', 'bytes32'],
      [address, solidityPackedKeccak256(['string'], [brokerId])],
    ),
  )
}

export async function isWalletRegistered(
  chainId: SupportedChainIds,
  brokerId: string,
  address: `0x${string}`,
): Promise<boolean> {
  const keyRes = await fetch(
    `${getBaseUrl(chainId)}/v1/get_account?address=${address}&broker_id=${brokerId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
  const keyJson = (await keyRes.json()) as {
    success: boolean
  }
  return keyJson.success
}

export async function addOrderlyKey(
  wallet: WalletClient,
  chainId: SupportedChainIds,
  brokerId: string,
  scope: Scope,
) {
  const privateKey = utils.randomPrivateKey()
  const orderlyKey = `ed25519:${encodeBase58(await getPublicKeyAsync(privateKey))}`
  const timestamp = Date.now()
  const addKeyMessage = {
    brokerId,
    chainId: Number(chainId),
    orderlyKey,
    scope,
    timestamp,
    expiration: timestamp + 1_000 * 60 * 60 * 24 * 365, // 1 year
  }

  const signature = await wallet.signTypedData({
    domain: getOffChainDomain(chainId),
    primaryType: 'AddOrderlyKey',
    types: {
      AddOrderlyKey: MESSAGE_TYPES.AddOrderlyKey,
    },
    message: addKeyMessage,
  } as any)

  const keyRes = await fetch(`${getBaseUrl(chainId)}/v1/orderly_key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: addKeyMessage,
      signature,
      userAddress: wallet.account!.address,
    }),
  })
  const keyJson = await keyRes.json()
  if (!keyJson.success) {
    throw new Error(keyJson.message)
  }
  return privateKey
}

export async function registerAccount(
  wallet: WalletClient,
  chainId: SupportedChainIds,
  brokerId: string,
): Promise<string> {
  const nonceRes = await fetch(`${getBaseUrl(chainId)}/v1/registration_nonce`)
  const nonceJson = await nonceRes.json()
  const registrationNonce = nonceJson.data.registration_nonce as string

  const registerMessage = {
    brokerId,
    chainId: Number(chainId),
    timestamp: Date.now(),
    registrationNonce,
  }

  const signature = await wallet.signTypedData({
    domain: getOffChainDomain(chainId),
    primaryType: 'Registration',
    types: {
      Registration: MESSAGE_TYPES.Registration,
    },
    message: registerMessage,
  } as any)

  const registerRes = await fetch(
    `${getBaseUrl(chainId)}/v1/register_account`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: registerMessage,
        signature,
        userAddress: wallet.account!.address,
      }),
    },
  )
  const registerJson = await registerRes.json()
  if (!registerJson.success) {
    throw new Error(registerJson.message)
  }
  return registerJson.data.account_id
}
