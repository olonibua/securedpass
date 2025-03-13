/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['cloud.appwrite.io'],
  },
};

module.exports = nextConfig;