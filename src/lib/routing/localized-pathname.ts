import { isLocale, type Locale } from '@/config/i18n'
import { staticPageSegments } from '@/config/routes'

export type PathResolution =
  | { type: 'next' }
  | { type: 'rewrite'; pathname: string }
  | { type: 'redirect'; pathname: string; permanent: boolean }

const staticPageEntries = Object.entries(staticPageSegments) as [string, Record<Locale, string>][]

function join(segments: string[]): string {
  return `/${segments.join('/')}`
}

function resolveStaticPage(locale: Locale, segments: string[]): PathResolution | null {
  const segment = segments[1]
  for (const [internal, localized] of staticPageEntries) {
    const publicSegment = localized[locale]
    if (publicSegment === internal) {
      if (segment === internal) return { type: 'next' }
      continue
    }
    if (segment === publicSegment) {
      return { type: 'rewrite', pathname: join([locale, internal, ...segments.slice(2)]) }
    }
    if (segment === internal) {
      return {
        type: 'redirect',
        pathname: join([locale, publicSegment, ...segments.slice(2)]),
        permanent: true,
      }
    }
  }
  return null
}

/**
 * Maps a public pathname to what the proxy must do:
 * - uppercase letters → permanent redirect to the lowercase URL (every slug
 *   is lowercase, so /ES/Salou and /es/salou are the same resource)
 * - no locale prefix → redirect to the detected locale
 * - localized fixed segment (e.g. /es/buscar) → rewrite to the internal route
 * - internal spelling in a locale that localizes it (/es/search) → redirect
 */
export function resolveLocalizedPathname(
  pathname: string,
  detectLocale: () => Locale,
): PathResolution {
  const lowercase = pathname.toLowerCase()
  if (lowercase !== pathname) return { type: 'redirect', pathname: lowercase, permanent: true }

  const segments = pathname.split('/').filter(Boolean)
  const [first] = segments

  if (!isLocale(first)) {
    // Depends on request headers, so it must not be cached as permanent.
    return { type: 'redirect', pathname: join([detectLocale(), ...segments]), permanent: false }
  }
  if (segments.length < 2) return { type: 'next' }

  return resolveStaticPage(first, segments) ?? { type: 'next' }
}
