import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'

import { SwapSettingModal } from './swap-setting-modal'

export default {
  title: 'Modal/SwapSettingModal',
  component: SwapSettingModal,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof SwapSettingModal>

type Story = StoryObj<typeof SwapSettingModal>

export const Default: Story = {
  args: {
    selectedExecutorName: null,
    gasPriceMultiplier: '1.05',
    setGasPriceMultiplier: () => {},
    slippageInput: '0.5',
    setSlippageInput: () => {},
    currentGasPrice: BigInt(1000000000), // 1 Gwei
    onClose: () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
