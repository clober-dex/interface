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

  framework: '@storybook/nextjs',

  docs: {
    autodocs: 'tag',
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript'
  },

  webpackFinal: async (config) => {
    config.plugins = config.plugins?.filter(
      (plugin) => plugin?.constructor.name !== 'HtmlWebpackPlugin'
    )
    return config
  },
}

export default config