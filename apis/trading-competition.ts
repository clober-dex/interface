import { getAddress, isAddressEqual } from 'viem'
import BigNumber from 'bignumber.js'

import { Subgraph } from '../model/subgraph'
import { TradingCompetitionPnl } from '../model/trading-competition-pnl'
import { currentTimestampInSeconds } from '../utils/date'
import { Prices } from '../model/prices'
import { formatUnits } from '../utils/bigint'

export class TradingCompetition {
  private readonly subgraphEndpoint: string
  private readonly seasonEndTimestamp: number
  private readonly blacklistedUserAddresses: `0x${string}`[] = []
  constructor({
    subgraphEndpoint,
    seasonEndTimestamp,
    blacklistedUserAddresses = [],
  }: {
    subgraphEndpoint: string
    seasonEndTimestamp: number
    blacklistedUserAddresses?: `0x${string}`[]
  }) {
    this.subgraphEndpoint = subgraphEndpoint
    this.seasonEndTimestamp = seasonEndTimestamp
    this.blacklistedUserAddresses = blacklistedUserAddresses.map((address) =>
      getAddress(address),
    )
  }

  public async getTotalRegisteredUsers(): Promise<number> {
    const {
      data: {
        globalState: { totalRegisteredUsers },
      },
    } = await Subgraph.get<{
      data: {
        globalState: { totalRegisteredUsers: string }
      }
    }>(
      this.subgraphEndpoint,
      '',
      '{ globalState(id: "state") { totalRegisteredUsers } }',
      {},
    )
    return Number(totalRegisteredUsers)
  }

  public async getTradingCompetitionLeaderboard({
    maxUsers = 1000,
  }: {
    maxUsers?: number
  }): Promise<{
    [user: `0x${string}`]: TradingCompetitionPnl
  }> {
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
      this.subgraphEndpoint,
      'getUsersPnL',
      'query getUsersPnL($first: Int!) { users( first: $first orderBy: pnl orderDirection: desc where: {isRegistered: true} ) { id pnl trades { token { id decimals symbol } realizedPnL estimatedHolding } } tokens: tokens(where: {price_gt: 0}) { id price } }',
      {
        first: maxUsers,
      },
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
          !this.blacklistedUserAddresses.some((address) =>
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
              now < this.seasonEndTimestamp
                ? trades.reduce((total, trade) => total + trade.pnl, 0)
                : Number(user.pnl),
          }
          return acc
        },
        {} as { [user: `0x${string}`]: TradingCompetitionPnl },
      )
  }

  public async getUserPnL({
    userAddress,
  }: {
    userAddress: `0x${string}`
  }): Promise<TradingCompetitionPnl> {
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
      this.subgraphEndpoint,
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
        now < this.seasonEndTimestamp
          ? trades.reduce((total, trade) => total + trade.pnl, 0)
          : Number(user.pnl),
      trades,
    }
  }
}
