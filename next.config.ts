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
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob: https://cdn.jsdelivr.net; connect-src 'self' ws: wss: data: blob: https://cdn.jsdelivr.net; img-src 'self' data: blob: https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' data: https://cdn.jsdelivr.net; frame-src 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
