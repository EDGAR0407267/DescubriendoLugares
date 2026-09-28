import { describe, expect, it } from 'vitest'
import { locales } from '@/config/i18n'
import { legacyPlaceSegments, reservedSlugs, staticPageSegments } from '@/config/routes'
import { negotiateLocale } from '@/lib/i18n/negotiate'
import { resolveLocalizedPathname } from '@/lib/routing/localized-pathname'
import {
  buildQueryString,
  destinationPath,
  destinationSectionPath,
  directoryPath,
  homePath,
  placePath,
  regionPath,
  searchPath,
  staticPagePath,
} from '@/lib/routing/paths'

const detectSpanish = () => 'es' as const

describe('path builders', () => {
  it('builds localized URLs', () => {
    expect(homePath('es')).toBe('/es')
    expect(destinationPath('en', 'cambrils')).toBe('/en/cambrils')
    expect(destinationSectionPath('es', 'cambrils', 'restaurantes')).toBe(
      '/es/cambrils/restaurantes',
    )
    // Place pages live under their type listing: locality → category → place.
    expect(placePath('es', 'cambrils', 'restaurantes', 'demo')).toBe(
      '/es/cambrils/restaurantes/demo',
    )
    expect(placePath('it', 'salou', 'caffe', 'demo')).toBe('/it/salou/caffe/demo')
    expect(regionPath('es', 'costa-daurada')).toBe('/es/costa-daurada')
    expect(staticPagePath('en', 'editorial')).toBe('/en/how-we-select')
    expect(staticPagePath('fr', 'legal')).toBe('/fr/mentions-legales')
    expect(searchPath('de')).toBe('/de/suche')
    expect(directoryPath('es', { type: 'cafe' })).toBe('/es/comer-y-beber?type=cafe')
    expect(directoryPath('en')).toBe('/en/eat-and-drink')
  })

  it('serializes query strings deterministically and drops empty values', () => {
    expect(buildQueryString({ price: [2], feature: ['terrace'] })).toBe('?feature=terrace&price=2')
    expect(buildQueryString({ q: '', page: null, sort: undefined })).toBe('')
    expect(
      destinationSectionPath('es', 'cambrils', 'restaurantes', { price: 2, feature: 'terrace' }),
    ).toBe('/es/cambrils/restaurantes?feature=terrace&price=2')
  })
})

describe('resolveLocalizedPathname', () => {
  it('redirects paths without locale to the detected locale (temporary)', () => {
    expect(resolveLocalizedPathname('/', detectSpanish)).toEqual({
      type: 'redirect',
      pathname: '/es',
      permanent: false,
    })
    expect(resolveLocalizedPathname('/cambrils/restaurantes', () => 'en')).toEqual({
      type: 'redirect',
      pathname: '/en/cambrils/restaurantes',
      permanent: false,
    })
  })

  it('rewrites localized fixed segments to internal routes', () => {
    expect(resolveLocalizedPathname('/es/buscar', detectSpanish)).toEqual({
      type: 'rewrite',
      pathname: '/es/search',
    })
    expect(resolveLocalizedPathname('/ca/menjar-i-beure', detectSpanish)).toEqual({
      type: 'rewrite',
      pathname: '/ca/directory',
    })
  })

  it('redirects internal spellings to the public localized URL (permanent)', () => {
    expect(resolveLocalizedPathname('/es/search', detectSpanish)).toEqual({
      type: 'redirect',
      pathname: '/es/buscar',
      permanent: true,
    })
  })

  it('redirects uppercase URLs to their lowercase spelling (permanent)', () => {
    expect(resolveLocalizedPathname('/ES/Salou/Restaurantes', detectSpanish)).toEqual({
      type: 'redirect',
      pathname: '/es/salou/restaurantes',
      permanent: true,
    })
  })

  it('passes through routes that are already canonical', () => {
    for (const path of [
      '/en/search',
      '/es',
      '/es/cambrils',
      '/es/cambrils/restaurantes',
      '/es/cambrils/restaurantes/x',
      // Former /lugar/ URLs reach the place route, which redirects them.
      '/es/cambrils/lugar/x',
    ]) {
      expect(resolveLocalizedPathname(path, detectSpanish)).toEqual({ type: 'next' })
    }
  })
})

describe('proxy matcher', () => {
  it('skips API routes, Next internals and files, and runs on every page', async () => {
    const { config } = await import('@/proxy')
    const [matcher] = config.matcher
    // The escaped dot matters: without it every path would be skipped.
    expect(matcher).toBe('/((?!api|_next|.*\\..*).*)')
    const pattern = new RegExp(`^${matcher.replace('/(', '/(?:')}$`)
    expect(pattern.test('/es/buscar')).toBe(true)
    expect(pattern.test('/robots.txt')).toBe(false)
  })
})

describe('route configuration', () => {
  it('uses unique public segments per locale', () => {
    for (const locale of locales) {
      const segments = Object.values(staticPageSegments).map((segment) => segment[locale])
      expect(new Set(segments).size).toBe(segments.length)
    }
  })

  it('reserves fixed segments so data slugs cannot shadow them', () => {
    expect(reservedSlugs.has('buscar')).toBe(true)
    for (const segment of legacyPlaceSegments) expect(reservedSlugs.has(segment)).toBe(true)
    expect(reservedSlugs.has('cambrils')).toBe(false)
  })
})

describe('negotiateLocale', () => {
  it('prefers the explicit cookie', () => {
    expect(negotiateLocale('en-US,en;q=0.9', 'ca')).toBe('ca')
  })

  it('honours Accept-Language quality values', () => {
    expect(negotiateLocale('pt-BR,fr;q=0.8,de;q=0.9')).toBe('de')
    expect(negotiateLocale('en-GB,en;q=0.9')).toBe('en')
  })

  it('falls back to the default locale', () => {
    expect(negotiateLocale('pt-PT,ja;q=0.5')).toBe('es')
    expect(negotiateLocale(null, 'xx')).toBe('es')
  })
})
