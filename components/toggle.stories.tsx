import { Meta, StoryObj } from '@storybook/react'

import '../styles/globals.css'
import { Toggle } from './toggle'

export default {
  title: 'Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof Toggle>

type Story = StoryObj<typeof Toggle>

export const Default: Story = {
  args: {
    disabled: false,
    defaultChecked: false,
    onChange: (e) => {
      console.log('Toggle changed:', e.target.checked)
    },
  },
}
