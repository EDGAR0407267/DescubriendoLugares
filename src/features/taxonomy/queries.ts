import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { defaultLocale, type Locale } from '@/config/i18n'
import { rpc } from '@/lib/db/client'
import {
  categoryDetailSchema,
  categorySummarySchema,
  featureSchema,
  placeTypeSchema,
} from '@/lib/db/contracts'

/** With a destination, only types that have places there. */
export const listPlaceTypes = cache((locale: Locale, destinationId: string | null = null) =>
  rpc(
    'api_list_place_types',
    { p_locale: locale, p_fallback: defaultLocale, p_destination_id: destinationId },
    z.array(placeTypeSchema),
  ),
)

export const listFeatures = cache((locale: Locale) =>
  rpc('api_list_features', { p_locale: locale, p_fallback: defaultLocale }, z.array(featureSchema)),
)

/** With a destination, only categories that have places there. */
export const listCategories = cache((locale: Locale, destinationId: string | null = null) =>
  rpc(
    'api_list_categories',
    { p_locale: locale, p_fallback: defaultLocale, p_destination_id: destinationId },
    z.array(categorySummarySchema),
  ),
)

export const getCategory = cache(
  (locale: Locale, categoryId: string, destinationId: string | null = null) =>
    rpc(
      'api_get_category',
      {
        p_locale: locale,
        p_fallback: defaultLocale,
        p_category_id: categoryId,
        p_destination_id: destinationId,
      },
      categoryDetailSchema.nullable(),
    ),
)
