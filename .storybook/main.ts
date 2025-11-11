import type { StorybookConfig } from '@storybook/nextjs'
import path from 'path'

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
  docs: { autodocs: 'tag' },
  typescript: { reactDocgen: 'react-docgen-typescript' },

  webpackFinal: async (config) => {
    config.plugins = config.plugins?.filter(
      (plugin) => plugin?.constructor?.name !== 'HtmlWebpackPlugin'
    )

    // Tamagui / RN alias
    config.resolve = {
      ...(config.resolve ?? {}),
      alias: {
        ...(config.resolve?.alias ?? {}),
        '@tamagui/core': path.resolve(__dirname, '../node_modules/@tamagui/core'),
        '@tamagui/web': path.resolve(__dirname, '../node_modules/@tamagui/web'),
        'react-native': 'react-native-web',
      },
    }
    return config
  },
}

export default config