import { NextResponse, type NextRequest } from 'next/server'
import { LOCALE_COOKIE } from '@/config/i18n'
import { negotiateLocale } from '@/lib/i18n/negotiate'
import { resolveLocalizedPathname } from '@/lib/routing/localized-pathname'

/** Host of the canonical origin (NEXT_PUBLIC_SITE_URL), or null if unset/invalid. */
function canonicalHost(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').host || null
  } catch {
    return null
  }
}

/**
 * Pages served from any host other than the canonical one (the
 * *.vercel.app alias of a production deployment, a raw IP…) are marked
 * noindex, so only the canonical domain can ever be indexed.
 */
function guardHost(request: NextRequest, response: NextResponse): NextResponse {
  const expected = canonicalHost()
  const host = request.headers.get('host')
  if (expected && host && host !== expected) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}

/**
 * Locale prefixing, lowercase URLs and localized fixed segments. Stateless on
 * purpose: it never sets cookies, so responses stay cacheable at the CDN.
 * The language preference cookie is written only by /api/locale.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const resolution = resolveLocalizedPathname(pathname, () =>
    negotiateLocale(
      request.headers.get('accept-language'),
      request.cookies.get(LOCALE_COOKIE)?.value,
    ),
  )

  if (resolution.type === 'next') return guardHost(request, NextResponse.next())

  const url = request.nextUrl.clone()
  url.pathname = resolution.pathname

  if (resolution.type === 'rewrite') return guardHost(request, NextResponse.rewrite(url))

  return NextResponse.redirect(url, resolution.permanent ? 308 : 307)
}

export const config = {
  // Skip API routes, Next internals and any path with a file extension
  // (robots.txt, sitemap.xml, images, favicon…).
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
