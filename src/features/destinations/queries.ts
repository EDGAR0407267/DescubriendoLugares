import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { defaultLocale, type Locale } from '@/config/i18n'
import { rpc } from '@/lib/db/client'
import { destinationCardSchema, destinationDetailSchema } from '@/lib/db/contracts'

// React `cache` dedupes identical calls within one request (e.g. the same
// lookup in generateMetadata and in the page component).

export const listDestinations = cache((locale: Locale, featuredOnly = false) =>
  rpc(
    'api_list_destinations',
    { p_locale: locale, p_fallback: defaultLocale, p_featured_only: featuredOnly },
    z.array(destinationCardSchema),
  ),
)

export const getDestination = cache((locale: Locale, slug: string) =>
  rpc(
    'api_get_destination',
    { p_locale: locale, p_fallback: defaultLocale, p_slug: slug },
    destinationDetailSchema.nullable(),
  ),
)
