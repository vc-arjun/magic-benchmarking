/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
    unoptimized: true, // Required for static export
  },
  eslint: {
    // Enable strict linting during builds
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Enable strict TypeScript checking during builds
    ignoreBuildErrors: false,
  },
  // Enable static export for GitHub Pages
  output: 'export',
  trailingSlash: true,
  // Configure for GitHub Pages deployment
  basePath: process.env.NODE_ENV === 'production' ? '/magic-benchmarking' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/magic-benchmarking/' : '',
};

module.exports = nextConfig;
