/** @type {import('next').NextConfig} */

// Import bundle analyzer (using CommonJS for compatibility)
const bundleAnalyzer = require('@next/bundle-analyzer');

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // External packages configuration
  serverExternalPackages: ['socket.io-client'],
  
  // Development performance improvements
  reactStrictMode: true,
  
  // Moved from experimental to top level
  outputFileTracingExcludes: {
    '*': ['**/node_modules/**'],
  },
  
  // Add some reasonable performance settings
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Disable unused features
  eslint: {
    // Only run ESLint when needed, not on every refresh
    ignoreDuringBuilds: true,
  },
  
  // Optimize build output
  poweredByHeader: false,
  
  // Configure output compression
  compress: true,
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'icon-library.com',
      }
    ],
    // Optimize image delivery
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    domains: ['icon-library.com'], // Allow external images if needed
    unoptimized: true, // Allow unoptimized images to bypass hostname checks
  },
}

// Export with bundle analyzer wrapper
module.exports = withBundleAnalyzer(nextConfig); 