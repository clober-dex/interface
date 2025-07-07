import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'

import { TransactionSettingModal } from './transaction-setting-modal'

export default {
  title: 'Modal/TransactionSettingModal',
  component: TransactionSettingModal,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof TransactionSettingModal>

type Story = StoryObj<typeof TransactionSettingModal>

export const Default: Story = {
  args: {
    selectedExecutorName: null,
    gasPriceMultiplier: '1.05',
    setGasPriceMultiplier: () => {},
    currentGasPrice: BigInt(1000000000), // 1 Gwei
    onClose: () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
