import type { Metadata } from 'next'
import { defaultLocale, localeMetadata, locales, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import type { RobotsDirective } from './indexing'

export type LocalizedPaths = Partial<Record<Locale, string>>

export interface PageSeo {
  locale: Locale
  title: string
  description: string
  /** Canonical path of this page in `locale` (no origin). */
  path: string
  /**
   * Equivalent pages in other locales. Only include versions that exist and
   * are indexable; they become hreflang links. The current locale is added
   * automatically when the page itself is indexable.
   */
  alternates?: LocalizedPaths
  robots: RobotsDirective
  /** Page image; pages without one share the default brand image. */
  image?: { url: string; alt: string } | null
  /** Set to false for the home page to avoid "Brand · Brand". */
  appendSiteName?: boolean
  /** Open Graph type: `article` for editorial guides, `website` otherwise. */
  ogType?: 'website' | 'article'
}

const TITLE_SEPARATOR = ' · '
const MAX_DESCRIPTION = 160
/**
 * Titles longer than this (with the brand) are truncated in results, so the
 * brand is only appended when it fits: the intent and place come first.
 */
export const MAX_TITLE_WITH_BRAND = 65

/** Branded default share image (src/app/og-default.png/route.tsx). */
export const DEFAULT_OG_IMAGE = { path: '/og-default.png', width: 1200, height: 630 } as const

export function composeTitle(title: string, appendSiteName = true): string {
  if (!appendSiteName || title.includes(siteConfig.name)) return title
  const branded = `${title}${TITLE_SEPARATOR}${siteConfig.name}`
  return branded.length <= MAX_TITLE_WITH_BRAND ? branded : title
}

export function truncateDescription(text: string, max = MAX_DESCRIPTION): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:]+$/, '')}…`
}

/**
 * hreflang map with absolute URLs. `x-default` points to the default-locale
 * version when it exists. Returns undefined when there is nothing to declare.
 */
export function buildLanguageAlternates(
  siteUrl: string,
  paths: LocalizedPaths,
): Record<string, string> | undefined {
  const entries = locales
    .filter((locale) => paths[locale])
    .map((locale) => [locale, `${siteUrl}${paths[locale]}`] as const)
  if (entries.length === 0) return undefined
  const languages: Record<string, string> = Object.fromEntries(entries)
  if (paths[defaultLocale]) languages['x-default'] = `${siteUrl}${paths[defaultLocale]}`
  return languages
}

export function buildMetadata(seo: PageSeo, siteUrl: string): Metadata {
  const title = composeTitle(seo.title, seo.appendSiteName)
  const description = truncateDescription(seo.description)
  const canonical = `${siteUrl}${seo.path}`
  const alternatePaths: LocalizedPaths = seo.robots.index
    ? { ...seo.alternates, [seo.locale]: seo.path }
    : {}
  const images = seo.image
    ? [{ url: seo.image.url, alt: seo.image.alt }]
    : [
        {
          url: `${siteUrl}${DEFAULT_OG_IMAGE.path}`,
          width: DEFAULT_OG_IMAGE.width,
          height: DEFAULT_OG_IMAGE.height,
          alt: siteConfig.name,
        },
      ]
  const ogAlternateLocales = locales
    .filter((locale) => locale !== seo.locale && alternatePaths[locale])
    .map((locale) => localeMetadata[locale].ogLocale)

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(siteUrl, alternatePaths),
    },
    robots: {
      index: seo.robots.index,
      follow: seo.robots.follow,
      // Indexable pages allow large image previews and full snippets.
      ...(seo.robots.index
        ? { 'max-image-preview': 'large' as const, 'max-snippet': -1, 'max-video-preview': -1 }
        : {}),
    },
    openGraph: {
      type: seo.ogType ?? 'website',
      siteName: siteConfig.name,
      title,
      description,
      url: canonical,
      locale: localeMetadata[seo.locale].ogLocale,
      alternateLocale: ogAlternateLocales.length > 0 ? ogAlternateLocales : undefined,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((image) => image.url),
      site: siteConfig.twitterHandle ?? undefined,
    },
  }
}
