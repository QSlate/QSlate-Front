import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://s3.tradingview.com; frame-src 'self' https://s.tradingview.com https://www.tradingview.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
