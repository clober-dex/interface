export const ROUTER_GATEWAY_ABI = [
  // function swap(address inToken, address outToken, uint256 amountIn, uint256 minAmountOut, address router, bytes calldata data, uint256 fee)
  {
    inputs: [
      { internalType: 'address', name: 'inToken', type: 'address' },
      { internalType: 'address', name: 'outToken', type: 'address' },
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'minAmountOut',
        type: 'uint256',
      },
      { internalType: 'address', name: 'router', type: 'address' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
      { name: 'fee', type: 'uint256', internalType: 'uint256' },
    ],
    name: 'swap',
    outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const
