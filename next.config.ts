import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.yjlogs.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.yjlogs.com",
              "style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev",
              "img-src 'self' data: https:",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://*.clerk.accounts.dev",
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk.yjlogs.com https://clerk-telemetry.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
