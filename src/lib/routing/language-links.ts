import { localeMetadata, locales, type Locale } from '@/config/i18n'
import type { LocalizedPaths } from '@/lib/seo/metadata'
import { homePath } from './paths'

export interface LanguageLink {
  locale: Locale
  nativeName: string
  href: string
}

/**
 * Language switcher targets: the equivalent page when it exists in that
 * locale, otherwise `fallback(locale)` (by default the locale's home page).
 */
export function buildLanguageLinks(
  equivalents: LocalizedPaths,
  fallback: (locale: Locale) => string = homePath,
): LanguageLink[] {
  return locales.map((locale) => ({
    locale,
    nativeName: localeMetadata[locale].nativeName,
    href: equivalents[locale] ?? fallback(locale),
  }))
}

/** Same path builder applied to every locale (for fixed pages). */
export function pathsForAllLocales(build: (locale: Locale) => string): LocalizedPaths {
  return Object.fromEntries(locales.map((locale) => [locale, build(locale)])) as LocalizedPaths
}
