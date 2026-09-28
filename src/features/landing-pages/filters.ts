import { z } from 'zod'
import { priceLevelSchema } from '@/lib/db/contracts'
import { sortOptions, type PlaceQuery } from '@/features/places/types'
import type { LandingPage } from '@/lib/db/contracts'

/**
 * Validates `landing_pages.filters` (jsonb). Editors can only express these
 * criteria; unknown keys are rejected so typos surface immediately.
 */
export const landingPageFiltersSchema = z
  .object({
    features: z
      .array(z.string().regex(/^[a-z][a-z0-9_]*$/))
      .max(12)
      .default([]),
    priceLevels: z.array(priceLevelSchema).max(4).default([]),
  })
  .strict()

export type LandingPageFilters = z.infer<typeof landingPageFiltersSchema>

/** Translates a landing page definition into a place search query. */
export function landingPageToQuery(landing: LandingPage): PlaceQuery {
  const filters = landingPageFiltersSchema.parse(landing.filters)
  const sort = z.enum(sortOptions).catch('ranking').parse(landing.sort)
  return {
    destinationId: landing.destinationId,
    placeType: landing.placeType,
    categoryId: landing.categoryId,
    features: filters.features,
    priceLevels: filters.priceLevels,
    sort,
    limit: landing.maxItems,
    pinnedIds: landing.pinnedPlaceIds,
  }
}
