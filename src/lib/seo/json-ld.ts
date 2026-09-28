import type { Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import type { DestinationDetail, PlaceDetail, RegionDetail } from '@/lib/db/contracts'

/**
 * Schema.org builders. Rules:
 * - Only emit properties backed by real data; never fill gaps with guesses.
 * - Fictional (demo) places get no LocalBusiness markup at all.
 * - aggregateRating is emitted only for first-party reviews
 *   (rating_source = 'internal'): Google disallows marking up ratings copied
 *   from third-party sites.
 * - The site is a guide, not the owner of the businesses it lists: business
 *   nodes never carry our organization as owner/publisher; the WebPage that
 *   describes them does (`publisher` + `about`).
 * Nodes are linked by `@id` (organization, website, page, place), so the
 * separate scripts of a page form one graph.
 */

export type JsonLd = Record<string, unknown>

const CONTEXT = 'https://schema.org'
export const FIRST_PARTY_RATING_SOURCE = 'internal'

/** Removes null/undefined/empty values so the output only contains real data. */
function compact<T extends Record<string, unknown>>(object: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0),
    ),
  ) as Partial<T>
}

export const organizationId = (siteUrl: string) => `${siteUrl}/#organization`
export const websiteId = (siteUrl: string, locale: Locale) => `${siteUrl}/${locale}#website`

/** Brand logo (src/app/logo.png/route.tsx). */
export const LOGO_PATH = '/logo.png'

export function organizationSchema(input: { siteUrl: string; email?: string | null }): JsonLd {
  return compact({
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': organizationId(input.siteUrl),
    name: siteConfig.name,
    legalName: siteConfig.publisher.legalName,
    url: input.siteUrl,
    logo: { '@type': 'ImageObject', url: `${input.siteUrl}${LOGO_PATH}`, width: 512, height: 512 },
    email: input.email ?? siteConfig.publisher.email,
    sameAs: [
      ...siteConfig.publisher.socialUrls,
      ...(siteConfig.twitterHandle
        ? [`https://x.com/${siteConfig.twitterHandle.replace(/^@/, '')}`]
        : []),
    ],
  })
}

export function websiteSchema(input: {
  url: string
  name: string
  locale: Locale
  siteUrl: string
}): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': websiteId(input.siteUrl, input.locale),
    url: input.url,
    name: input.name,
    inLanguage: input.locale,
    publisher: { '@id': organizationId(input.siteUrl) },
  }
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export function breadcrumbListSchema(items: readonly BreadcrumbItem[]): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function itemListSchema(input: {
  name: string
  items: readonly { name: string; url: string }[]
}): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'ItemList',
    name: input.name,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url,
      name: item.name,
    })),
  }
}

/** A node embedded in another one does not repeat `@context`. */
function embedded(node: JsonLd | null | undefined): JsonLd | null {
  if (!node) return null
  return Object.fromEntries(Object.entries(node).filter(([key]) => key !== '@context'))
}

/**
 * The page itself (WebPage, CollectionPage, AboutPage…), published by the
 * guide and describing `about` (a destination, a business…).
 */
export function webPageSchema(input: {
  type?: 'WebPage' | 'CollectionPage' | 'AboutPage'
  url: string
  name: string
  description?: string | null
  locale: Locale
  siteUrl: string
  about?: JsonLd | null
  mainEntity?: JsonLd | null
  image?: string | null
  dateModified?: string | null
}): JsonLd {
  return compact({
    '@context': CONTEXT,
    '@type': input.type ?? 'WebPage',
    '@id': `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: input.description,
    inLanguage: input.locale,
    isPartOf: { '@id': websiteId(input.siteUrl, input.locale) },
    publisher: { '@id': organizationId(input.siteUrl) },
    about: embedded(input.about),
    mainEntity: embedded(input.mainEntity),
    primaryImageOfPage: input.image ? { '@type': 'ImageObject', url: input.image } : null,
    dateModified: input.dateModified,
  })
}

export function touristDestinationSchema(destination: DestinationDetail, url: string): JsonLd {
  return compact({
    '@context': CONTEXT,
    '@type': 'TouristDestination',
    '@id': `${url}#destination`,
    name: destination.name,
    url,
    description: destination.description,
    image: destination.imageUrl,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
    containedInPlace: destination.regionName
      ? { '@type': 'AdministrativeArea', name: destination.regionName }
      : null,
  })
}

/** Regional hub (e.g. Costa Daurada) containing its destinations. */
export function regionSchema(
  region: RegionDetail,
  input: { url: string; destinationUrl: (slug: string) => string },
): JsonLd {
  return compact({
    '@context': CONTEXT,
    '@type': 'TouristDestination',
    '@id': `${input.url}#destination`,
    name: region.name,
    url: input.url,
    description: region.description,
    containedInPlace: region.parentName
      ? { '@type': 'AdministrativeArea', name: region.parentName }
      : region.countryName
        ? { '@type': 'Country', name: region.countryName }
        : null,
    containsPlace: region.destinations.map((destination) => ({
      '@type': 'City',
      name: destination.name,
      url: input.destinationUrl(destination.slug),
    })),
  })
}

export function priceRange(level: number | null): string | null {
  return level ? '€'.repeat(level) : null
}

export function placeSchema(
  place: PlaceDetail,
  input: { url: string; countryCode: string },
): JsonLd | null {
  if (place.isDemo || !place.contentLocale || !place.indexableLocales.includes(place.contentLocale))
    return null

  const sameAs = [
    place.website,
    place.instagram ? `https://www.instagram.com/${place.instagram}` : null,
  ].filter((value): value is string => Boolean(value))

  const address =
    place.addressLine || place.postalCode
      ? compact({
          '@type': 'PostalAddress',
          streetAddress: place.addressLine,
          postalCode: place.postalCode,
          addressLocality: place.destination.name,
          addressCountry: input.countryCode,
        })
      : null

  const aggregateRating =
    place.ratingSource === FIRST_PARTY_RATING_SOURCE && place.rating !== null && place.reviewCount
      ? {
          '@type': 'AggregateRating',
          ratingValue: place.rating,
          reviewCount: place.reviewCount,
          bestRating: 5,
          worstRating: 0,
        }
      : null

  return compact({
    '@context': CONTEXT,
    '@type': place.schemaType,
    '@id': `${input.url}#place`,
    name: place.name,
    url: input.url,
    description: place.shortDescription,
    image: place.imageUrl,
    telephone: place.phone,
    priceRange: priceRange(place.priceLevel),
    address,
    // A text search is not a map of this business: only real map links.
    hasMap: place.mapsUrl && place.mapsUrlKind !== 'search' ? place.mapsUrl : null,
    geo:
      place.latitude !== null && place.longitude !== null
        ? { '@type': 'GeoCoordinates', latitude: place.latitude, longitude: place.longitude }
        : null,
    containedInPlace: { '@type': 'City', name: place.destination.name },
    sameAs,
    aggregateRating,
  })
}

/** JSON for a <script> tag: escapes "<" so content can never close the tag. */
export function serializeJsonLd(data: JsonLd | readonly JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
