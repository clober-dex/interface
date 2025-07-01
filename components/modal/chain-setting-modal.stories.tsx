import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'

import { ChainSettingModal } from './chain-setting-modal'

export default {
  title: 'Modal/ChainSettingModal',
  component: ChainSettingModal,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof ChainSettingModal>

type Story = StoryObj<typeof ChainSettingModal>

export const Default: Story = {
  args: {
    selectedExplorer: 'https://etherscan.io',
    setSelectedExplorer: () => {},
    explorerList: [
      {
        name: 'Etherscan',
        url: 'https://etherscan.io',
      },
      {
        name: 'Blockscout',
        url: 'https://blockscout.com',
      },
      {
        name: 'Snowtrace',
        url: 'https://snowtrace.io',
      },
    ],
    selectedRpcEndpoint: 'https://rpc1.example.com',
    setSelectedRpcEndpoint: () => {},
    rpcList: [
      {
        name: 'RPC 1',
        url: 'https://rpc1.example.com',
        connectionDurationInMs: 120,
      },
      {
        name: 'RPC 2',
        url: 'https://rpc2.example.com',
        connectionDurationInMs: 1040,
      },
      {
        name: 'RPC 3',
        url: 'https://rpc3.example.com',
        connectionDurationInMs: 50,
      },
    ],
    onClose: () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
