import { createPublicClient, getAddress, http, isAddressEqual } from 'viem'
import BigNumber from 'bignumber.js'

import { Subgraph } from '../../model/subgraph'
import { Prices } from '../../model/prices'
import { formatUnits } from '../../utils/bigint'
import { TradingCompetitionPnl } from '../../model/trading-competition-pnl'
import { CHAIN_CONFIG } from '../../chain-configs'
import { WHITELISTED_FUTURES_ASSETS } from '../../constants/futures'
import { currentTimestampInSeconds } from '../../utils/date'
export const SEASON_2_END_TIMESTAMP = 1756684800

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
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.TRADING_COMPETITION_SEASON2,
    '',
    '{ globalState(id: "state") { totalRegisteredUsers } }',
    {},
  )
  return Number(totalRegisteredUsers)
}

export const fetchUserPnL = async (
  userAddress: `0x${string}`,
): Promise<TradingCompetitionPnl> => {
  const {
    data: { user, myTrades, tokens },
  } = await Subgraph.get<{
    data: {
      user: { id: string; pnl: string } // pnl is the final pnl
      myTrades: Array<{
        token: { id: string; decimals: string; name: string; symbol: string }
        realizedPnL: string
        estimatedHolding: string
      }>
      tokens: Array<{ id: string; price: string }>
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.TRADING_COMPETITION_SEASON2,
    'getTrades',
    'query getTrades($userAddress: String!) { user: user(id: $userAddress) { id pnl } myTrades: trades(where: {user: $userAddress}) { token { id decimals name symbol } realizedPnL estimatedHolding } tokens: tokens(where: {price_gt: 0}) { id price } }',
    {
      userAddress: userAddress.toLowerCase(),
    },
  )
  const now = currentTimestampInSeconds()
  const prices: Prices = tokens.reduce((acc, token) => {
    const address = getAddress(token.id)
    acc[address] = new BigNumber(token.price).toNumber()
    return acc
  }, {} as Prices)

  const trades = myTrades.map((trade) => {
    const token = getAddress(trade.token.id)
    const amount = formatUnits(
      BigInt(trade.estimatedHolding),
      Number(trade.token.decimals),
    )
    const pnl =
      Number(trade.realizedPnL) + Number(amount) * (prices[token] ?? 0)
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
  })
  return {
    totalPnl:
      now < SEASON_2_END_TIMESTAMP
        ? trades.reduce((total, trade) => total + trade.pnl, 0)
        : Number(user.pnl),
    trades,
  }
}

export const fetchTradingCompetitionLeaderboard = async (): Promise<{
  [user: `0x${string}`]: TradingCompetitionPnl
}> => {
  const {
    data: { users, tokens },
  } = await Subgraph.get<{
    data: {
      users: Array<{
        id: string
        pnl: string // final pnl
        trades: Array<{
          token: { id: string; decimals: string; symbol: string }
          realizedPnL: string
          estimatedHolding: string
        }>
      }>
      tokens: Array<{
        id: string
        price: string // price in USD
      }>
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.TRADING_COMPETITION_SEASON2,
    'getUsersPnL',
    '{ users( first: 100 orderBy: pnl orderDirection: desc where: {isRegistered: true} ) { id pnl trades { token { id decimals symbol } realizedPnL estimatedHolding } } tokens: tokens(where: {price_gt: 0}) { id price } }',
    {},
  )
  const now = currentTimestampInSeconds()
  const prices: Prices = tokens.reduce((acc, token) => {
    const address = getAddress(token.id)
    acc[address] = new BigNumber(token.price).toNumber()
    return acc
  }, {} as Prices)

  return users
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
          const pnl =
            Number(trade.realizedPnL) + Number(amount) * (prices[token] ?? 0)
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
          totalPnl:
            now < SEASON_2_END_TIMESTAMP
              ? trades.reduce((total, trade) => total + trade.pnl, 0)
              : Number(user.pnl),
        }
        return acc
      },
      {} as { [user: `0x${string}`]: TradingCompetitionPnl },
    )
}

export const fetchLeverageIndexOraclePrices = async (): Promise<Prices> => {
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
