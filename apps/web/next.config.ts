import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Ignore type and lint errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-expect-error - eslint config exists but type definition is incomplete
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
