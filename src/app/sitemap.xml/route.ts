import {
  CORE_SITEMAP,
  listSitemapDestinations,
  sitemapIdForDestination,
} from '@/features/sitemap/build'
import { getServerEnv } from '@/lib/env'
import { resolveIndexing } from '@/lib/seo/indexing'
import { renderSitemapIndex, xmlResponse } from '@/lib/seo/sitemap-xml'

export const revalidate = 3600

export async function GET() {
  const { siteUrl, allowIndexing } = getServerEnv()
  if (!resolveIndexing({ kind: 'home', siteIndexable: allowIndexing }).index) {
    return xmlResponse(renderSitemapIndex([]))
  }
  const destinations = await listSitemapDestinations()
  const sitemaps = [
    { loc: `${siteUrl}/sitemaps/${CORE_SITEMAP}.xml` },
    ...destinations.map((destination) => ({
      loc: `${siteUrl}/sitemaps/${sitemapIdForDestination(destination.slug)}.xml`,
      lastmod: destination.updatedAt,
    })),
  ]
  return xmlResponse(renderSitemapIndex(sitemaps))
}
