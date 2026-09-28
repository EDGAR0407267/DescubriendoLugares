import { buildLanguageAlternates, type LocalizedPaths } from './metadata'

export interface SitemapUrl {
  loc: string
  lastmod?: string
  /** hreflang → absolute URL (including x-default). */
  alternates?: Record<string, string>
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toW3cDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

export function renderUrlSet(urls: readonly SitemapUrl[]): string {
  const body = urls
    .map((url) => {
      const parts = [`<loc>${escapeXml(url.loc)}</loc>`]
      if (url.lastmod) parts.push(`<lastmod>${toW3cDate(url.lastmod)}</lastmod>`)
      for (const [hreflang, href] of Object.entries(url.alternates ?? {})) {
        parts.push(
          `<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`,
        )
      }
      return `<url>${parts.join('')}</url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`
}

export function renderSitemapIndex(sitemaps: readonly { loc: string; lastmod?: string }[]): string {
  const body = sitemaps
    .map(
      (sitemap) =>
        `<sitemap><loc>${escapeXml(sitemap.loc)}</loc>${
          sitemap.lastmod ? `<lastmod>${toW3cDate(sitemap.lastmod)}</lastmod>` : ''
        }</sitemap>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`
}

/**
 * One <url> per locale version, each carrying the full hreflang cluster, as
 * required by Google for localized sitemaps.
 */
export function localizedUrls(
  siteUrl: string,
  paths: LocalizedPaths,
  lastmod?: string,
): SitemapUrl[] {
  const alternates = buildLanguageAlternates(siteUrl, paths)
  return Object.values(paths).map((path) => ({ loc: `${siteUrl}${path}`, lastmod, alternates }))
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
