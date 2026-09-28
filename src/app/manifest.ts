import type { MetadataRoute } from 'next'
import { defaultLocale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { homePath } from '@/lib/routing/paths'

/** Web app manifest: consistent name, colors and icons across platforms. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    start_url: homePath(defaultLocale),
    display: 'browser',
    background_color: '#faf9f6',
    theme_color: '#faf9f6',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
