import '../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'

import Sidebar from './sidebar'

export default {
  title: 'Common/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof Sidebar>

type Story = StoryObj<typeof Sidebar>
export const Default: Story = {
  args: {
    // @ts-ignore
    router: {
      query: {
        mode: 'borrow',
      },
      pathname: '/dashboard',
    },
    selectedMode: 'deposit',
  },
}
