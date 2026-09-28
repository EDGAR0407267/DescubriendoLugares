import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { getServerEnv } from '@/lib/env'

/**
 * Crawling is allowed only when ALLOW_INDEXING=true, the site reads real data
 * and the request comes to the canonical host (never a *.vercel.app alias).
 * Filtered/search URLs are NOT disallowed here: crawlers must be able to
 * fetch them to see their `noindex` directive. CSS, JS and images stay
 * crawlable so pages render for search engines.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const env = getServerEnv()
  const host = (await headers()).get('host')
  const onCanonicalHost = !host || host === new URL(env.siteUrl).host
  if (!env.allowIndexing || !onCanonicalHost) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  }
}
