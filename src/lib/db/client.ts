import 'server-only'
import type { z } from 'zod'
import { getServerEnv } from '@/lib/env'
import { createEmbeddedRpcClient, getSharedEmbeddedDatabase } from './embedded'
import { DatabaseError, type RpcArgs, type RpcClient, type RpcFunction } from './rpc'
import { createSupabaseRpcClient } from './supabase'

let client: RpcClient | undefined

function getRpcClient(): RpcClient {
  if (!client) {
    const env = getServerEnv()
    client =
      env.dataSource === 'supabase' && env.supabase
        ? createSupabaseRpcClient(env.supabase.url, env.supabase.anonKey)
        : createEmbeddedRpcClient(getSharedEmbeddedDatabase)
  }
  return client
}

/** Calls a read-API function and validates the response against its contract. */
export async function rpc<F extends RpcFunction, S extends z.ZodType>(
  fn: F,
  args: RpcArgs[F],
  schema: S,
): Promise<z.output<S>> {
  const data = await getRpcClient().call(fn, args)
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new DatabaseError(fn, `unexpected response shape: ${parsed.error.message}`)
  }
  return parsed.data
}
