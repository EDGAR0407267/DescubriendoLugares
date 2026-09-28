import { describe, expect, it } from 'vitest'
import { locales } from '@/config/i18n'
import { getStaticPageContent } from '@/content/pages'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { format, plural } from '@/lib/i18n/format'

function keyPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

function placeholders(value: unknown): string[] {
  if (typeof value === 'string') return (value.match(/\{\w+\}/g) ?? []).sort()
  if (typeof value !== 'object' || value === null) return []
  return Object.values(value).flatMap(placeholders)
}

describe('UI dictionaries', () => {
  it('have exactly the same keys in every locale', async () => {
    const reference = keyPaths(await getDictionary('es')).sort()
    for (const locale of locales) {
      expect(keyPaths(await getDictionary(locale)).sort(), locale).toEqual(reference)
    }
  })

  it('keep the same placeholders as the reference locale', async () => {
    const reference = placeholders(await getDictionary('es')).sort()
    for (const locale of locales) {
      expect(placeholders(await getDictionary(locale)).sort(), locale).toEqual(reference)
    }
  })

  it('have no empty strings', async () => {
    for (const locale of locales) {
      const dict = await getDictionary(locale)
      const empty = keyPaths(dict).filter((path) => {
        const value = path
          .split('.')
          .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], dict)
        return typeof value === 'string' && value.trim() === ''
      })
      expect(empty, locale).toEqual([])
    }
  })
})

describe('static page content', () => {
  it('exists for every locale and page', async () => {
    for (const locale of locales) {
      for (const page of ['about', 'privacy', 'cookies', 'legal'] as const) {
        const content = await getStaticPageContent(locale, page)
        expect(content.title, `${locale}/${page}`).toBeTruthy()
        expect(content.sections.length, `${locale}/${page}`).toBeGreaterThan(0)
      }
    }
  })
})

describe('formatting', () => {
  it('interpolates placeholders', () => {
    expect(
      format('{type} en {destination}', { type: 'Restaurantes', destination: 'Cambrils' }),
    ).toBe('Restaurantes en Cambrils')
    expect(format('{missing}', {})).toBe('{missing}')
  })

  it('pluralizes with locale rules and formats numbers', () => {
    const messages = { one: '{count} lugar', other: '{count} lugares' }
    expect(plural('es', 1, messages)).toBe('1 lugar')
    expect(plural('es', 3, messages)).toBe('3 lugares')
    expect(plural('de', 1200, { one: '{count} Ort', other: '{count} Orte' })).toBe('1.200 Orte')
  })
})
