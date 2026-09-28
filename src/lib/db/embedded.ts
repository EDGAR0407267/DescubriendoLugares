import 'server-only'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { PGlite } from '@electric-sql/pglite'
import { DatabaseError, definedArgs, type RpcClient } from './rpc'

/**
 * Embedded Postgres (PGlite, WASM) loaded with the exact same migrations,
 * data imports as Supabase, plus optional development fixtures. Used for zero-setup development, CI builds and tests, so
 * there is a single implementation of every query: the SQL read API.
 * Production always uses Supabase (enforced in src/lib/env.ts).
 */

const SUPABASE_DIR = path.join(process.cwd(), 'supabase')
const IDENTIFIER = /^[a-z][a-z0-9_]*$/

// Supabase provides these roles; RLS policies and grants reference them.
const BOOTSTRAP_SQL = `
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end
$$;`

async function sqlFilesIn(dir: string): Promise<string[]> {
  const files = await readdir(dir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  return files
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => path.join(dir, file))
}

/**
 * Migrations, then the seed, then the generated data imports
 * (supabase/imports, see docs/IMPORTS.md), which only need the migrated references.
 */
export async function readSqlFiles({ demo = true, imports = true } = {}): Promise<string[]> {
  const files = [
    ...(await sqlFilesIn(path.join(SUPABASE_DIR, 'migrations'))),
    ...(demo ? [path.join(SUPABASE_DIR, 'seed.sql')] : []),
    ...(imports ? await sqlFilesIn(path.join(SUPABASE_DIR, 'imports')) : []),
  ]
  return Promise.all(files.map((file) => readFile(file, 'utf8')))
}

export async function createEmbeddedDatabase(
  options = { demo: true, imports: true },
): Promise<PGlite> {
  const [{ PGlite }, { pg_trgm }, { unaccent }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('@electric-sql/pglite/contrib/pg_trgm'),
    import('@electric-sql/pglite/contrib/unaccent'),
  ])
  const db = new PGlite({ extensions: { pg_trgm, unaccent } })
  await db.exec(BOOTSTRAP_SQL)
  for (const sql of await readSqlFiles(options)) {
    await db.exec(sql)
  }
  // Trusted owner connection only. RLS and SQL never allow this for anon/authenticated.
  if (options.demo) await db.exec("set app.demo_preview = 'on'")
  return db
}

export function createEmbeddedRpcClient(getDatabase: () => Promise<PGlite>): RpcClient {
  return {
    async call(fn, args) {
      const entries = definedArgs(args)
      for (const name of [fn, ...entries.map(([key]) => key)]) {
        if (!IDENTIFIER.test(name)) throw new DatabaseError(fn, `invalid identifier "${name}"`)
      }
      const placeholders = entries.map(([key], index) => `${key} => $${index + 1}`).join(', ')
      const db = await getDatabase()
      try {
        const { rows } = await db.query<{ result: unknown }>(
          `select public.${fn}(${placeholders}) as result`,
          entries.map(([, value]) => value),
        )
        return rows[0]?.result ?? null
      } catch (error) {
        throw new DatabaseError(fn, error instanceof Error ? error.message : String(error))
      }
    },
  }
}

let shared: Promise<PGlite> | undefined

/** One database per server process, created lazily on first query. */
export function getSharedEmbeddedDatabase(): Promise<PGlite> {
  shared ??= createEmbeddedDatabase().catch((error: unknown) => {
    shared = undefined
    throw error
  })
  return shared
}
