import { z } from 'zod'
import { isLocale, type Locale } from '@/config/i18n'

/**
 * Runtime contracts for the SQL read API (supabase/migrations/*_read_api.sql).
 * Every RPC response is parsed here, so a schema drift fails loudly at the
 * boundary instead of rendering broken pages.
 */

const id = z.guid()
const timestamp = z.string().min(1)

/**
 * { locale: slug } maps; unknown locales (not enabled in the app) are dropped.
 * `jsonb_object_agg` over zero rows yields null, hence `nullable`.
 */
const localeMap = z
  .record(z.string(), z.string())
  .nullable()
  .transform((map) => {
    const result: Partial<Record<Locale, string>> = {}
    for (const [key, value] of Object.entries(map ?? {})) {
      if (isLocale(key)) result[key] = value
    }
    return result
  })

const localeList = z
  .array(z.string())
  .transform((values) => values.filter((value): value is Locale => isLocale(value)))

const contentLocale = z.string().transform((value) => (isLocale(value) ? value : null))

export const priceLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])

const linkRef = z.object({ id, slug: z.string(), name: z.string() })

/**
 * What a place's Google Maps link points to (places.maps_url_kind). Only
 * `search` is a free-text search rather than a specific listing or point.
 */
export const mapsUrlKinds = ['search', 'place_id', 'coordinates', 'place', 'short_link'] as const

export const placeCardSchema = z.object({
  id,
  slug: z.string(),
  name: z.string(),
  placeType: z.string(),
  placeTypeName: z.string().nullable(),
  /** URL segment of the primary type listing in the requested locale. */
  placeTypeSlug: z.string(),
  /** Other types the place also belongs to (e.g. a café that serves brunch). */
  secondaryTypes: z.array(z.object({ code: z.string(), name: z.string() })),
  destination: linkRef,
  shortDescription: z.string().nullable(),
  addressLine: z.string().nullable(),
  mapsUrl: z.url({ protocol: /^https$/ }).nullable(),
  mapsUrlKind: z.enum(mapsUrlKinds).nullable(),
  priceLevel: priceLevelSchema.nullable(),
  averagePrice: z.number().nullable(),
  currency: z.string().length(3),
  rating: z.number().nullable(),
  reviewCount: z.number().int().nullable(),
  ratingSource: z.string().nullable(),
  imageUrl: z.string().nullable(),
  imageCredit: z.string().nullable(),
  isFeatured: z.boolean(),
  isVerified: z.boolean(),
  isDemo: z.boolean(),
  /** Has an organic ranking score; unranked lists must not claim an order. */
  isRanked: z.boolean(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  primaryCategory: linkRef.nullable(),
  featureCodes: z.array(z.string()),
  distanceKm: z.number().optional(),
})

export const placeDetailSchema = placeCardSchema.extend({
  /** Editorially approved locale versions, shared by metadata and sitemap. */
  indexableLocales: localeList,
  fullDescription: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  contentLocale: contentLocale.nullable(),
  translatedLocales: localeList,
  postalCode: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  instagram: z.string().nullable(),
  schemaType: z.string(),
  /** Primary type listing segment per locale (place URLs live under it). */
  placeTypeSlugs: localeMap,
  destinationSlugs: localeMap,
  categories: z.array(linkRef.extend({ isPrimary: z.boolean() })),
  features: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      groupCode: z.string(),
      icon: z.string().nullable(),
    }),
  ),
  updatedAt: timestamp,
})

export const placeSearchResultSchema = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(placeCardSchema),
})

export const destinationCardSchema = z.object({
  id,
  slug: z.string(),
  name: z.string(),
  countryCode: z.string(),
  countryName: z.string().nullable(),
  regionName: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  imageUrl: z.string().nullable(),
  imageCredit: z.string().nullable(),
  isFeatured: z.boolean(),
  placeCount: z.number().int(),
})

export const destinationDetailSchema = destinationCardSchema.extend({
  indexableSlugs: localeMap,
  description: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  contentLocale: contentLocale,
  slugs: localeMap,
  requestedSlugMatches: z.boolean(),
  /** Closest regional hub (regions.is_hub), e.g. Costa Daurada. */
  hub: z.object({ slug: z.string(), name: z.string() }).nullable(),
  updatedAt: timestamp,
})

export const regionDetailSchema = z.object({
  id,
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  contentLocale,
  /** Locales with editorial text (the hub is indexable only in those). */
  translatedLocales: localeList,
  parentName: z.string().nullable(),
  countryCode: z.string(),
  countryName: z.string().nullable(),
  destinations: z.array(destinationCardSchema),
  updatedAt: timestamp,
})

export const sitemapRegionSchema = z.object({
  slug: z.string(),
  locales: localeList,
  updatedAt: timestamp,
})

export const placeTypeSchema = z.object({
  code: z.string(),
  schemaType: z.string(),
  hasListingPage: z.boolean(),
  name: z.string(),
  pluralName: z.string(),
  slug: z.string(),
  slugs: localeMap,
  placeCount: z.number().int(),
})

export const featureSchema = z.object({
  code: z.string(),
  groupCode: z.string(),
  icon: z.string().nullable(),
  isFilterable: z.boolean(),
  name: z.string(),
})

export const categorySummarySchema = z.object({
  id,
  slug: z.string(),
  name: z.string(),
  groupCode: z.string(),
  icon: z.string().nullable(),
  isFeatured: z.boolean(),
  placeCount: z.number().int(),
})

export const categoryDetailSchema = z.object({
  indexableSlugs: localeMap,
  id,
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  groupCode: z.string(),
  contentLocale: contentLocale,
  slugs: localeMap,
  placeCount: z.number().int(),
  updatedAt: timestamp,
})

export const segmentResolutionSchema = z.object({
  kind: z.enum(['place_type', 'landing_page', 'category']),
  key: z.string(),
  locale: z.string(),
  /** False for a retired slug (slug_aliases): the app redirects to the current one. */
  canonical: z.boolean(),
})

export const landingPageSummarySchema = z.object({
  id,
  key: z.string(),
  slug: z.string(),
  title: z.string(),
  intro: z.string().nullable(),
})

export const landingPageSchema = landingPageSummarySchema.extend({
  indexableSlugs: localeMap,
  destinationId: id,
  placeType: z.string().nullable(),
  categoryId: id.nullable(),
  filters: z.record(z.string(), z.unknown()),
  sort: z.string(),
  maxItems: z.number().int(),
  isIndexable: z.boolean(),
  pinnedPlaceIds: z.array(id),
  body: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  slugs: localeMap,
  updatedAt: timestamp,
})

export const sitemapDestinationSchema = z.object({
  id,
  slug: z.string(),
  slugs: localeMap,
  updatedAt: timestamp,
})

export const sitemapDestinationEntriesSchema = z.object({
  places: z.array(
    z.object({
      slug: z.string(),
      typeSlugs: localeMap,
      locales: localeList,
      updatedAt: timestamp,
    }),
  ),
  landingPages: z.array(z.object({ slugs: localeMap, updatedAt: timestamp })),
  categories: z.array(z.object({ slugs: localeMap })),
  placeTypes: z.array(z.object({ slugs: localeMap })),
})

export type PlaceCard = z.infer<typeof placeCardSchema>
export type PlaceDetail = z.infer<typeof placeDetailSchema>
export type PlaceSearchResult = z.infer<typeof placeSearchResultSchema>
export type DestinationCard = z.infer<typeof destinationCardSchema>
export type DestinationDetail = z.infer<typeof destinationDetailSchema>
export type RegionDetail = z.infer<typeof regionDetailSchema>
export type PlaceType = z.infer<typeof placeTypeSchema>
export type Feature = z.infer<typeof featureSchema>
export type CategorySummary = z.infer<typeof categorySummarySchema>
export type CategoryDetail = z.infer<typeof categoryDetailSchema>
export type SegmentResolution = z.infer<typeof segmentResolutionSchema>
export type LandingPageSummary = z.infer<typeof landingPageSummarySchema>
export type LandingPage = z.infer<typeof landingPageSchema>
export type PriceLevel = z.infer<typeof priceLevelSchema>
export type MapsUrlKind = (typeof mapsUrlKinds)[number]
