import { Meta, StoryObj } from '@storybook/react'

import '../../styles/globals.css'
import { SlippageSelector } from './slippage-selector'
export default {
  title: 'Selector/SlippageSelector',
  component: SlippageSelector,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof SlippageSelector>

type Story = StoryObj<typeof SlippageSelector>

export const Default: Story = {
  args: {
    slippageInput: '1',
    setSlippageInput: () => {},
  },
}

export const Custom: Story = {
  args: {
    slippageInput: '3',
    setSlippageInput: () => {},
  },
}
