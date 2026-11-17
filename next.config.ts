import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
