import { localeMetadata, type Locale } from '@/config/i18n'
import type { PluralMessages } from './types'

type Values = Record<string, string | number>

/** Replaces `{name}` placeholders. Unknown placeholders are left untouched. */
export function format(template: string, values: Values = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}

export function plural(locale: Locale, count: number, messages: PluralMessages): string {
  const category = new Intl.PluralRules(localeMetadata[locale].intlLocale).select(count)
  const template = messages[category as keyof PluralMessages] ?? messages.other
  return format(template, { count: formatNumber(locale, count) })
}

export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(localeMetadata[locale].intlLocale).format(value)
}

export function formatCurrency(locale: Locale, value: number, currency: string): string {
  return new Intl.NumberFormat(localeMetadata[locale].intlLocale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

/** "27 de septiembre de 2026" (dates from the database, never invented). */
export function formatDate(locale: Locale, isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  return new Intl.DateTimeFormat(localeMetadata[locale].intlLocale, {
    dateStyle: 'long',
    timeZone: 'Europe/Madrid',
  }).format(date)
}
