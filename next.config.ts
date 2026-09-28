import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'
// GA4 hosts are allowed only when analytics is configured (see
// src/components/layout/analytics.tsx); otherwise the CSP stays first-party.
const analytics = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  ? {
      script: ' https://www.googletagmanager.com',
      connect:
        ' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com',
    }
  : { script: '', connect: '' }

// Next.js injects inline bootstrap scripts, so a static CSP needs
// 'unsafe-inline' for scripts. Moving to nonces would force every page to
// render dynamically; see docs/ARCHITECTURE.md → "Security".
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${analytics.script}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co${analytics.connect}`,
  "font-src 'self'",
  `connect-src 'self'${analytics.connect}`,
  'frame-src https://www.openstreetmap.org',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  // Pin the workspace root so a lockfile in a parent folder is never picked up.
  turbopack: { root: __dirname },
  poweredByHeader: false,
  images: {
    qualities: [75],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  // The embedded development database (PGlite) ships WASM and data files that
  // must not be bundled.
  serverExternalPackages: ['@electric-sql/pglite'],
  outputFileTracingIncludes: {
    '/**': ['./supabase/migrations/*.sql', './supabase/seed.sql', './supabase/imports/*.sql'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
