import type { NextConfig } from "next";

const apiUrl = process.env.SYLON_API_URL || "https://hitachi-samuel-dance-analyst.trycloudflare.com";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
