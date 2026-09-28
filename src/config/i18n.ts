/**
 * Single source of truth for supported UI/URL locales.
 * Adding a language: see docs/ARCHITECTURE.md → "Adding a language".
 */
export const locales = ['es', 'ca', 'en', 'fr', 'de', 'it'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'es'

export const LOCALE_COOKIE = 'NEXT_LOCALE'

interface LocaleMetadata {
  /** Name in its own language, shown in the language selector. */
  nativeName: string
  /** Open Graph locale (language_TERRITORY). */
  ogLocale: string
  /** BCP 47 tag for Intl formatters. */
  intlLocale: string
}

export const localeMetadata: Record<Locale, LocaleMetadata> = {
  es: { nativeName: 'Español', ogLocale: 'es_ES', intlLocale: 'es-ES' },
  ca: { nativeName: 'Català', ogLocale: 'ca_ES', intlLocale: 'ca-ES' },
  en: { nativeName: 'English', ogLocale: 'en_GB', intlLocale: 'en-GB' },
  fr: { nativeName: 'Français', ogLocale: 'fr_FR', intlLocale: 'fr-FR' },
  de: { nativeName: 'Deutsch', ogLocale: 'de_DE', intlLocale: 'de-DE' },
  it: { nativeName: 'Italiano', ogLocale: 'it_IT', intlLocale: 'it-IT' },
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (locales as readonly string[]).includes(value)
}
