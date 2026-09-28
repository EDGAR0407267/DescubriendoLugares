import 'server-only'
import { cache } from 'react'
import { locales, type Locale } from '@/config/i18n'
import { getSeoContent, placeTypeCopy } from '@/content/seo'
import { getDestination } from '@/features/destinations/queries'
import { landingPageToQuery } from '@/features/landing-pages/filters'
import { getLandingPage, resolveDestinationSegment } from '@/features/landing-pages/queries'
import type { PlaceQuery } from '@/features/places/types'
import { PAGE_SIZE } from '@/features/search/params'
import { getCategory, listPlaceTypes } from '@/features/taxonomy/queries'
import type { DestinationDetail } from '@/lib/db/contracts'
import { format } from '@/lib/i18n/format'
import type { Dictionary } from '@/lib/i18n/types'
import { destinationSectionPath } from '@/lib/routing/paths'
import type { LocalizedPaths } from '@/lib/seo/metadata'

/**
 * A "collection" is any page at /{locale}/{destination}/{segment} that lists
 * places: a place-type listing (/restaurantes), an editorial landing page
 * (/mejores-restaurantes) or a category page (/arroces). All three share one
 * route and one view; this module normalizes them.
 */
export type CollectionKind = 'place_type' | 'landing_page' | 'category'

export interface Collection {
  kind: CollectionKind
  destination: DestinationDetail
  title: string
  metaTitle: string
  /**
   * May contain a `{names}` placeholder, filled by the page with the first
   * places listed (see collectionDescription).
   */
  metaDescription: string
  intro: string | null
  body: string | null
  /** Path of this collection in the current locale (no query). */
  path: string
  /** Equivalent collection paths in the locales where it exists. */
  alternates: LocalizedPaths
  /** Criteria before user refinements and pagination. */
  query: Omit<PlaceQuery, 'limit' | 'offset'>
  /** Landing pages are curated: fixed size, no user filters or pagination. */
  curated: boolean
  limit: number
  /** landing_pages.is_indexable (always true for generated collections). */
  editorialIndexable: boolean
  contentTranslated: boolean
  /** Place type of a type listing (for related links). */
  placeTypeCode: string | null
  /** Landing pages: last editorial update. */
  updatedAt: string | null
}

export type CollectionLookup =
  | { status: 'found'; collection: Collection }
  | { status: 'redirect'; path: string }
  | { status: 'not_found' }

function collectionAlternates(
  destination: DestinationDetail,
  segmentSlugs: Partial<Record<Locale, string>>,
): LocalizedPaths {
  const paths: LocalizedPaths = {}
  for (const locale of locales) {
    const destinationSlug = destination.indexableSlugs[locale]
    const segmentSlug = segmentSlugs[locale]
    if (destinationSlug && segmentSlug) {
      paths[locale] = destinationSectionPath(locale, destinationSlug, segmentSlug)
    }
  }
  return paths
}

async function loadPlaceType(
  locale: Locale,
  dict: Dictionary,
  destination: DestinationDetail,
  code: string,
): Promise<CollectionLookup> {
  // Only types with places in this destination: an empty listing is a 404,
  // never a soft-404 page.
  const placeType = (await listPlaceTypes(locale, destination.id)).find(
    (type) => type.code === code && type.hasListingPage,
  )
  if (!placeType) return { status: 'not_found' }
  const copy = placeTypeCopy(await getSeoContent(locale), placeType.code)
  const values = { type: placeType.pluralName, destination: destination.name }
  return {
    status: 'found',
    collection: {
      kind: 'place_type',
      destination,
      title: format(dict.listing.placeTypeTitle, values),
      metaTitle: format(copy.metaTitle, values),
      metaDescription: format(copy.description, values),
      intro: format(copy.intro, values),
      body: null,
      path: destinationSectionPath(locale, destination.slug, placeType.slug),
      alternates: collectionAlternates(destination, placeType.slugs),
      query: { destinationId: destination.id, placeType: placeType.code },
      curated: false,
      limit: PAGE_SIZE,
      editorialIndexable: true,
      contentTranslated: Boolean(destination.indexableSlugs[locale] && placeType.slugs[locale]),
      placeTypeCode: placeType.code,
      updatedAt: null,
    },
  }
}

async function loadCategory(
  locale: Locale,
  dict: Dictionary,
  destination: DestinationDetail,
  categoryId: string,
): Promise<CollectionLookup> {
  const category = await getCategory(locale, categoryId, destination.id)
  if (!category || category.placeCount === 0) return { status: 'not_found' }
  const title = format(dict.listing.categoryTitle, {
    category: category.name,
    destination: destination.name,
  })
  return {
    status: 'found',
    collection: {
      kind: 'category',
      destination,
      title,
      metaTitle: category.seoTitle ?? title,
      metaDescription:
        category.seoDescription ??
        format(dict.listing.categoryDescription, {
          category: category.name,
          destination: destination.name,
        }),
      intro: category.description,
      body: null,
      path: destinationSectionPath(locale, destination.slug, category.slug),
      alternates: collectionAlternates(destination, category.indexableSlugs),
      query: { destinationId: destination.id, categoryId: category.id },
      curated: false,
      limit: PAGE_SIZE,
      editorialIndexable: true,
      contentTranslated: Boolean(
        destination.indexableSlugs[locale] && category.indexableSlugs[locale],
      ),
      placeTypeCode: null,
      updatedAt: category.updatedAt,
    },
  }
}

async function loadLandingPage(
  locale: Locale,
  destination: DestinationDetail,
  landingPageId: string,
): Promise<CollectionLookup> {
  const landing = await getLandingPage(locale, landingPageId)
  if (!landing || landing.destinationId !== destination.id) return { status: 'not_found' }
  const { limit, ...query } = landingPageToQuery(landing)
  return {
    status: 'found',
    collection: {
      kind: 'landing_page',
      destination,
      title: landing.title,
      metaTitle: landing.seoTitle ?? landing.title,
      metaDescription: landing.seoDescription ?? landing.intro ?? landing.title,
      intro: landing.intro,
      body: landing.body,
      path: destinationSectionPath(locale, destination.slug, landing.slug),
      alternates: collectionAlternates(destination, landing.indexableSlugs),
      query,
      curated: true,
      limit,
      editorialIndexable: landing.isIndexable,
      contentTranslated: Boolean(
        destination.indexableSlugs[locale] && landing.indexableSlugs[locale],
      ),
      placeTypeCode: landing.placeType,
      updatedAt: landing.updatedAt,
    },
  }
}

/** Current-locale path for a segment that matched in another locale. */
async function localizedRedirect(
  locale: Locale,
  dict: Dictionary,
  destination: DestinationDetail,
  kind: CollectionKind,
  key: string,
): Promise<CollectionLookup> {
  const found =
    kind === 'place_type'
      ? await loadPlaceType(locale, dict, destination, key)
      : kind === 'category'
        ? await loadCategory(locale, dict, destination, key)
        : await loadLandingPage(locale, destination, key)
  return found.status === 'found' ? { status: 'redirect', path: found.collection.path } : found
}

export const loadCollection = cache(
  async (
    locale: Locale,
    dict: Dictionary,
    destinationSlug: string,
    segment: string,
  ): Promise<CollectionLookup> => {
    const destination = await getDestination(locale, destinationSlug)
    if (!destination) return { status: 'not_found' }

    const match = await resolveDestinationSegment(locale, destination.id, segment)
    if (!match) return { status: 'not_found' }

    if (!match.canonical || match.locale !== locale || !destination.requestedSlugMatches) {
      return localizedRedirect(locale, dict, destination, match.kind, match.key)
    }

    switch (match.kind) {
      case 'place_type':
        return loadPlaceType(locale, dict, destination, match.key)
      case 'category':
        return loadCategory(locale, dict, destination, match.key)
      case 'landing_page':
        return loadLandingPage(locale, destination, match.key)
    }
  },
)

/** Meta description with the first place names of the (first) results page. */
export function collectionDescription(collection: Collection, names: string): string {
  // "…:." (no names) → "…."; "Ester…." (truncated list) → "Ester…".
  return format(collection.metaDescription, { names })
    .replace(/:\s*\./, '.')
    .replace(/…\./g, '…')
}
