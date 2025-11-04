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
  // Enable static export for GitHub Pages deployment
  output: process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS ? 'export' : undefined,
  trailingSlash: true,
  // Configure asset prefix for GitHub Pages if needed
  assetPrefix: process.env.GITHUB_PAGES ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] || ''}` : '',
  basePath: process.env.GITHUB_PAGES ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] || ''}` : '',
};

module.exports = nextConfig;
