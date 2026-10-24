import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' ws: wss: data: blob:; img-src 'self' data: blob:; frame-src 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
