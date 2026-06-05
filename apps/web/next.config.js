/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@cps/shared'],
};

module.exports = nextConfig;
