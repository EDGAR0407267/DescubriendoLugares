import 'server-only'
import { z } from 'zod'
import { parsePublisher, publisherIsComplete } from '@/config/publisher'

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    z
      .url()
      .default('http://localhost:3000')
      .transform((url) => url.replace(/\/+$/, '')),
  ),
  ALLOW_INDEXING: z.preprocess(emptyToUndefined, z.enum(['true', 'false']).default('false')),
  DATA_SOURCE: z.preprocess(emptyToUndefined, z.enum(['supabase', 'embedded']).optional()),
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  SUPABASE_ANON_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  REVALIDATE_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
  VERCEL_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['production', 'preview', 'development']).optional(),
  ),
  /** Search Console HTML-tag verification token (content of the meta tag only). */
  GOOGLE_SITE_VERIFICATION: z.preprocess(emptyToUndefined, z.string().min(10).optional()),
  BING_SITE_VERIFICATION: z.preprocess(emptyToUndefined, z.string().min(10).optional()),
  /** GA4 measurement id (G-XXXXXXX). Unset = no analytics script at all. */
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^G-[A-Z0-9]+$/)
      .optional(),
  ),
})

export type DataSource = 'supabase' | 'embedded'

export interface ServerEnv {
  siteUrl: string
  allowIndexing: boolean
  dataSource: DataSource
  supabase: { url: string; anonKey: string } | null
  revalidateSecret: string | null
  verification: { google: string | null; bing: string | null }
  gaMeasurementId: string | null
}

/**
 * Origins that must never be declared canonical: a production site indexed
 * with these would publish localhost or preview URLs in canonicals/sitemaps.
 */
export function isNonPublicOrigin(siteUrl: string): boolean {
  const { hostname } = new URL(siteUrl)
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.vercel.app')
  )
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const env = envSchema.parse(source)
  const supabase =
    env.SUPABASE_URL && env.SUPABASE_ANON_KEY
      ? { url: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY }
      : null
  const dataSource: DataSource = env.DATA_SOURCE ?? (supabase ? 'supabase' : 'embedded')

  if (dataSource === 'supabase' && !supabase) {
    throw new Error('DATA_SOURCE=supabase requires SUPABASE_URL and SUPABASE_ANON_KEY.')
  }
  if (env.VERCEL_ENV === 'production' && dataSource !== 'supabase') {
    throw new Error('Production deployments must read from Supabase (set SUPABASE_URL/ANON_KEY).')
  }

  return {
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    // Demo/embedded data, preview deployments and non-public origins are never
    // indexed, whatever the flag says.
    allowIndexing:
      env.ALLOW_INDEXING === 'true' &&
      dataSource === 'supabase' &&
      publisherIsComplete(parsePublisher(source)) &&
      env.VERCEL_ENV !== 'preview' &&
      env.VERCEL_ENV !== 'development' &&
      !isNonPublicOrigin(env.NEXT_PUBLIC_SITE_URL),
    dataSource,
    supabase,
    revalidateSecret: env.REVALIDATE_SECRET ?? null,
    verification: {
      google: env.GOOGLE_SITE_VERIFICATION ?? null,
      bing: env.BING_SITE_VERIFICATION ?? null,
    },
    gaMeasurementId: env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? null,
  }
}

let cached: ServerEnv | undefined

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env)
  return cached
}
