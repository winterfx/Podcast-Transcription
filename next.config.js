/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // This is experimental but required for the build
    serverActions: true,
  },
}

module.exports = nextConfig
