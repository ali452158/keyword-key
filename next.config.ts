import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Standalone output for self-hosting (Hostinger VPS, Docker, etc.).
     Produces a minimal server in .next/standalone that doesn't need
     node_modules — perfect for VPS deployment with PM2. */
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
