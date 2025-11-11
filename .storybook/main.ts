import type { StorybookConfig } from '@storybook/nextjs'

// @ts-ignore
const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {},
  },

  docs: {
    autodocs: 'tag',
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript'
  },
}

export default config