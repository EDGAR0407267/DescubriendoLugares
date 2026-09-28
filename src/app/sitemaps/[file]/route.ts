import { buildCoreSitemap, buildDestinationSitemap, CORE_SITEMAP } from '@/features/sitemap/build'
import { getServerEnv } from '@/lib/env'
import { resolveIndexing } from '@/lib/seo/indexing'
import { renderUrlSet, xmlResponse } from '@/lib/seo/sitemap-xml'

export const revalidate = 3600

export async function GET(_request: Request, { params }: RouteContext<'/sitemaps/[file]'>) {
  const { file } = await params
  const match = /^([a-z0-9-]+)\.xml$/.exec(file)
  if (!match) return new Response('Not found', { status: 404 })

  const { siteUrl, allowIndexing } = getServerEnv()
  const id = match[1]
  const urls =
    id === CORE_SITEMAP
      ? await buildCoreSitemap(siteUrl)
      : await buildDestinationSitemap(siteUrl, id)
  if (!urls) return new Response('Not found', { status: 404 })
  return xmlResponse(
    renderUrlSet(resolveIndexing({ kind: 'home', siteIndexable: allowIndexing }).index ? urls : []),
  )
}
