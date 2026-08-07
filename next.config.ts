import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel auto-detects Next.js and handles output optimisation.
     No `output: "standalone"` needed — that's for self-hosted Docker. */
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
