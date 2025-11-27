const BUILD =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF !== 'main' ? 'dev' : 'prod'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
  env: {
    BUILD,
  },
  images: {
    domains: [
      'dd.dexscreener.com',
      'raw.githubusercontent.com',
      'imagedelivery.net',
      'cdn.dexscreener.com',
    ],
  },
}

module.exports = nextConfig
