import 'server-only'
import type { Locale } from '@/config/i18n'
import type { CollectionCopy, SeoContent } from './types'

const loaders: Record<Locale, () => Promise<SeoContent>> = {
  es: () => import('./es').then((module) => module.default),
  ca: () => import('./ca').then((module) => module.default),
  en: () => import('./en').then((module) => module.default),
  fr: () => import('./fr').then((module) => module.default),
  de: () => import('./de').then((module) => module.default),
  it: () => import('./it').then((module) => module.default),
}

export function getSeoContent(locale: Locale): Promise<SeoContent> {
  return loaders[locale]()
}

export function placeTypeCopy(content: SeoContent, code: string): CollectionCopy {
  return content.placeTypes[code] ?? content.defaultPlaceType
}

export type { CollectionCopy, SeoContent } from './types'
