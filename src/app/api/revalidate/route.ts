import { timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { CONTENT_CACHE_TAG } from '@/lib/db/supabase'
import { getServerEnv } from '@/lib/env'

function isAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get('authorization') ?? ''
  const provided = Buffer.from(header.replace(/^Bearer\s+/i, ''))
  const expected = Buffer.from(secret)
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

/**
 * Invalidates cached public content after editing data in Supabase (manually,
 * from a database webhook or, later, from the admin panel).
 *
 *   curl -X POST https://example.com/api/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET"
 */
export async function POST(request: Request) {
  const { revalidateSecret } = getServerEnv()
  if (!revalidateSecret) {
    return Response.json({ error: 'Revalidation is not configured' }, { status: 501 })
  }
  if (!isAuthorized(request, revalidateSecret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  revalidateTag(CONTENT_CACHE_TAG, 'max')
  return Response.json({ revalidated: true, tag: CONTENT_CACHE_TAG })
}
