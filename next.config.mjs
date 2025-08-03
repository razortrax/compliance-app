import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sentry configuration options
  sentry: {
    // Suppress source map generation in production for privacy
    hideSourceMaps: process.env.NODE_ENV === 'production',
    
    // Upload source maps during build for better error tracking
    autoInstrumentServerFunctions: true,
    
    // Exclude Sentry from client bundle in development
    excludeServerRoutes: process.env.NODE_ENV === 'development' ? ['/api/debug/**'] : undefined,
  },
  
  // Other Next.js configuration
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: ['@sentry/nextjs']
  }
}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only upload source maps in production
  silent: true,
  
  // Suppress all logs during build
  hideSourceMaps: process.env.NODE_ENV === 'production',
  
  // Upload source maps to Sentry
  widenClientFileUpload: true,
  
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: process.env.NODE_ENV === 'production',
}

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)
