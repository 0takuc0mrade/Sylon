import type { NextConfig } from "next";

const apiUrl = process.env.MORLEN_API_URL || "https://morlen.onrender.com";

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
