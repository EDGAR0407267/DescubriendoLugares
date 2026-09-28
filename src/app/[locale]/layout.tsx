import type { Metadata, Viewport } from 'next'
import { Geist, Instrument_Serif } from 'next/font/google'
import { locales } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { listDestinations } from '@/features/destinations/queries'
import { getRegion, listSitemapRegions } from '@/features/regions/queries'
import { getServerEnv } from '@/lib/env'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { assertLocale } from '@/lib/i18n/params'
import { Analytics } from '@/components/layout/analytics'
import { SiteFooter } from '@/components/layout/site-footer'
import { isPageAvailable } from '@/components/layout/static-page'
import '../globals.css'

const sans = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' })
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

// Unknown locales never reach this layout: the proxy prefixes every path with
// a supported locale and assertLocale() guards direct renders.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export function generateMetadata(): Metadata {
  const env = getServerEnv()
  return {
    metadataBase: new URL(env.siteUrl),
    applicationName: siteConfig.name,
    formatDetection: { telephone: false, address: false, email: false },
    // Search Console / Bing Webmaster verification, only when configured.
    verification: {
      google: env.verification.google ?? undefined,
      other: env.verification.bing ? { 'msvalidate.01': env.verification.bing } : undefined,
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#faf9f6',
  width: 'device-width',
  initialScale: 1,
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = assertLocale((await params).locale)
  const [dict, destinations, hubSlugs] = await Promise.all([
    getDictionary(locale),
    listDestinations(locale),
    listSitemapRegions(),
  ])
  const hubs = (await Promise.all(hubSlugs.map((hub) => getRegion(locale, hub.slug)))).flatMap(
    (hub) => (hub ? [{ slug: hub.slug, name: hub.name }] : []),
  )
  const env = getServerEnv()
  const isDemoData = env.dataSource === 'embedded'

  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          {dict.common.skipToContent}
        </a>
        {isDemoData ? (
          <p className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-white/90">
            {dict.common.demoBanner}
          </p>
        ) : null}
        {children}
        <SiteFooter
          locale={locale}
          dict={dict}
          destinations={destinations}
          hubs={hubs}
          hasContactPage={isPageAvailable('contact')}
        />
        {env.gaMeasurementId ? <Analytics measurementId={env.gaMeasurementId} /> : null}
      </body>
    </html>
  )
}
