import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  async headers() {
    const allowEmbed = process.env.ALLOW_EMBED === 'true'
    const securityHeaders: { key: string; value: string }[] = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ]
    if (allowEmbed) {
      securityHeaders.push({ key: 'Content-Security-Policy', value: 'frame-ancestors *' })
    } else {
      securityHeaders.push({ key: 'X-Frame-Options', value: 'DENY' })
    }
    securityHeaders.push(
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    )
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
