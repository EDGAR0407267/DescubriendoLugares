import 'server-only'
import { cache } from 'react'
import type { Locale } from '@/config/i18n'
import { getRegion } from '@/features/regions/queries'
import { listPlaceTypes } from '@/features/taxonomy/queries'
import type { DestinationCard, DestinationDetail } from '@/lib/db/contracts'
import { sortByDistance } from './distance'

/** Links to other destinations are capped so pages stay focused at any scale. */
export const NEARBY_DESTINATIONS = 4

/**
 * Other destinations of the same hub (or of the whole site when there is no
 * hub), closest first. Only destinations with published places.
 */
export const getNearbyDestinations = cache(
  async (
    locale: Locale,
    destination: DestinationDetail,
    limit = NEARBY_DESTINATIONS,
  ): Promise<DestinationCard[]> => {
    const region = destination.hub ? await getRegion(locale, destination.hub.slug) : null
    const candidates = (region?.destinations ?? []).filter(
      (item) => item.id !== destination.id && item.placeCount > 0,
    )
    return sortByDistance(destination, candidates).slice(0, limit)
  },
)

export interface TypeInDestination {
  destination: DestinationCard
  slug: string
  pluralName: string
  count: number
}

/** The same place type in nearby destinations (e.g. "Restaurantes en Cambrils"). */
export async function getTypeInNearbyDestinations(
  locale: Locale,
  destination: DestinationDetail,
  typeCode: string,
): Promise<TypeInDestination[]> {
  const nearby = await getNearbyDestinations(locale, destination)
  const perDestination = await Promise.all(
    nearby.map(async (item) => {
      const type = (await listPlaceTypes(locale, item.id)).find(
        (candidate) => candidate.code === typeCode && candidate.hasListingPage,
      )
      return type
        ? {
            destination: item,
            slug: type.slug,
            pluralName: type.pluralName,
            count: type.placeCount,
          }
        : null
    }),
  )
  return perDestination.filter((item): item is TypeInDestination => item !== null)
}
