import { createPublicClient, getAddress, http } from 'viem'
import BigNumber from 'bignumber.js'

import { Prices } from '../../model/prices'
import { CHAIN_CONFIG } from '../../chain-configs'
import { WHITELISTED_FUTURES_ASSETS } from '../../constants/futures'

export const fetchLeverageIndexPrices = async (): Promise<Prices> => {
  if (!CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.TRADING_COMPETITION_SEASON2) {
    return {} as Prices
  }
  const publicClient = createPublicClient({
    chain: CHAIN_CONFIG.CHAIN,
    transport: http(CHAIN_CONFIG.RPC_URL),
  })
  const results = await publicClient.readContract({
    address: '0xFAC34076fc84579916573c2C307d70304caB2c8E',
    abi: [
      {
        inputs: [
          { internalType: 'bytes32[]', name: 'assetIds', type: 'bytes32[]' },
        ],
        name: 'getAssetsPrices',
        outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getAssetsPrices',
    args: [WHITELISTED_FUTURES_ASSETS.map((asset) => asset.priceFeedId)],
  })
  return results.reduce((acc, price, index) => {
    const asset = WHITELISTED_FUTURES_ASSETS[index]
    acc[getAddress(asset.address)] = new BigNumber(price.toString())
      .div(new BigNumber(10).pow(18))
      .toNumber()
    return acc
  }, {} as Prices)
}
