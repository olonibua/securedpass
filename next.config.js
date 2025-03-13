import type { NextConfig } from "next";

const nextConfig = {
  // Your existing config
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ["cloud.appwrite.io"],
  },
};

export default nextConfig;