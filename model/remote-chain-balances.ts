export type RemoteChainBalances = {
  [key in `0x${string}`]: {
    total: bigint
    key: string
    breakdown: { chainId: number; chainName: string; balance: bigint }[]
  }
}
