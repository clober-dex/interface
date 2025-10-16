export type RemoteChainBalances = {
  [key in `0x${string}`]: {
    total: bigint
    breakdown: { chainId: number; chainName: string; balance: bigint }[]
  }
}
