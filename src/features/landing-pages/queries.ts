import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import type { Locale } from '@/config/i18n'
import { rpc } from '@/lib/db/client'
import {
  landingPageSchema,
  landingPageSummarySchema,
  segmentResolutionSchema,
} from '@/lib/db/contracts'

/**
 * Resolves /{locale}/{destination}/{segment}. Precedence: place-type listing
 * → landing page → category page (see api_resolve_destination_segment).
 */
export const resolveDestinationSegment = cache(
  (locale: Locale, destinationId: string, segment: string) =>
    rpc(
      'api_resolve_destination_segment',
      { p_locale: locale, p_destination_id: destinationId, p_segment: segment },
      segmentResolutionSchema.nullable(),
    ),
)

/** Landing pages exist only in locales where they were written (no fallback). */
export const getLandingPage = cache((locale: Locale, landingPageId: string) =>
  rpc(
    'api_get_landing_page',
    { p_locale: locale, p_landing_page_id: landingPageId },
    landingPageSchema.nullable(),
  ),
)

export const listLandingPages = cache((locale: Locale, destinationId: string) =>
  rpc(
    'api_list_landing_pages',
    { p_locale: locale, p_destination_id: destinationId },
    z.array(landingPageSummarySchema),
  ),
)
