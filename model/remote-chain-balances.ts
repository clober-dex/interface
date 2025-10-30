export type RemoteChainBalances = {
  [key in `0x${string}`]: {
    total: bigint
    key: string
    breakdown: {
      chain: {
        id: number
        logo: string
        name: string
      }
      balance: bigint
    }[]
  }
}
