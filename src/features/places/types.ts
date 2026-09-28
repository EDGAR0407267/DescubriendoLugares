import type { PriceLevel } from '@/lib/db/contracts'

export const sortOptions = ['ranking', 'rating', 'price_asc', 'price_desc', 'name'] as const

export type SortOption = (typeof sortOptions)[number]

/** Criteria understood by the place search API (api_search_places). */
export interface PlaceQuery {
  destinationId?: string | null
  placeType?: string | null
  categoryId?: string | null
  features?: readonly string[]
  priceLevels?: readonly PriceLevel[]
  text?: string | null
  sort?: SortOption
  limit: number
  offset?: number
  /** Editorially pinned places, returned first in the given order. */
  pinnedIds?: readonly string[]
  excludeIds?: readonly string[]
  /** Editorial highlight (`places.is_featured`); never a paid placement. */
  featuredOnly?: boolean
}
