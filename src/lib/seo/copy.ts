import { localeMetadata, type Locale } from '@/config/i18n'

/**
 * Helpers to fill SEO templates (src/content/seo) with database values.
 * Pure functions: tested in test/seo.test.ts.
 */

/**
 * A type name used inside a sentence ("Cafetería" → "cafetería"). German
 * nouns keep their capital letter.
 */
export function inSentence(locale: Locale, text: string): string {
  if (locale === 'de' || text.length === 0) return text
  return text.charAt(0).toLocaleLowerCase(localeMetadata[locale].intlLocale) + text.slice(1)
}

/**
 * "A, B y C" when every item is shown; "A, B, C…" when there are more than
 * `max` (so a description never implies the list is complete).
 */
export function listNames(locale: Locale, names: readonly string[], total: number, max = 3) {
  const shown = names.slice(0, max)
  if (shown.length === 0) return ''
  if (total > shown.length) return `${shown.join(', ')}…`
  return new Intl.ListFormat(localeMetadata[locale].intlLocale, { type: 'conjunction' }).format(
    shown,
  )
}

/** Joins sentences, skipping empty parts. */
export function sentences(...parts: (string | null | undefined)[]): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
}
