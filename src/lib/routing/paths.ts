import type { Locale } from '@/config/i18n'
import { staticPageSegments, type StaticPage } from '@/config/routes'

export type QueryValue = string | number | readonly (string | number)[] | null | undefined

/**
 * Builds a query string with keys sorted alphabetically and empty values
 * dropped, so equivalent filter states always produce the same URL.
 */
export function buildQueryString(query: Record<string, QueryValue>): string {
  const params = new URLSearchParams()
  for (const key of Object.keys(query).sort()) {
    const value = query[key]
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item === null || item === undefined || item === '') continue
      params.append(key, String(item))
    }
  }
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export function homePath(locale: Locale): string {
  return `/${locale}`
}

export function staticPagePath(locale: Locale, page: StaticPage): string {
  return `/${locale}/${staticPageSegments[page][locale]}`
}

export function destinationPath(locale: Locale, destinationSlug: string): string {
  return `/${locale}/${destinationSlug}`
}

/** Regional hub (e.g. /es/costa-daurada); shares the URL level of destinations. */
export function regionPath(locale: Locale, regionSlug: string): string {
  return `/${locale}/${regionSlug}`
}

/** Place-type listings, landing pages and category pages share this shape. */
export function destinationSectionPath(
  locale: Locale,
  destinationSlug: string,
  sectionSlug: string,
  query: Record<string, QueryValue> = {},
): string {
  return `/${locale}/${destinationSlug}/${sectionSlug}${buildQueryString(query)}`
}

/**
 * Place pages live under their primary type listing:
 * /es/salou/restaurantes/{place}. The type segment is resolved from the
 * place itself, so a wrong or outdated segment redirects to this URL.
 */
export function placePath(
  locale: Locale,
  destinationSlug: string,
  typeSlug: string,
  placeSlug: string,
): string {
  return `/${locale}/${destinationSlug}/${typeSlug}/${placeSlug}`
}

export function searchPath(locale: Locale, query: Record<string, QueryValue> = {}): string {
  return `${staticPagePath(locale, 'search')}${buildQueryString(query)}`
}

/** "Comer y beber" directory; filters travel in the query string. */
export function directoryPath(locale: Locale, query: Record<string, QueryValue> = {}): string {
  return `${staticPagePath(locale, 'directory')}${buildQueryString(query)}`
}

export function absoluteUrl(siteUrl: string, path: string): string {
  return `${siteUrl}${path}`
}
