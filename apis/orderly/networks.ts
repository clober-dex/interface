import { Chain } from 'viem'

type SupportedChain = Chain & { network: 'mainnet' | 'testnet' }

export const supportedChains = [
  {
    network: 'mainnet',
    id: '0x1',
    token: 'ETH',
    label: 'Ethereum',
    rpcUrl: 'https://arbitrum-one.publicnode.com',
  },
  {
    network: 'mainnet',
    id: '0xa4b1',
    token: 'ETH',
    label: 'Arbitrum One',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
  },
  {
    network: 'mainnet',
    id: '0xa',
    token: 'ETH',
    label: 'OP Mainnet',
    rpcUrl: 'https://mainnet.optimism.io',
  },
  {
    network: 'mainnet',
    id: '0x2105',
    token: 'ETH',
    label: 'Base',
    rpcUrl: 'https://base-rpc.publicnode.com',
  },
  {
    network: 'mainnet',
    id: '0x1388',
    token: 'MNT',
    label: 'Mantle',
    rpcUrl: 'https://rpc.mantle.xyz',
  },
  {
    network: 'mainnet',
    id: '0x531',
    token: 'SEI',
    label: 'Sei',
    rpcUrl: 'https://evm-rpc.sei-apis.com',
  },
  {
    network: 'mainnet',
    id: '0x38',
    token: 'BNB',
    label: 'BSC',
    rpcUrl: 'https://binance.llamarpc.com',
  },
  {
    network: 'mainnet',
    id: '0x868b',
    token: 'ETH',
    label: 'Mode',
    rpcUrl: 'https://mainnet.mode.network',
  },
  {
    network: 'testnet',
    id: '0xaa36a7',
    token: 'ETH',
    label: 'Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  },
  {
    network: 'testnet',
    id: '0x66eee',
    token: 'ETH',
    label: 'Arbitrum Sepolia',
    rpcUrl: 'https://arbitrum-sepolia.publicnode.com',
  },
  {
    network: 'testnet',
    id: '0xaa37dc',
    token: 'ETH',
    label: 'OP Sepolia',
    rpcUrl: 'https://optimism-sepolia.publicnode.com',
  },
  {
    network: 'testnet',
    id: '0x14a34',
    token: 'ETH',
    label: 'Base Sepolia',
    rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
  },
  {
    network: 'testnet',
    id: '0x138b',
    token: 'MNT',
    label: 'Mantle Sepolia',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
  },
  {
    network: 'testnet',
    id: '0xae3f3',
    token: 'SEI',
    label: 'Sei Devnet',
    rpcUrl: 'https://evm-rpc-arctic-1.sei-apis.com',
  },
  {
    network: 'testnet',
    id: '0x61',
    token: 'BNB',
    label: 'BSC Testnet',
    rpcUrl: 'https://bsc-testnet-rpc.publicnode.com',
  },
  {
    network: 'testnet',
    id: '0x61',
    token: 'BNB',
    label: 'BSC Testnet',
    rpcUrl: 'https://bsc-testnet-rpc.publicnode.com',
  },
  {
    network: 'testnet',
    id: '0x279f',
    token: 'MON',
    label: 'Monad Testnet',
    rpcUrl: 'https://monad-testnet.drpc.org',
  },
] as const

export const supportedChainIds = supportedChains.map(({ id }) => id)
export type SupportedChainIds = (typeof supportedChainIds)[0]
