import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { defaultLocale, type Locale } from '@/config/i18n'
import { rpc } from '@/lib/db/client'
import { placeCardSchema, placeDetailSchema, placeSearchResultSchema } from '@/lib/db/contracts'
import type { PlaceQuery } from './types'

// Keyed by the serialized query so that equal criteria built separately
// (generateMetadata + page) share one request-scoped result.
const searchPlacesCached = cache((locale: Locale, serializedQuery: string) => {
  const query = JSON.parse(serializedQuery) as PlaceQuery
  return rpc(
    'api_search_places',
    {
      p_locale: locale,
      p_fallback: defaultLocale,
      p_destination_id: query.destinationId ?? null,
      p_place_type: query.placeType ?? null,
      p_category_id: query.categoryId ?? null,
      p_features: query.features?.length ? [...query.features] : null,
      p_price_levels: query.priceLevels?.length ? [...query.priceLevels] : null,
      p_query: query.text ?? null,
      p_sort: query.sort ?? 'ranking',
      p_limit: query.limit,
      p_offset: query.offset ?? 0,
      p_pinned_ids: query.pinnedIds?.length ? [...query.pinnedIds] : null,
      p_exclude_ids: query.excludeIds?.length ? [...query.excludeIds] : null,
      p_featured_only: query.featuredOnly ?? false,
    },
    placeSearchResultSchema,
  )
})

export function searchPlaces(locale: Locale, query: PlaceQuery) {
  return searchPlacesCached(locale, JSON.stringify(query))
}

export const getPlace = cache((locale: Locale, destinationId: string, slug: string) =>
  rpc(
    'api_get_place',
    { p_locale: locale, p_fallback: defaultLocale, p_destination_id: destinationId, p_slug: slug },
    placeDetailSchema.nullable(),
  ),
)

export const getNearbyPlaces = cache((locale: Locale, placeId: string, radiusKm = 3, limit = 4) =>
  rpc(
    'api_nearby_places',
    {
      p_locale: locale,
      p_fallback: defaultLocale,
      p_place_id: placeId,
      p_radius_km: radiusKm,
      p_limit: limit,
    },
    z.array(placeCardSchema),
  ),
)
