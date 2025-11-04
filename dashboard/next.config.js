/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  eslint: {
    // Enable strict linting during builds
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Enable strict TypeScript checking during builds
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
