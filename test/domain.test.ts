import { describe, expect, it } from 'vitest'
import { parsePublisher, publisherIsComplete } from '@/config/publisher'
import { landingPageFiltersSchema } from '@/features/landing-pages/filters'
import {
  bayesianRating,
  calculateRankingScore,
  profileCompleteness,
} from '@/features/ranking/ranking'
import { rankCandidates, scoreCandidate } from '@/features/recommendations/scoring'
import {
  directoryQuery,
  hasDirectoryFilters,
  parseDirectoryState,
} from '@/features/directory/state'
import { hasRefinements, parseSearchState, toQuery, totalPages } from '@/features/search/params'
import type { PlaceCard } from '@/lib/db/contracts'
import { parseServerEnv } from '@/lib/env'
import { buildQueryString } from '@/lib/routing/paths'

describe('calculateRankingScore', () => {
  it('returns null when there is no signal at all', () => {
    expect(
      calculateRankingScore({
        rating: null,
        reviewCount: null,
        editorialScore: null,
        completeness: null,
      }),
    ).toBeNull()
  })

  it('stays within 0–100 and is deterministic', () => {
    const signals = { rating: 4.7, reviewCount: 800, editorialScore: 80, completeness: 1 }
    const score = calculateRankingScore(signals)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
    expect(calculateRankingScore(signals)).toBe(score)
  })

  it('does not let few perfect reviews beat many excellent ones', () => {
    const few = calculateRankingScore({
      rating: 5,
      reviewCount: 3,
      editorialScore: null,
      completeness: null,
    })
    const many = calculateRankingScore({
      rating: 4.7,
      reviewCount: 800,
      editorialScore: null,
      completeness: null,
    })
    expect(many).toBeGreaterThan(few ?? 0)
  })

  it('redistributes weight when signals are missing instead of penalising', () => {
    expect(
      calculateRankingScore({
        rating: null,
        reviewCount: null,
        editorialScore: 90,
        completeness: null,
      }),
    ).toBe(90)
  })

  it('computes a Bayesian average and profile completeness', () => {
    expect(bayesianRating(5, 0)).toBe(4)
    expect(
      profileCompleteness({
        shortDescription: 'x',
        fullDescription: null,
        imageUrl: null,
        latitude: null,
        addressLine: null,
        phone: null,
        website: null,
        priceLevel: null,
        categoryCount: 0,
        featureCount: 0,
      }),
    ).toBeCloseTo(1 / 9)
  })
})

describe('search params', () => {
  it('parses shareable filter URLs leniently', () => {
    const state = parseSearchState({
      price: ['2', '9', '1'],
      feature: 'terrace,sea_view,DROP TABLE',
      sort: 'rating',
      page: '3',
      q: '  ',
      destination: 'cambrils',
      category: 'Not A Slug',
    })
    expect(state).toEqual({
      destination: 'cambrils',
      type: null,
      category: null,
      price: [1, 2],
      features: ['sea_view', 'terrace'],
      q: null,
      sort: 'rating',
      page: 3,
    })
  })

  it('keeps commas and spaces inside the free-text query', () => {
    expect(parseSearchState({ q: '  café,   helados ' }).q).toBe('café, helados')
    expect(parseSearchState({ q: 'x'.repeat(81) }).q).toBeNull()
  })

  it('reduces directory URLs to their own filters', () => {
    const state = parseDirectoryState({
      destination: 'miami-platja',
      type: 'tapas_bar',
      q: 'Casa Xavi',
      price: '2',
      page: '2',
    })
    expect(state).toEqual({
      destination: 'miami-platja',
      type: 'tapas_bar',
      q: 'Casa Xavi',
      page: 2,
    })
    expect(hasDirectoryFilters(state)).toBe(true)
    expect(hasDirectoryFilters(parseDirectoryState({ page: '3' }))).toBe(false)
    expect(buildQueryString(directoryQuery({ ...state, page: 1 }))).toBe(
      '?destination=miami-platja&q=Casa+Xavi&type=tapas_bar',
    )
  })

  it('round-trips to a canonical query without defaults', () => {
    const state = parseSearchState({ price: '2', feature: 'terrace' })
    expect(toQuery(state)).toMatchObject({
      price: [2],
      feature: ['terrace'],
      sort: null,
      page: null,
    })
  })

  it('detects refinements relative to the page context', () => {
    expect(hasRefinements(parseSearchState({}))).toBe(false)
    expect(hasRefinements(parseSearchState({ page: '2' }))).toBe(false)
    expect(hasRefinements(parseSearchState({ price: '2' }))).toBe(true)
    expect(hasRefinements(parseSearchState({ type: 'bar' }), ['type'])).toBe(false)
  })

  it('bounds pagination', () => {
    expect(totalPages(0)).toBe(1)
    expect(totalPages(25)).toBe(2)
  })
})

describe('landing page filters', () => {
  it('accepts known criteria and rejects unknown keys', () => {
    expect(landingPageFiltersSchema.parse({ features: ['sea_view'] })).toEqual({
      features: ['sea_view'],
      priceLevels: [],
    })
    expect(() => landingPageFiltersSchema.parse({ feature: ['sea_view'] })).toThrow()
  })
})

function card(overrides: Partial<PlaceCard>): PlaceCard {
  return {
    id: 'id',
    slug: 'slug',
    name: 'Name',
    placeType: 'restaurant',
    placeTypeName: null,
    placeTypeSlug: 'restaurantes',
    secondaryTypes: [],
    destination: { id: 'd', slug: 'cambrils', name: 'Cambrils' },
    shortDescription: null,
    addressLine: null,
    mapsUrl: null,
    mapsUrlKind: null,
    priceLevel: 2,
    averagePrice: null,
    currency: 'EUR',
    rating: null,
    reviewCount: null,
    ratingSource: null,
    imageUrl: null,
    imageCredit: null,
    isFeatured: false,
    isVerified: false,
    isDemo: false,
    isRanked: false,
    latitude: 41.06,
    longitude: 1.06,
    primaryCategory: null,
    featureCodes: [],
    ...overrides,
  }
}

describe('recommendations', () => {
  const criteria = {
    locale: 'es' as const,
    features: ['terrace', 'sea_view'],
    budget: [2] as const,
    location: { latitude: 41.06, longitude: 1.06 },
  }

  it('explains why a place matches', () => {
    const result = scoreCandidate(card({ featureCodes: ['terrace', 'sea_view'] }), criteria)
    expect(result.reasons).toEqual(['feature_match', 'budget_match', 'nearby'])
    expect(result.score).toBeGreaterThan(0.6)
  })

  it('ranks better matches first and honours exclusions and limits', () => {
    const ranked = rankCandidates(
      [
        card({ id: 'a', name: 'A', featureCodes: [] }),
        card({ id: 'b', name: 'B', featureCodes: ['terrace', 'sea_view'] }),
        card({ id: 'c', name: 'C', featureCodes: ['terrace'] }),
      ],
      { ...criteria, excludeIds: ['c'], limit: 5 },
    )
    expect(ranked.map((item) => item.place.id)).toEqual(['b', 'a'])
  })
})

describe('parseServerEnv', () => {
  const publisher = {
    PUBLISHER_LEGAL_NAME: 'Test publisher',
    PUBLISHER_TAX_ID: 'TEST',
    PUBLISHER_ADDRESS: 'Test address',
    PUBLISHER_EMAIL: 'publisher@example.com',
  }
  it('defaults to the embedded database and blocks indexing without Supabase', () => {
    const env = parseServerEnv({ ALLOW_INDEXING: 'true' })
    expect(env.dataSource).toBe('embedded')
    expect(env.allowIndexing).toBe(false)
    expect(env.siteUrl).toBe('http://localhost:3000')
  })

  it('uses Supabase when configured and strips trailing slashes', () => {
    const env = parseServerEnv({
      ...publisher,
      NEXT_PUBLIC_SITE_URL: 'https://example.com/',
      SUPABASE_URL: 'https://abc.supabase.co',
      SUPABASE_ANON_KEY: 'x'.repeat(40),
      ALLOW_INDEXING: 'true',
    })
    expect(env).toMatchObject({
      dataSource: 'supabase',
      allowIndexing: true,
      siteUrl: 'https://example.com',
    })
  })

  it('never indexes previews or non-public origins', () => {
    const supabase = {
      ...publisher,
      SUPABASE_URL: 'https://abc.supabase.co',
      SUPABASE_ANON_KEY: 'x'.repeat(40),
      ALLOW_INDEXING: 'true',
    }
    const indexable = (extra: Record<string, string>) =>
      parseServerEnv({ NEXT_PUBLIC_SITE_URL: 'https://example.com', ...supabase, ...extra })
        .allowIndexing
    expect(indexable({})).toBe(true)
    expect(indexable({ VERCEL_ENV: 'preview' })).toBe(false)
    expect(indexable({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })).toBe(false)
    expect(indexable({ NEXT_PUBLIC_SITE_URL: 'https://my-app-git-main.vercel.app' })).toBe(false)
  })

  it('reads verification tokens and the GA4 id without inventing defaults', () => {
    expect(parseServerEnv({})).toMatchObject({
      verification: { google: null, bing: null },
      gaMeasurementId: null,
    })
    expect(
      parseServerEnv({
        GOOGLE_SITE_VERIFICATION: 'token-from-search-console',
        NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-ABC123',
      }),
    ).toMatchObject({
      verification: { google: 'token-from-search-console' },
      gaMeasurementId: 'G-ABC123',
    })
  })

  it('refuses production deployments without Supabase', () => {
    expect(() => parseServerEnv({ VERCEL_ENV: 'production' })).toThrow(/Supabase/)
  })

  it('keeps indexing blocked while the publisher identity is incomplete', () => {
    expect(
      parseServerEnv({
        NEXT_PUBLIC_SITE_URL: 'https://example.com',
        SUPABASE_URL: 'https://abc.supabase.co',
        SUPABASE_ANON_KEY: 'x'.repeat(40),
        ALLOW_INDEXING: 'true',
      }).allowIndexing,
    ).toBe(false)
    expect(publisherIsComplete(parsePublisher({}))).toBe(false)
    expect(parsePublisher({ PUBLISHER_EMAIL: '   ' }).email).toBeNull()
    expect(() => parsePublisher({ PUBLISHER_EMAIL: 'not-email' })).toThrow()
    expect(() => parsePublisher({ PUBLISHER_SOCIAL_URLS: 'javascript:alert(1)' })).toThrow()
  })
})
