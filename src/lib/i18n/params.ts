import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/config/i18n'

/** Narrows a route `locale` param, responding 404 for unsupported values. */
export function assertLocale(value: string): Locale {
  if (!isLocale(value)) notFound()
  return value
}
