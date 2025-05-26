import { getAddress, isAddressEqual } from 'viem'

import { Subgraph } from '../../model/subgraph'
import { CHAIN_CONFIG } from '../../chain-configs'

const BLACKLISTED_USER_ADDRESSES = [
  '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
  '0xFC5899D93df81CA11583BEE03865b7B13cE093A7',
  '0x605fCbDCba6C99b70A0028593a61CA9205e93739',
  '0x255EC4A7dfefeed4889DbEB03d7aC06ADcCc2D24',
].map((address) => getAddress(address))

export const fetchUserPnL = async (
  userAddress: `0x${string}`,
): Promise<number> => {
  const {
    data: { user },
  } = await Subgraph.get<{
    data: {
      user: { id: string; pnl: string }
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.TRADING_COMPETITION_SEASON2,
    'getUserPnL',
    'query getUserPnL($userAddress: ID!) { user(id: $userAddress) { id pnl } }',
    {
      userAddress: userAddress.toLowerCase(),
    },
  )

  return Number(user.pnl)
}

export const fetchTradingCompetitionLeaderboard = async (): Promise<{
  [user: `0x${string}`]: number
}> => {
  const {
    data: { users },
  } = await Subgraph.get<{
    data: {
      users: Array<{
        id: string
        pnl: string
      }>
    }
  }>(
    CHAIN_CONFIG.EXTERNAL_SUBGRAPH_ENDPOINTS.TRADING_COMPETITION_SEASON1,
    'getUsersPnL',
    '{ users( first: 1000 orderBy: pnl orderDirection: desc where: {isRegistered: true} ) { id pnl } }',
    {},
  )
  return users
    .filter(
      (user) =>
        !BLACKLISTED_USER_ADDRESSES.some((address) =>
          isAddressEqual(user.id as `0x${string}`, address),
        ),
    )
    .sort((a, b) => Number(b.pnl) - Number(a.pnl))
    .reduce(
      (acc, user) => {
        const userAddress = getAddress(user.id)
        acc[userAddress] = Number(user.pnl)
        return acc
      },
      {} as { [user: `0x${string}`]: number },
    )
}
