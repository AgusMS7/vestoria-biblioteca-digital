import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
