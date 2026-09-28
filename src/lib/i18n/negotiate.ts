import { defaultLocale, isLocale, type Locale } from '@/config/i18n'

interface WeightedLanguage {
  tag: string
  quality: number
}

function parseAcceptLanguage(header: string): WeightedLanguage[] {
  return header
    .split(',')
    .map((part, index) => {
      const [rawTag, ...params] = part.trim().split(';')
      const qualityParam = params.find((param) => param.trim().startsWith('q='))
      const quality = qualityParam ? Number(qualityParam.trim().slice(2)) : 1
      // Stable ordering for equal weights: earlier entries win.
      return { tag: rawTag.toLowerCase(), quality: Number.isFinite(quality) ? quality : 0, index }
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
}

/**
 * Picks the UI locale for a request without a locale prefix.
 * Priority: explicit preference cookie → Accept-Language → default locale.
 */
export function negotiateLocale(
  acceptLanguage: string | null | undefined,
  cookieLocale?: string | null,
): Locale {
  if (isLocale(cookieLocale)) return cookieLocale
  if (!acceptLanguage) return defaultLocale

  for (const { tag } of parseAcceptLanguage(acceptLanguage)) {
    const primary = tag.split('-')[0]
    if (isLocale(primary)) return primary
  }
  return defaultLocale
}
