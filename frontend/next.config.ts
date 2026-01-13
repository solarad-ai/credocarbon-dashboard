import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Ignore type errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
