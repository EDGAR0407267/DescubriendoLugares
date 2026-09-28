import 'server-only'
import type { Locale } from '@/config/i18n'
import type { ContentPage, StaticPageContent, StaticPagesContent } from './types'

const loaders: Record<Locale, () => Promise<StaticPagesContent>> = {
  es: () => import('./es').then((module) => module.default),
  ca: () => import('./ca').then((module) => module.default),
  en: () => import('./en').then((module) => module.default),
  fr: () => import('./fr').then((module) => module.default),
  de: () => import('./de').then((module) => module.default),
  it: () => import('./it').then((module) => module.default),
}

export async function getStaticPageContent(
  locale: Locale,
  page: ContentPage,
): Promise<StaticPageContent> {
  return (await loaders[locale]())[page]
}

export type { ContentPage, StaticPageContent } from './types'
