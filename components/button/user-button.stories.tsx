import { Meta, StoryObj } from '@storybook/react'
import '../../styles/globals.css'
import { mainnet } from 'viem/chains'

import { UserButton } from './user-button'

export default {
  title: 'Button/UserButton',
  component: UserButton,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof UserButton>

type Story = StoryObj<typeof UserButton>

export const Default: Story = {
  args: {
    address: '0x0F97F07d7473EFB5c846FB2b6c201eC1E316E994',
    chain: mainnet,
    walletIconUrl: null,
    openTransactionHistoryModal: () => {},
    ens: null,
  },
}

export const Shiny: Story = {
  args: {
    address: '0x0F97F07d7473EFB5c846FB2b6c201eC1E316E994',
    chain: mainnet,
    walletIconUrl: null,
    openTransactionHistoryModal: () => {},
    shiny: true,
    ens: null,
  },
}
