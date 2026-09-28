import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { defaultLocale, type Locale } from '@/config/i18n'
import { rpc } from '@/lib/db/client'
import { regionDetailSchema, sitemapRegionSchema } from '@/lib/db/contracts'

/** Regional hub by slug (only regions flagged `is_hub`), with its destinations. */
export const getRegion = cache((locale: Locale, slug: string) =>
  rpc(
    'api_get_region',
    { p_locale: locale, p_fallback: defaultLocale, p_slug: slug },
    regionDetailSchema.nullable(),
  ),
)

export const listSitemapRegions = cache(() =>
  rpc('api_sitemap_regions', {}, z.array(sitemapRegionSchema)),
)
