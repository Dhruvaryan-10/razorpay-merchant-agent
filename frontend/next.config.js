/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Required for the geist font package on Next.js < 15.
  transpilePackages: ['geist'],
};

module.exports = nextConfig;
