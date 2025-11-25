import React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import '../../styles/globals.css'
import TransactionRevertModal from './transaction-revert-modal'

export default {
  title: 'Modal/TransactionRevertModal',
  component: TransactionRevertModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="w-full flex">
      <TransactionRevertModal {...args} />
    </div>
  ),
} as Meta<typeof TransactionRevertModal>

type Story = StoryObj<typeof TransactionRevertModal>

export const Default: Story = {
  args: {
    revertReason:
      'The transaction has been reverted due to insufficient funds in your account. Please ensure you have enough balance to cover the transaction amount and associated fees before trying again.',
    buttonText: 'Close',
    onClick: () => {},
    onClose: () => {},
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
