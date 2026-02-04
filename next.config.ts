import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.nba.com" },
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "cdn.ssref.net" },
    ],
  },
};

export default nextConfig;
