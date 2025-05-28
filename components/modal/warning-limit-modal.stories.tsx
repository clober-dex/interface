import React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import '../../styles/globals.css'
import WarningLimitModal from './warning-limit-modal'

export default {
  title: 'Modal/WarningLimitModal',
  component: WarningLimitModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="w-full flex">
      <WarningLimitModal {...args} />
    </div>
  ),
} as Meta<typeof WarningLimitModal>

type Story = StoryObj<typeof WarningLimitModal>

export const Default: Story = {
  args: {
    onChainPrice: 0.00001,
    priceInput: '0.00001',
    priceDeviationPercent: 50,
    closeModal: () => {},
    limit: async () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
