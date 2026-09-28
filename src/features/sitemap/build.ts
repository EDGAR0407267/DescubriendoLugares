import 'server-only'
import { z } from 'zod'
import { locales } from '@/config/i18n'
import { MIN_PLACES_FOR_INDEXABLE_COLLECTION } from '@/config/seo'
import type { StaticPage } from '@/config/routes'
import { listSitemapRegions } from '@/features/regions/queries'
import { searchPlaces } from '@/features/places/queries'
import { rpc } from '@/lib/db/client'
import { sitemapDestinationEntriesSchema, sitemapDestinationSchema } from '@/lib/db/contracts'
import { pathsForAllLocales } from '@/lib/routing/language-links'
import {
  destinationPath,
  destinationSectionPath,
  homePath,
  placePath,
  regionPath,
  staticPagePath,
} from '@/lib/routing/paths'
import type { LocalizedPaths } from '@/lib/seo/metadata'
import { resolveIndexing } from '@/lib/seo/indexing'
import { localizedUrls, type SitemapUrl } from '@/lib/seo/sitemap-xml'

/**
 * Sitemap layout (scales to hundreds of destinations):
 *   /sitemap.xml                         → sitemap index
 *   /sitemaps/core.xml                   → home, editorial pages, directory,
 *                                          regional hubs and destinations
 *   /sitemaps/destination-{slug}.xml     → listings, categories, landings, places
 * Only indexable URLs are listed (see src/lib/seo/indexing.ts).
 */
export const CORE_SITEMAP = 'core'
const DESTINATION_PREFIX = 'destination-'

const INDEXABLE_STATIC_PAGES: StaticPage[] = ['about', 'editorial', 'directory']

export function listSitemapDestinations() {
  return rpc('api_sitemap_destinations', {}, z.array(sitemapDestinationSchema))
}

export function sitemapIdForDestination(slug: string): string {
  return `${DESTINATION_PREFIX}${slug}`
}

function mapLocales(build: (locale: (typeof locales)[number]) => string | null): LocalizedPaths {
  const paths: LocalizedPaths = {}
  for (const locale of locales) {
    const path = build(locale)
    if (path) paths[locale] = path
  }
  return paths
}

export async function buildCoreSitemap(siteUrl: string): Promise<SitemapUrl[]> {
  const [destinations, regions, places] = await Promise.all([
    listSitemapDestinations(),
    listSitemapRegions(),
    searchPlaces('es', { limit: 1 }),
  ])
  return [
    ...localizedUrls(siteUrl, pathsForAllLocales(homePath)),
    ...INDEXABLE_STATIC_PAGES.filter(
      (page) =>
        page !== 'directory' ||
        resolveIndexing({
          kind: 'collection',
          siteIndexable: true,
          placeCount: places.total,
        }).index,
    ).flatMap((page) =>
      localizedUrls(
        siteUrl,
        pathsForAllLocales((locale) => staticPagePath(locale, page)),
      ),
    ),
    ...regions.flatMap((region) =>
      localizedUrls(
        siteUrl,
        mapLocales((locale) =>
          region.locales.includes(locale) ? regionPath(locale, region.slug) : null,
        ),
        region.updatedAt,
      ),
    ),
    ...destinations.flatMap((destination) =>
      localizedUrls(
        siteUrl,
        mapLocales((locale) => {
          const slug = destination.slugs[locale]
          return slug ? destinationPath(locale, slug) : null
        }),
        destination.updatedAt,
      ),
    ),
  ]
}

/** Returns null when the id does not match an active destination. */
export async function buildDestinationSitemap(
  siteUrl: string,
  sitemapId: string,
): Promise<SitemapUrl[] | null> {
  if (!sitemapId.startsWith(DESTINATION_PREFIX)) return null
  const slug = sitemapId.slice(DESTINATION_PREFIX.length)
  const destination = (await listSitemapDestinations()).find((item) => item.slug === slug)
  if (!destination) return null

  const entries = await rpc(
    'api_sitemap_destination_entries',
    {
      p_destination_id: destination.id,
      p_min_category_places: MIN_PLACES_FOR_INDEXABLE_COLLECTION,
    },
    sitemapDestinationEntriesSchema,
  )

  const section = (slugs: LocalizedPaths) =>
    mapLocales((locale) => {
      const destinationSlug = destination.slugs[locale]
      const sectionSlug = slugs[locale]
      return destinationSlug && sectionSlug
        ? destinationSectionPath(locale, destinationSlug, sectionSlug)
        : null
    })

  return [
    ...entries.placeTypes.flatMap((item) => localizedUrls(siteUrl, section(item.slugs))),
    ...entries.categories.flatMap((item) => localizedUrls(siteUrl, section(item.slugs))),
    ...entries.landingPages.flatMap((item) =>
      localizedUrls(siteUrl, section(item.slugs), item.updatedAt),
    ),
    ...entries.places.flatMap((place) =>
      localizedUrls(
        siteUrl,
        mapLocales((locale) => {
          const destinationSlug = destination.slugs[locale]
          const typeSlug = place.typeSlugs[locale]
          return destinationSlug && typeSlug && place.locales.includes(locale)
            ? placePath(locale, destinationSlug, typeSlug, place.slug)
            : null
        }),
        place.updatedAt,
      ),
    ),
  ]
}
