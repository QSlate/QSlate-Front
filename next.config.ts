import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const projectRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)));

const nextConfig: NextConfig = {
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      path.resolve(projectRoot, 'node_modules'),
      ...(config.resolve.modules || ['node_modules']),
    ];
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      tailwindcss: path.resolve(projectRoot, 'node_modules/tailwindcss'),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://s3.tradingview.com https://*.tradingview.com https://www.tradingview-widget.com; worker-src 'self' blob: https://cdn.jsdelivr.net https://*.tradingview.com; connect-src 'self' http://localhost:8080 http://127.0.0.1:8080 ws://localhost:8080 ws://127.0.0.1:8080 ws: wss: data: blob: https://cdn.jsdelivr.net https://*.tradingview.com wss://*.tradingview.com https://data.tradingview.com; img-src 'self' data: blob: https://cdn.jsdelivr.net https://*.tradingview.com https://s3-symbol-logo.tradingview.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.tradingview.com; font-src 'self' data: https://cdn.jsdelivr.net https://*.tradingview.com; frame-src 'self' https://s.tradingview.com https://www.tradingview.com https://www.tradingview-widget.com https://*.tradingview.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
