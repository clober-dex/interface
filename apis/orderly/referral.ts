import { numberToHex, PublicClient } from 'viem'

import { CHAIN_CONFIG } from '../../chain-configs'
import { REFERRAL_MANAGER_ABI } from '../../abis/referral-manager-abi'

import { SupportedChainIds } from './networks'
import { getBaseUrl, signAndSendRequest } from './utils'
import { getAccountId } from './account'

export async function verifyReferralCode(
  chainId: SupportedChainIds,
  referralCode: string,
): Promise<boolean> {
  const keyRes = await fetch(
    `${getBaseUrl(chainId)}/v1/public/referral/verify_ref_code?referral_code=${referralCode}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
  const keyJson = (await keyRes.json()) as {
    success: boolean
    data: {
      exist: boolean
    }
  }
  if (!keyJson.success) {
    return false
  }
  return keyJson.data.exist
}

export async function getReferralStatus(
  publicClient: PublicClient,
  orderlyKey: Uint8Array,
  userAddress: `0x${string}`,
): Promise<{
  refererCode: string | null
  onChainRefereeRegistered: boolean
}> {
  const accountId = getAccountId(userAddress)
  const chainHexId = numberToHex(publicClient.chain!.id) as SupportedChainIds
  const res = await signAndSendRequest(
    accountId,
    orderlyKey,
    `${getBaseUrl(chainHexId)}/v1/referral/info`,
  )
  const { success, data } = (await res.json()) as {
    success: boolean
    data: {
      referee_info: {
        referer_code: string | null
      }
    }
  }
  if (!success) {
    throw new Error('Failed to get referral code')
  }
  const refereeRegistered = await publicClient.readContract({
    address: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.ReferralManager,
    abi: REFERRAL_MANAGER_ABI,
    functionName: 'refereeRegistered',
    args: [userAddress],
  })

  return {
    refererCode: data.referee_info.referer_code,
    onChainRefereeRegistered: refereeRegistered,
  }
}
