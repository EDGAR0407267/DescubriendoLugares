import { describe, expect, it } from 'vitest'
import { siteConfig } from '@/config/site'
import type { PlaceDetail } from '@/lib/db/contracts'
import { resolveIndexing } from '@/lib/seo/indexing'
import { sortByDistance } from '@/features/destinations/distance'
import { inSentence, listNames, sentences } from '@/lib/seo/copy'
import {
  breadcrumbListSchema,
  FIRST_PARTY_RATING_SOURCE,
  organizationSchema,
  placeSchema,
  serializeJsonLd,
  webPageSchema,
} from '@/lib/seo/json-ld'
import {
  buildLanguageAlternates,
  buildMetadata,
  composeTitle,
  truncateDescription,
} from '@/lib/seo/metadata'
import { escapeXml, localizedUrls, renderUrlSet } from '@/lib/seo/sitemap-xml'

const SITE = 'https://example.com'

describe('resolveIndexing', () => {
  const base = { siteIndexable: true } as const

  it('blocks everything when the site is not indexable', () => {
    expect(resolveIndexing({ ...base, kind: 'home', siteIndexable: false })).toEqual({
      index: false,
      follow: false,
    })
  })

  it('indexes canonical content pages', () => {
    expect(resolveIndexing({ ...base, kind: 'home' })).toEqual({ index: true, follow: true })
    expect(resolveIndexing({ ...base, kind: 'place', contentTranslated: true })).toEqual({
      index: true,
      follow: true,
    })
    expect(
      resolveIndexing({ ...base, kind: 'landing', editorialIndexable: true, placeCount: 3 }),
    ).toEqual({
      index: true,
      follow: true,
    })
  })

  it('serves search, refined results, demo and untranslated content as noindex,follow', () => {
    const noindex = { index: false, follow: true }
    expect(resolveIndexing({ ...base, kind: 'search' })).toEqual(noindex)
    expect(
      resolveIndexing({ ...base, kind: 'collection', hasRefinements: true, placeCount: 50 }),
    ).toEqual(noindex)
    expect(resolveIndexing({ ...base, kind: 'place', isDemo: true })).toEqual(noindex)
    expect(resolveIndexing({ ...base, kind: 'place', contentTranslated: false })).toEqual(noindex)
    // Place pages without editorial content of their own (e.g. fresh imports).
    expect(resolveIndexing({ ...base, kind: 'place', thinContent: true })).toEqual(noindex)
    expect(resolveIndexing({ ...base, kind: 'landing', editorialIndexable: false })).toEqual(
      noindex,
    )
    expect(resolveIndexing({ ...base, kind: 'legal' })).toEqual(noindex)
  })

  it('protects against thin collections', () => {
    expect(resolveIndexing({ ...base, kind: 'collection', placeCount: 2 }).index).toBe(false)
    expect(resolveIndexing({ ...base, kind: 'collection', placeCount: 3 }).index).toBe(true)
    expect(resolveIndexing({ ...base, kind: 'destination', placeCount: 0 }).index).toBe(false)
    expect(
      resolveIndexing({ ...base, kind: 'landing', editorialIndexable: true, placeCount: 2 }).index,
    ).toBe(false)
    expect(resolveIndexing({ ...base, kind: 'landing', placeCount: 50 }).index).toBe(false)
  })
})

describe('buildMetadata', () => {
  const seo = {
    locale: 'es' as const,
    title: 'Restaurantes en Cambrils',
    description: 'Descripción',
    path: '/es/cambrils/restaurantes',
    alternates: { en: '/en/cambrils/restaurants', ca: '/ca/cambrils/restaurants' },
  }

  it('sets canonical, hreflang (with x-default) and Open Graph', () => {
    const metadata = buildMetadata({ ...seo, robots: { index: true, follow: true } }, SITE)
    expect(metadata.alternates?.canonical).toBe(`${SITE}/es/cambrils/restaurantes`)
    expect(metadata.alternates?.languages).toEqual({
      es: `${SITE}/es/cambrils/restaurantes`,
      ca: `${SITE}/ca/cambrils/restaurants`,
      en: `${SITE}/en/cambrils/restaurants`,
      'x-default': `${SITE}/es/cambrils/restaurantes`,
    })
    expect(metadata.openGraph).toMatchObject({
      locale: 'es_ES',
      url: `${SITE}/es/cambrils/restaurantes`,
    })
    expect(metadata.title).toEqual({ absolute: `Restaurantes en Cambrils · ${siteConfig.name}` })
  })

  it('omits hreflang for noindex pages', () => {
    const metadata = buildMetadata({ ...seo, robots: { index: false, follow: true } }, SITE)
    expect(metadata.alternates?.languages).toBeUndefined()
    expect(metadata.robots).toEqual({ index: false, follow: true })
    // Noindex pages never advertise alternates in Open Graph either.
    expect(metadata.openGraph?.alternateLocale).toBeUndefined()
  })

  it('omits x-default when the default locale version does not exist', () => {
    expect(buildLanguageAlternates(SITE, { en: '/en/x' })).toEqual({ en: `${SITE}/en/x` })
  })

  it('truncates descriptions on a word boundary', () => {
    const text = 'palabra '.repeat(40)
    const result = truncateDescription(text, 50)
    expect(result.length).toBeLessThanOrEqual(50)
    expect(result.endsWith('…')).toBe(true)
  })
})

function placeFixture(overrides: Partial<PlaceDetail> = {}): PlaceDetail {
  return {
    id: '40000000-0000-4000-8000-000000000001',
    slug: 'casa',
    name: 'Casa',
    placeType: 'restaurant',
    placeTypeName: 'Restaurante',
    placeTypeSlug: 'restaurantes',
    secondaryTypes: [],
    destination: { id: '30000000-0000-4000-8000-000000000001', slug: 'cambrils', name: 'Cambrils' },
    shortDescription: 'Cocina de mar',
    addressLine: 'Passeig 1',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Casa',
    mapsUrlKind: 'search',
    priceLevel: 2,
    averagePrice: 25,
    currency: 'EUR',
    rating: 4.6,
    reviewCount: 120,
    ratingSource: 'google',
    imageUrl: 'https://images.unsplash.com/photo',
    imageCredit: null,
    isFeatured: false,
    isVerified: true,
    isDemo: false,
    isRanked: false,
    latitude: 41.06,
    longitude: 1.06,
    primaryCategory: null,
    featureCodes: [],
    fullDescription: null,
    seoTitle: null,
    seoDescription: null,
    contentLocale: 'es',
    translatedLocales: ['es'],
    indexableLocales: ['es'],
    postalCode: '43850',
    phone: null,
    website: 'https://casa.example',
    instagram: 'casa',
    schemaType: 'Restaurant',
    placeTypeSlugs: { es: 'restaurantes' },
    destinationSlugs: { es: 'cambrils' },
    categories: [],
    features: [],
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('placeSchema', () => {
  const input = { url: `${SITE}/es/cambrils/restaurantes/casa`, countryCode: 'ES' }

  it('emits only real data using the Schema.org type from the database', () => {
    const schema = placeSchema(placeFixture(), input)
    expect(schema).toMatchObject({
      '@type': 'Restaurant',
      name: 'Casa',
      priceRange: '€€',
      address: { '@type': 'PostalAddress', postalCode: '43850', addressCountry: 'ES' },
      geo: { '@type': 'GeoCoordinates', latitude: 41.06 },
      sameAs: ['https://casa.example', 'https://www.instagram.com/casa'],
    })
    expect(schema).not.toHaveProperty('telephone')
  })

  it('never marks up third-party ratings', () => {
    expect(placeSchema(placeFixture(), input)).not.toHaveProperty('aggregateRating')
    expect(
      placeSchema(placeFixture({ ratingSource: FIRST_PARTY_RATING_SOURCE }), input),
    ).toHaveProperty('aggregateRating.ratingValue', 4.6)
  })

  it('returns nothing for demo places', () => {
    expect(placeSchema(placeFixture({ isDemo: true }), input)).toBeNull()
  })

  it('omits business markup for unapproved or incomplete locale versions', () => {
    expect(placeSchema(placeFixture({ indexableLocales: [] }), input)).toBeNull()
    expect(
      placeSchema(placeFixture({ contentLocale: 'en', indexableLocales: ['es'] }), input),
    ).toBeNull()
  })
})

describe('JSON-LD serialization', () => {
  it('escapes "<" so data cannot close the script tag', () => {
    const json = serializeJsonLd(breadcrumbListSchema([{ name: '</script><script>x', url: SITE }]))
    expect(json).not.toContain('</script>')
    expect(JSON.parse(json).itemListElement[0].name).toBe('</script><script>x')
  })
})

describe('sitemap XML', () => {
  it('escapes XML special characters', () => {
    expect(escapeXml(`a&b<c>"'`)).toBe('a&amp;b&lt;c&gt;&quot;&apos;')
  })

  it('renders one <url> per locale with the full hreflang cluster', () => {
    const urls = localizedUrls(
      SITE,
      { es: '/es/cambrils', en: '/en/cambrils' },
      '2026-01-01T00:00:00Z',
    )
    expect(urls).toHaveLength(2)
    const xml = renderUrlSet(urls)
    expect(xml.match(/<url>/g)).toHaveLength(2)
    expect(xml.match(/hreflang="x-default"/g)).toHaveLength(2)
    expect(xml).toContain('<lastmod>2026-01-01T00:00:00.000Z</lastmod>')
  })
})

describe('SEO copy helpers', () => {
  it('appends the brand only when the title still fits', () => {
    expect(composeTitle('Salou: dónde comer')).toBe(`Salou: dónde comer · ${siteConfig.name}`)
    const long = 'Cafeterías en Salou: dónde desayunar y tomar café'
    expect(composeTitle(long)).toBe(long)
    expect(composeTitle('Inicio', false)).toBe('Inicio')
  })

  it('lists names without implying a complete list', () => {
    expect(listNames('es', ['A', 'B'], 2)).toBe('A y B')
    expect(listNames('en', ['A', 'B', 'C'], 3)).toBe('A, B and C')
    expect(listNames('es', ['A', 'B', 'C', 'D'], 9)).toBe('A, B, C…')
    expect(listNames('es', [], 0)).toBe('')
  })

  it('lowercases type names inside sentences except in German', () => {
    expect(inSentence('es', 'Cafetería')).toBe('cafetería')
    expect(inSentence('de', 'Restaurant')).toBe('Restaurant')
    expect(sentences('Uno.', null, '', 'Dos.')).toBe('Uno. Dos.')
  })

  it('sorts destinations by real distance', () => {
    const salou = { latitude: 41.0764, longitude: 1.1416 }
    const others = [
      { name: 'hospitalet', latitude: 40.993, longitude: 0.923 },
      { name: 'cambrils', latitude: 41.0667, longitude: 1.0597 },
      { name: 'tarragona', latitude: 41.1189, longitude: 1.2445 },
    ]
    expect(sortByDistance(salou, others).map((item) => item.name)).toEqual([
      'cambrils',
      'tarragona',
      'hospitalet',
    ])
  })
})

describe('page structured data', () => {
  it('links pages to the guide as publisher, never as owner of the business', () => {
    const business = placeSchema(placeFixture({ mapsUrlKind: 'place_id' }), {
      url: `${SITE}/es/cambrils/restaurantes/casa`,
      countryCode: 'ES',
    })
    // A real map link is exposed; a text search never is.
    expect(business).toHaveProperty('hasMap')
    expect(placeSchema(placeFixture(), { url: SITE, countryCode: 'ES' })).not.toHaveProperty(
      'hasMap',
    )
    const page = webPageSchema({
      url: `${SITE}/es/cambrils/restaurantes/casa`,
      name: 'Casa',
      locale: 'es',
      siteUrl: SITE,
      about: business,
    })
    expect(page).toMatchObject({
      '@type': 'WebPage',
      publisher: { '@id': `${SITE}/#organization` },
      about: { '@type': 'Restaurant', name: 'Casa' },
    })
    expect(page.about).not.toHaveProperty('@context')
    expect(business).not.toHaveProperty('publisher')
    expect(business).not.toHaveProperty('owner')
    expect(organizationSchema({ siteUrl: SITE })).toMatchObject({
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      logo: { url: `${SITE}/logo.png` },
    })
  })

  it('gives every page a share image and large previews when indexable', () => {
    const metadata = buildMetadata(
      {
        locale: 'es',
        title: 'Salou',
        description: 'Descripción',
        path: '/es/salou',
        robots: { index: true, follow: true },
      },
      SITE,
    )
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: `${SITE}/og-default.png`, width: 1200, height: 630 }),
    ])
    expect(metadata.robots).toMatchObject({ index: true, 'max-image-preview': 'large' })
  })
})
