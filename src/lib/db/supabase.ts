import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { DatabaseError, definedArgs, type RpcClient } from './rpc'

/** Cache tag for all public content; see src/app/api/revalidate/route.ts. */
export const CONTENT_CACHE_TAG = 'content'
const CONTENT_REVALIDATE_SECONDS = 3600

/**
 * Server-side Supabase access with the anon key (RLS applies). No auth
 * session is used in this phase, so a plain client is enough; a cookie-aware
 * @supabase/ssr client will only be needed once users can sign in.
 *
 * Results are stored in the Next.js data cache and invalidated by tag when
 * content changes, so pages do not hit Postgres on every request.
 */
export function createSupabaseRpcClient(url: string, anonKey: string): RpcClient {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const cachedCall = unstable_cache(
    async (fn: string, serializedArgs: string) => {
      const { data, error } = await client.rpc(fn, JSON.parse(serializedArgs) as object)
      if (error) throw new DatabaseError(fn, error.message)
      return data as unknown
    },
    ['supabase-rpc'],
    { revalidate: CONTENT_REVALIDATE_SECONDS, tags: [CONTENT_CACHE_TAG] },
  )

  return {
    call(fn, args) {
      return cachedCall(fn, JSON.stringify(Object.fromEntries(definedArgs(args))))
    },
  }
}
