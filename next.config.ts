import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/System Volume Information/**",
        "**/$RECYCLE.BIN/**"
      ]
    };
    return config;
  }
};

export default nextConfig;

