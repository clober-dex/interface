import { CHAIN_IDS } from '@clober/v2-sdk'
import { createPublicClient, getAddress, http, isAddressEqual } from 'viem'
import BigNumber from 'bignumber.js'

import { Subgraph } from '../../model/subgraph'
import { Prices } from '../../model/prices'
import { formatUnits } from '../../utils/bigint'
import { TradingCompetitionPnl } from '../../model/trading-competition-pnl'
import { currentTimestampInSeconds } from '../../utils/date'
import { CHAIN_CONFIG } from '../../chain-configs'
import { WHITELISTED_FUTURES_ASSETS } from '../../constants/futures'

const BLACKLISTED_USER_ADDRESSES = [
  // '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
  // '0xFC5899D93df81CA11583BEE03865b7B13cE093A7',
  // '0x605fCbDCba6C99b70A0028593a61CA9205e93739',
  // '0x255EC4A7dfefeed4889DbEB03d7aC06ADcCc2D24',
].map((address) => getAddress(address))

export const fetchTotalRegisteredUsers = async (): Promise<number> => {
  const {
    data: {
      globalState: { totalRegisteredUsers },
    },
  } = await Subgraph.get<{
    data: {
      globalState: { totalRegisteredUsers: string }
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.FUTURES,
    '',
    '{ globalState(id: "state") { totalRegisteredUsers } }',
    {},
  )
  return Number(totalRegisteredUsers)
}

export const fetchUserPnL = async (
  chainId: CHAIN_IDS,
  prices: Prices,
  userAddress: `0x${string}`,
): Promise<TradingCompetitionPnl> => {
  const {
    data: { myTrades },
  } = await Subgraph.get<{
    data: {
      myTrades: Array<{
        user: { id: string }
        token: { id: string; decimals: string; name: string; symbol: string }
        realizedPnL: string
        estimatedHolding: string
      }>
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.FUTURES,
    'getTrades',
    'query getTrades($userAddress: String!) { myTrades: trades(where: {user: $userAddress}) { user { id } token { id decimals name symbol } realizedPnL estimatedHolding } }',
    {
      userAddress: userAddress.toLowerCase(),
    },
  )

  return {
    totalPnl: myTrades.reduce((acc, trade) => {
      const token = getAddress(trade.token.id)
      const amount = formatUnits(
        BigInt(trade.estimatedHolding),
        Number(trade.token.decimals),
      )
      const pnl = Number(trade.realizedPnL) + Number(amount) * prices[token]
      return acc + pnl
    }, 0),
    trades: myTrades.map((trade) => {
      const token = getAddress(trade.token.id)
      const amount = formatUnits(
        BigInt(trade.estimatedHolding),
        Number(trade.token.decimals),
      )
      const pnl = Number(trade.realizedPnL) + Number(amount) * prices[token]
      return {
        currency: {
          address: token,
          symbol: trade.token.symbol,
          name: trade.token.name,
          decimals: Number(trade.token.decimals),
        },
        pnl,
        amount: Number(amount),
      }
    }),
  }
}

const cache = new Map<
  string,
  {
    data: {
      [user: `0x${string}`]: TradingCompetitionPnl
    }
    timestamp: number
  }
>()

export const fetchTradingCompetitionLeaderboard = async (
  chainId: CHAIN_IDS,
  prices: Prices,
): Promise<{
  [user: `0x${string}`]: TradingCompetitionPnl
}> => {
  const cacheKey = `${chainId}`
  const cachedData = cache.get(cacheKey)
  if (
    cachedData &&
    Object.keys(prices).length > 0 &&
    cachedData.timestamp > currentTimestampInSeconds() - 60
  ) {
    return cachedData.data
  }
  const {
    data: { users },
  } = await Subgraph.get<{
    data: {
      users: Array<{
        id: string
        trades: Array<{
          token: { id: string; decimals: string; symbol: string }
          realizedPnL: string
          estimatedHolding: string
        }>
      }>
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.FUTURES,
    'getUsersPnL',
    '{ users( first: 100 orderBy: pnl orderDirection: desc where: {isRegistered: true} ) { id trades { token { id decimals symbol } realizedPnL estimatedHolding } } }',
    {},
  )
  const results = users
    .filter(
      (user) =>
        !BLACKLISTED_USER_ADDRESSES.some((address) =>
          isAddressEqual(user.id as `0x${string}`, address),
        ),
    )
    .reduce(
      (acc, user) => {
        const userAddress = getAddress(user.id)
        const trades = user.trades.map((trade) => {
          const token = getAddress(trade.token.id)
          const amount = formatUnits(
            BigInt(trade.estimatedHolding),
            Number(trade.token.decimals),
          )
          const pnl = Number(trade.realizedPnL) + Number(amount) * prices[token]
          return {
            currency: {
              address: token,
              symbol: trade.token.symbol,
              name: trade.token.symbol,
              decimals: Number(trade.token.decimals),
            },
            pnl,
            amount: Number(amount),
          }
        })
        acc[userAddress] = {
          trades,
          totalPnl: trades.reduce((total, trade) => total + trade.pnl, 0),
        }
        return acc
      },
      {} as { [user: `0x${string}`]: TradingCompetitionPnl },
    )
  cache.set(cacheKey, {
    data: results,
    timestamp: currentTimestampInSeconds(),
  })
  return results
}

export const fetchLeverageIndexOraclePrices = async (): Promise<Prices> => {
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
