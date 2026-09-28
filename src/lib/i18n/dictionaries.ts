import 'server-only'
import type { Locale } from '@/config/i18n'
import type { Dictionary } from './types'

// Loaded on the server only: dictionaries never reach the client bundle.
// Client components receive the strings they need as props.
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  es: () => import('./dictionaries/es').then((module) => module.default),
  ca: () => import('./dictionaries/ca').then((module) => module.default),
  en: () => import('./dictionaries/en').then((module) => module.default),
  fr: () => import('./dictionaries/fr').then((module) => module.default),
  de: () => import('./dictionaries/de').then((module) => module.default),
  it: () => import('./dictionaries/it').then((module) => module.default),
}

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]()
}
