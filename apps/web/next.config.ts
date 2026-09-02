import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.yjlogs.com',
      },
    ],
    // R2 원본에 Cache-Control이 없어 기본값 4시간으로 폴백하던 것을 1년으로 올린다.
    // 업로드 키에 매 업로드마다 타임스탬프가 붙어 유일하게 생성되므로
    // 같은 URL에 다른 내용이 덮이는 일이 없다.
    minimumCacheTTL: 31536000,
    // 콘텐츠 폭 980px 기준. 2x DPI를 감안해도 1920px 초과 변형은 사용되지 않는다.
    // 변형 수를 줄이면 저트래픽 환경에서 캐시 히트율이 올라간다.
    deviceSizes: [640, 828, 1080, 1920],
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.yjlogs.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev",
              "img-src 'self' data: https:",
              'frame-src https://www.youtube.com https://www.youtube-nocookie.com https://*.clerk.accounts.dev',
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk.yjlogs.com https://clerk-telemetry.com https://*.google-analytics.com https://*.analytics.google.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
