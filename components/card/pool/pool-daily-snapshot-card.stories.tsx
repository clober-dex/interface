import '../../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet } from 'viem/chains'

import { PoolDailySnapshotCard } from './pool-daily-snapshot-card'

export default {
  title: 'Card/PoolDailySnapshotCard',
  component: PoolDailySnapshotCard,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof PoolDailySnapshotCard>

type Story = StoryObj<typeof PoolDailySnapshotCard>

export const Default: Story = {
  args: {
    chain: mainnet,
    poolKey: '0x',
    currencyA: {
      address: '0x0000000000000000000000000000000000000003',
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    currencyB: {
      address: '0x0000000000000000000000000000000000000003',
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
    apy: 120.5434,
    tvl: 43123123.0123455,
    volume24h: 123123.123411,
  },
}
