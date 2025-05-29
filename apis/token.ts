import {
  createPublicClient,
  getAddress,
  http,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { CHAIN_IDS } from '@clober/v2-sdk'
import axios from 'axios'

import { ERC20_PERMIT_ABI } from '../abis/@openzeppelin/erc20-permit-abi'
import { Chain } from '../model/chain'
import { CHAIN_CONFIG } from '../chain-configs'
import { Currency } from '../model/currency'
import { TokenInfo } from '../model/token-info'

const buildTotalSupplyCacheKey = (
  chainId: CHAIN_IDS,
  tokenAddress: `0x${string}`,
) => `${chainId}:${tokenAddress}`
const totalSupplyCache = new Map<string, bigint>()
const getTotalSupplyFromCache = (
  chainId: CHAIN_IDS,
  tokenAddress: `0x${string}`,
): bigint | undefined =>
  totalSupplyCache.get(buildTotalSupplyCacheKey(chainId, tokenAddress))
const setTotalSupplyToCache = (
  chainId: CHAIN_IDS,
  tokenAddress: `0x${string}`,
  totalSupply: bigint,
) =>
  totalSupplyCache.set(
    buildTotalSupplyCacheKey(chainId, tokenAddress),
    totalSupply,
  )

export async function fetchTotalSupply(
  chain: Chain,
  tokenAddress: `0x${string}`,
): Promise<bigint> {
  const cachedTotalSupply = getTotalSupplyFromCache(chain.id, tokenAddress)
  if (cachedTotalSupply !== undefined) {
    return cachedTotalSupply
  }
  const totalSupply = await fetchTotalSupplyInner(chain, tokenAddress)
  setTotalSupplyToCache(chain.id, tokenAddress, totalSupply)
  return totalSupply
}

async function fetchTotalSupplyInner(
  chain: Chain,
  tokenAddress: `0x${string}`,
): Promise<bigint> {
  if (isAddressEqual(tokenAddress, zeroAddress)) {
    return 120_000_000n * 1000000000000000000n // DEV: 120M for ETH
  }
  const publicClient = createPublicClient({
    chain,
    transport: http(CHAIN_CONFIG.RPC_URL),
  })
  return publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_PERMIT_ABI,
    functionName: 'totalSupply',
  })
}

export async function fetchWhitelistCurrenciesFromGithub(
  chain: Chain,
): Promise<Currency[]> {
  if (!CHAIN_CONFIG.ASSETS_GITHUB_REPO) {
    return [] as Currency[]
  }
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${CHAIN_CONFIG.ASSETS_GITHUB_REPO}/refs/heads/main/${chain.id}/assets.json`,
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch whitelist for ${chain.name}`)
    }
    const currencies = (await response.json()) as {
      address: `0x${string}`
      decimals: number
      symbol: string
      name: string
      icon?: string
    }[]
    return currencies.map((currency) =>
      currency.icon
        ? {
            address: getAddress(currency.address),
            decimals: currency.decimals,
            symbol: currency.symbol,
            name: currency.name,
            icon: `https://raw.githubusercontent.com/${CHAIN_CONFIG.ASSETS_GITHUB_REPO}/refs/heads/main/${chain.id}/icons/${currency.icon}`,
          }
        : {
            address: getAddress(currency.address),
            decimals: currency.decimals,
            symbol: currency.symbol,
            name: currency.name,
          },
    )
  } catch (e) {
    console.error(`Failed to fetch whitelist for ${chain.name}`, e)
    return [] as Currency[]
  }
}

export async function fetchTokenInfo({
  chain,
  base,
  quote,
}: {
  chain: Chain
  base: `0x${string}`
  quote: `0x${string}`
}): Promise<TokenInfo | null> {
  if (chain.testnet) {
    return null
  }
  try {
    const {
      data: { tokenInfo },
    } = (await axios.get(
      `/api/chains/${chain.id}/base-tokens/${base}/quote-tokens/${quote}`,
    )) as {
      data: { tokenInfo: TokenInfo }
    }
    return tokenInfo
  } catch (error) {
    return null
  }
}
