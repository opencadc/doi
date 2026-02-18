import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin()

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const nextConfig: NextConfig = {
  // Add these for CANFAR compatibility
  // Use the BASE_PATH from environment if available
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Trust the proxy headers
  poweredByHeader: false,

  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Disable linting during build for production
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack configuration for path aliases
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    return config
  },

  // Original env variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

// next-intl 3.x sets experimental.turbo (deprecated in Next.js 15.5+)
// Move it to turbopack until next-intl is upgraded to v4
const config = withNextIntl(nextConfig) as NextConfig
if (config.experimental?.turbo) {
  config.turbopack = { ...config.turbopack, ...config.experimental.turbo }
  delete config.experimental.turbo
}

export default config
