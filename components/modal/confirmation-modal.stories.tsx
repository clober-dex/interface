import React from 'react'
import '../../styles/globals.css'
import { Meta, StoryObj } from '@storybook/react'
import { mainnet, polygon } from 'viem/chains'

import ConfirmationModal from './confirmation-modal'

export default {
  title: 'Modal/ConfirmationModal',
  component: ConfirmationModal,
  parameters: {
    layout: 'centered',
  },
  render: ({ ...args }) => (
    <div className="w-[288px]">
      <ConfirmationModal {...args} />
    </div>
  ),
} as Meta<typeof ConfirmationModal>

type Story = StoryObj<typeof ConfirmationModal>

export const Default: Story = {
  args: {
    confirmation: {
      title: 'Confirm',
      body: 'Are you sure you want to do this?',
      chain: mainnet,
      fields: [
        {
          currency: {
            address: '0x0000000000000000000000000000000000000003',
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          label: 'Field 1',
          primaryText: 'Value 1',
          secondaryText: 'Value 2',
        },
        {
          currency: {
            address: '0x0000000000000000000000000000000000000003',
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          label: 'Field 1',
          primaryText: 'Value 1',
          secondaryText: 'Value 2',
        },
      ],
    },
  },
}

export const DefaultWithDirection: Story = {
  args: {
    confirmation: {
      title: 'Confirm',
      body: 'Are you sure you want to do this?',
      chain: mainnet,
      fields: [
        {
          direction: 'in',
          currency: {
            address: '0x0000000000000000000000000000000000000003',
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          label: 'Field 1',
          primaryText: 'Value 1',
          secondaryText: 'Value 2',
        },
        {
          direction: 'out',
          currency: {
            address: '0x0000000000000000000000000000000000000003',
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          label: 'Field 1',
          primaryText: 'Value 1',
          secondaryText: 'Value 2',
        },
        {
          direction: 'out',
          currency: {
            address: '0x0000000000000000000000000000000000000003',
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          label: 'Field 1',
          primaryText: 'Value 1',
          secondaryText: 'Value 2',
        },
      ],
    },
  },
}

export const DefaultWithChainAndDirection: Story = {
  args: {
    confirmation: {
      title: 'Confirm',
      body: 'Are you sure you want to do this?',
      chain: mainnet,
      fields: [
        {
          direction: 'in',
          currency: {
            address: '0x0000000000000000000000000000000000000003',
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          chain: polygon,
          label: 'Field 1',
          primaryText: 'Value 1',
          secondaryText: 'Value 2',
        },
        {
          direction: 'out',
          currency: {
            address: '0x0000000000000000000000000000000000000003',
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          chain: mainnet,
          label: 'Field 1',
          primaryText: 'Value 1',
          secondaryText: 'Value 2',
        },
      ],
    },
  },
}

const steps = [
  { name: 'Step 1', status: 'complete' },
  { name: 'Step 2', status: 'complete' },
  { name: 'Step 3', status: 'current' },
  { name: 'Step 4', status: 'upcoming' },
]

export const Body: Story = {
  args: {
    confirmation: {
      title: 'Confirm',
      body: 'Are you sure you want to do this?',
      chain: mainnet,
      fields: [
        {
          direction: 'in',
          currency: {
            address: '0x0000000000000000000000000000000000000003',
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          chain: polygon,
          label: 'Field 1',
          primaryText: 'Value 1',
          secondaryText: 'Value 2',
        },
        {
          direction: 'out',
          currency: {
            address: '0x0000000000000000000000000000000000000003',
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          chain: mainnet,
          label: 'Field 1',
          primaryText: 'Value 1',
          secondaryText: 'Value 2',
        },
      ],
      footer: (
        <nav
          aria-label="Progress"
          className="flex items-center justify-center mt-1"
        >
          <p className="text-sm font-medium text-white">
            Step {steps.findIndex((step) => step.status === 'current') + 1} of{' '}
            {steps.length}
          </p>
          <ol role="list" className="ml-6 flex items-center space-x-5">
            {steps.map((step) => (
              <li key={step.name}>
                {step.status === 'complete' ? (
                  <div className="block size-2.5 rounded-full hover:bg-indigo-900 bg-indigo-500 dark:hover:bg-indigo-400">
                    <span className="sr-only">{step.name}</span>
                  </div>
                ) : step.status === 'current' ? (
                  <div
                    aria-current="step"
                    className="relative flex items-center justify-center"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute flex size-5 p-px"
                    >
                      <span className="size-full rounded-full bg-indigo-900" />
                    </span>
                    <span
                      aria-hidden="true"
                      className="relative block size-2.5 rounded-full bg-indigo-500"
                    />
                    <span className="sr-only">{step.name}</span>
                  </div>
                ) : (
                  <div className="block size-2.5 rounded-full bg-white/15 hover:bg-white/25">
                    <span className="sr-only">{step.name}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ),
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}
