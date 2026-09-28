import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  categorySummarySchema,
  destinationCardSchema,
  destinationDetailSchema,
  landingPageSchema,
  placeCardSchema,
  placeDetailSchema,
  placeSearchResultSchema,
  placeTypeSchema,
  regionDetailSchema,
  segmentResolutionSchema,
  sitemapDestinationEntriesSchema,
  sitemapDestinationSchema,
  sitemapRegionSchema,
} from '@/lib/db/contracts'
import { createEmbeddedDatabase, createEmbeddedRpcClient } from '@/lib/db/embedded'
import type { RpcArgs, RpcClient, RpcFunction } from '@/lib/db/rpc'

/**
 * Integration test of the real schema: applies every migration plus the seed
 * to an in-process Postgres and checks the read API against the TypeScript
 * contracts the app relies on.
 */
let db: PGlite
let client: RpcClient

const CAMBRILS = '30000000-0000-4000-8000-000000000001'
const ARROCERIA = '40000000-0000-4000-8000-000000000001'

async function call<F extends RpcFunction, S extends z.ZodType>(
  fn: F,
  args: RpcArgs[F],
  schema: S,
) {
  return schema.parse(await client.call(fn, args)) as z.output<S>
}

beforeAll(async () => {
  db = await createEmbeddedDatabase()
  client = createEmbeddedRpcClient(async () => db)
})

describe('production visibility and editorial eligibility', () => {
  async function asPublic(role: 'anon' | 'authenticated', work: () => Promise<void>) {
    await db.exec(`set role ${role}`)
    try {
      await work()
    } finally {
      await db.exec('reset role')
    }
  }

  for (const role of ['anon', 'authenticated'] as const) {
    it(`${role} excludes demo, drafts, relations and import provenance even with preview enabled`, async () => {
      await db.exec('begin')
      try {
        await db.query("update places set status = 'draft' where slug = 'deliranto'")
        await asPublic(role, async () => {
          const result = await call(
            'api_search_places',
            { p_locale: 'es', p_fallback: 'es', p_limit: 100 },
            placeSearchResultSchema,
          )
          expect(result.total).toBe(59)
          expect(result.items.every((p) => !p.isDemo && p.slug !== 'deliranto')).toBe(true)
          expect(
            await call(
              'api_get_place',
              {
                p_locale: 'es',
                p_fallback: 'es',
                p_destination_id: CAMBRILS,
                p_slug: 'demo-arroceria-del-puerto',
              },
              placeDetailSchema.nullable(),
            ),
          ).toBeNull()
          expect(
            await client.call('api_nearby_places', {
              p_locale: 'es',
              p_fallback: 'es',
              p_place_id: ARROCERIA,
            }),
          ).toEqual([])
          expect(
            await client.call('api_list_landing_pages', {
              p_locale: 'es',
              p_destination_id: CAMBRILS,
            }),
          ).toEqual([])
          expect(
            await client.call('api_resolve_destination_segment', {
              p_locale: 'es',
              p_destination_id: CAMBRILS,
              p_segment: 'restaurantes-romanticos',
            }),
          ).toBeNull()
          for (const table of [
            'place_categories',
            'place_features',
            'place_translations',
            'place_secondary_types',
          ]) {
            const { rows } = await db.query(`select * from ${table} where place_id = $1`, [
              ARROCERIA,
            ])
            expect(rows).toEqual([])
          }
          for (const sql of [
            'select * from place_import_records',
            "select apply_place_import('test', '[]')",
            'update places set is_demo = false',
          ]) {
            await db.exec('savepoint denial')
            await expect(db.query(sql)).rejects.toThrow(/permission denied/)
            await db.exec('rollback to savepoint denial')
          }
          const { rows } = await db.query<{ n: number }>('select count(*)::integer n from places')
          expect(rows[0].n).toBe(59)
        })
      } finally {
        await db.exec('rollback')
      }
    })
  }

  it('bootstraps reference data and imports without the demo seed', async () => {
    const fresh = await createEmbeddedDatabase({ demo: false, imports: false })
    try {
      expect((await fresh.query('select * from destinations')).rows).toHaveLength(5)
      expect((await fresh.query('select * from places')).rows).toEqual([])
      expect((await fresh.query('select * from landing_pages')).rows).toEqual([])
      expect((await fresh.query('select api_sitemap_destinations() as result')).rows[0]).toEqual({
        result: [],
      })
      const { readSqlFiles } = await import('@/lib/db/embedded')
      const sql = await readSqlFiles({ demo: false, imports: true })
      // Only import SQL is needed after migrations; no reference/demo data is replayed.
      await fresh.exec(sql.at(-1)!)
      expect((await fresh.query('select * from places where not is_demo')).rows).toHaveLength(60)
      const freshClient = createEmbeddedRpcClient(async () => fresh)
      expect(
        placeSearchResultSchema.parse(
          await freshClient.call('api_search_places', { p_locale: 'es', p_fallback: 'es' }),
        ).total,
      ).toBe(60)
    } finally {
      await fresh.close()
    }
  })

  it('shares per-locale approval between detail, hreflang candidates and sitemap', async () => {
    await db.exec('begin')
    try {
      const { rows } = await db.query<{ id: string; slug: string }>(
        'select id, slug from places where destination_id = $1 and not is_demo limit 1',
        [CAMBRILS],
      )
      const place = rows[0]
      const detail = () =>
        call(
          'api_get_place',
          { p_locale: 'es', p_fallback: 'es', p_destination_id: CAMBRILS, p_slug: place.slug },
          placeDetailSchema.nullable(),
        )
      await db.query("update place_translations set full_description = '   ' where place_id = $1", [
        place.id,
      ])
      expect((await detail())?.indexableLocales).toEqual([])
      await db.query(
        "update places set is_verified = true, address_line = 'Test address', featured_image_url = 'https://example.com/test.jpg', featured_image_credit = 'Test licence' where id = $1",
        [place.id],
      )
      await db.query(
        "update place_translations set short_description = $2, full_description = $3 where place_id = $1 and locale = 'es'",
        [
          place.id,
          'Test editorial description. '.repeat(3),
          'Test editorial body for integration verification. '.repeat(5),
        ],
      )
      await asPublic('anon', async () => {
      expect((await detail())?.indexableLocales).toEqual(['es'])
        const sitemap = await call(
          'api_sitemap_destination_entries',
          { p_destination_id: CAMBRILS },
          sitemapDestinationEntriesSchema,
        )
        expect(sitemap.places).toEqual([
          expect.objectContaining({ slug: place.slug, locales: ['es'] }),
        ])
      })
      await db.query("update place_translations set full_description = $2 where place_id = $1 and locale = 'es'", [place.id, '\n\t'.repeat(100)])
      expect((await detail())?.indexableLocales).toEqual([])
      await db.query('update places set is_verified = false where id = $1', [place.id])
      expect((await detail())?.indexableLocales).toEqual([])
      await db.query(
        'update places set is_verified = true, address_line = null, latitude = null, longitude = null where id = $1',
        [place.id],
      )
      expect((await detail())?.indexableLocales).toEqual([])
    } finally {
      await db.exec('rollback')
    }
  })

  it('keeps demo-only destinations and insufficient landings out of the sitemap', async () => {
    await db.exec('begin')
    try {
      await db.query('update places set is_demo = true where destination_id = $1', [CAMBRILS])
      const destinations = await call(
        'api_sitemap_destinations',
        {},
        z.array(sitemapDestinationSchema),
      )
      expect(destinations.some((d) => d.id === CAMBRILS)).toBe(false)
      const landing = await call(
        'api_get_landing_page',
        { p_locale: 'es', p_landing_page_id: '60000000-0000-4000-8000-000000000002' },
        landingPageSchema.nullable(),
      )
      expect(landing?.isIndexable).toBe(false)
      expect(landing?.indexableSlugs).toEqual({})
    } finally {
      await db.exec('rollback')
    }
  })

  it('approves only complete real landing translations with enough matching results', async () => {
    await db.exec('begin')
    const id = '60000000-0000-4000-8000-000000000002'
    try {
      await db.query(
        "update landing_pages set is_demo = false, category_id = null, filters = '{}' where id = $1",
        [id],
      )
      await db.query(
        "update landing_page_translations set intro = $2, body = $3 where landing_page_id = $1 and locale = 'es'",
        [
          id,
          'Test intro for editorial eligibility. '.repeat(3),
          'Test body for editorial eligibility. '.repeat(6),
        ],
      )
      await asPublic('anon', async () => {
        const landing = await call(
          'api_get_landing_page',
          { p_locale: 'es', p_landing_page_id: id },
          landingPageSchema.nullable(),
        )
        expect(landing?.isIndexable).toBe(true)
        expect(landing?.indexableSlugs).toEqual({ es: 'restaurantes-romanticos' })
        const sitemap = await call(
          'api_sitemap_destination_entries',
          { p_destination_id: CAMBRILS },
          sitemapDestinationEntriesSchema,
        )
        expect(sitemap.landingPages).toEqual([
          expect.objectContaining({ slugs: { es: 'restaurantes-romanticos' } }),
        ])
      })
      await db.query(
        'update landing_pages set filters = \'{"features": ["sea_view"]}\' where id = $1',
        [id],
      )
      // Demo results match this feature in preview, but never count towards SEO.
      expect(
        (
          await call(
            'api_get_landing_page',
            { p_locale: 'es', p_landing_page_id: id },
            landingPageSchema.nullable(),
          )
        )?.isIndexable,
      ).toBe(false)
    } finally {
      await db.exec('rollback')
    }
  })
})

afterAll(async () => {
  await db?.close()
})

describe('schema and seed', () => {
  it('enables row level security on every public table', async () => {
    const { rows } = await db.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    )
    expect(rows).toEqual([])
  })

  it('marks fictional places as demo and never stores invented ratings', async () => {
    const { rows } = await db.query<{ is_demo: boolean; rating: string | null; name: string }>(
      'select is_demo, rating, name from places',
    )
    const demo = rows.filter((row) => row.is_demo)
    expect(demo).toHaveLength(5)
    expect(demo.every((row) => row.name.startsWith('Demo '))).toBe(true)
    // Real places come only from supabase/imports (see test/places-import.test.ts).
    expect(rows.filter((row) => !row.is_demo && row.name.startsWith('Demo '))).toEqual([])
    expect(rows.every((row) => row.rating === null)).toBe(true)
  })

  it('enforces slug format and scoped uniqueness', async () => {
    await expect(
      db.query(
        `update destination_translations set slug = 'Not Valid' where locale = 'es' and slug = 'salou'`,
      ),
    ).rejects.toThrow()
    await expect(
      db.query(
        `update destination_translations set slug = 'cambrils' where locale = 'es' and slug = 'salou'`,
      ),
    ).rejects.toThrow()
  })

  it('requires ratings to be attributable to a source', async () => {
    await expect(
      db.query(`update places set rating = 4.5 where id = '${ARROCERIA}'`),
    ).rejects.toThrow()
  })
})

describe('read API', () => {
  it('lists destinations with localized slugs', async () => {
    const destinations = await call(
      'api_list_destinations',
      { p_locale: 'es', p_fallback: 'es' },
      z.array(destinationCardSchema),
    )
    expect(destinations.map((destination) => destination.slug)).toEqual([
      'cambrils',
      'salou',
      'tarragona',
      'miami-platja',
      'hospitalet-de-l-infant',
    ])
  })

  it('resolves retired destination slugs (aliases) and flags the canonical one', async () => {
    const get = (slug: string) =>
      call(
        'api_get_destination',
        { p_locale: 'es', p_fallback: 'es', p_slug: slug },
        destinationDetailSchema.nullable(),
      )
    expect(await get('miami-playa')).toMatchObject({
      slug: 'miami-platja',
      requestedSlugMatches: false,
    })
    expect(await get('miami-platja')).toMatchObject({ requestedSlugMatches: true })
    expect((await get('salou'))?.hub).toEqual({ slug: 'costa-daurada', name: 'Costa Dorada' })
    expect(await get('costa-daurada')).toBeNull()
  })

  it('serves regional hubs with their destinations', async () => {
    const region = await call(
      'api_get_region',
      { p_locale: 'ca', p_fallback: 'es', p_slug: 'costa-daurada' },
      regionDetailSchema.nullable(),
    )
    expect(region).toMatchObject({ name: 'Costa Daurada', contentLocale: 'ca', countryCode: 'ES' })
    expect(region?.description).toContain('Costa Daurada')
    expect(region?.translatedLocales).toEqual(['ca', 'de', 'en', 'es', 'fr', 'it'])
    expect(region?.destinations.map((destination) => destination.slug)).toHaveLength(5)
    // Only regions flagged as hubs have a page.
    expect(
      await call(
        'api_get_region',
        { p_locale: 'es', p_fallback: 'es', p_slug: 'catalonia' },
        regionDetailSchema.nullable(),
      ),
    ).toBeNull()
    expect(
      (await call('api_sitemap_regions', {}, z.array(sitemapRegionSchema))).map((r) => r.slug),
    ).toEqual(['costa-daurada'])
  })

  it('resolves retired place slugs and exposes the type slug of every locale', async () => {
    await db.query(
      `insert into slug_aliases (kind, scope_id, slug, target_key) values ('place', $1, 'old-arroceria', $2)`,
      [CAMBRILS, ARROCERIA],
    )
    const place = await call(
      'api_get_place',
      { p_locale: 'es', p_fallback: 'es', p_destination_id: CAMBRILS, p_slug: 'old-arroceria' },
      placeDetailSchema.nullable(),
    )
    expect(place).toMatchObject({
      slug: 'demo-arroceria-del-puerto',
      placeTypeSlug: 'restaurantes',
    })
    expect(place?.placeTypeSlugs).toMatchObject({ es: 'restaurantes', it: 'ristoranti' })
  })

  it('resolves destination segments by precedence', async () => {
    const resolve = (segment: string, locale = 'es') =>
      call(
        'api_resolve_destination_segment',
        { p_locale: locale, p_destination_id: CAMBRILS, p_segment: segment },
        segmentResolutionSchema.nullable(),
      )
    expect(await resolve('restaurantes')).toMatchObject({ kind: 'place_type', key: 'restaurant' })
    expect(await resolve('bares-de-tapas')).toMatchObject({ kind: 'place_type', key: 'tapas_bar' })
    expect(await resolve('restaurantes-romanticos')).toMatchObject({ kind: 'landing_page' })
    expect(await resolve('arroces')).toMatchObject({ kind: 'category' })
    expect(await resolve('romantic-restaurants', 'es')).toMatchObject({
      kind: 'landing_page',
      locale: 'en',
    })
    // Retired slugs resolve to their current entity, flagged as non-canonical.
    expect(await resolve('para-beber-algo')).toMatchObject({
      kind: 'place_type',
      key: 'drinks',
      canonical: false,
    })
    expect(await resolve('bares')).toMatchObject({ key: 'drinks', canonical: true })
    // Unpublished landing pages do not resolve (see seed.sql, section 5).
    expect(await resolve('mejores-restaurantes')).toBeNull()
    expect(await resolve('does-not-exist')).toBeNull()
  })

  it('filters places by features (AND) and price, organically ordered', async () => {
    const result = await call(
      'api_search_places',
      {
        p_locale: 'en',
        p_fallback: 'es',
        p_destination_id: CAMBRILS,
        p_features: ['terrace', 'sea_view'],
        p_price_levels: [3],
      },
      placeSearchResultSchema,
    )
    expect(result.total).toBe(1)
    expect(result.items[0]).toMatchObject({
      id: ARROCERIA,
      shortDescription: expect.stringContaining('Demo'),
    })
  })

  it('searches names accent-insensitively and treats wildcards literally', async () => {
    const byName = (query: string) =>
      call(
        'api_search_places',
        { p_locale: 'es', p_fallback: 'es', p_query: query },
        placeSearchResultSchema,
      )
    expect((await byName('arroceria')).total).toBe(1)
    expect((await byName('%')).total).toBe(0)
  })

  it('paginates with a stable total', async () => {
    const page = await call(
      'api_search_places',
      { p_locale: 'es', p_fallback: 'es', p_limit: 2, p_offset: 2 },
      placeSearchResultSchema,
    )
    expect(page.total).toBe(65)
    expect(page.items).toHaveLength(2)
  })

  it('falls back to the default locale for untranslated place content', async () => {
    const place = await call(
      'api_get_place',
      {
        p_locale: 'de',
        p_fallback: 'es',
        p_destination_id: CAMBRILS,
        p_slug: 'demo-arroceria-del-puerto',
      },
      placeDetailSchema.nullable(),
    )
    expect(place).toMatchObject({ contentLocale: 'es', schemaType: 'Restaurant' })
    expect(place?.translatedLocales).toEqual(['ca', 'en', 'es'])
    expect(place?.features.find((feature) => feature.code === 'sea_view')?.name).toBe('Meerblick')
  })

  it('returns nearby places with distances', async () => {
    const nearby = await call(
      'api_nearby_places',
      { p_locale: 'es', p_fallback: 'es', p_place_id: ARROCERIA, p_radius_km: 3 },
      z.array(placeCardSchema),
    )
    expect(nearby.length).toBeGreaterThan(0)
    expect(nearby.every((place) => (place.distanceKm ?? Infinity) <= 3)).toBe(true)
    expect(nearby.some((place) => place.id === ARROCERIA)).toBe(false)
  })

  it('exposes landing pages only in the locales they were written in', async () => {
    const romanticId = '60000000-0000-4000-8000-000000000002'
    const args = (locale: string) => ({ p_locale: locale, p_landing_page_id: romanticId })
    expect(
      await call('api_get_landing_page', args('es'), landingPageSchema.nullable()),
    ).toMatchObject({
      slug: 'restaurantes-romanticos',
    })
    expect(await call('api_get_landing_page', args('fr'), landingPageSchema.nullable())).toBeNull()
  })

  it('counts taxonomy per destination', async () => {
    const types = await call(
      'api_list_place_types',
      { p_locale: 'es', p_fallback: 'es', p_destination_id: CAMBRILS },
      z.array(placeTypeSchema),
    )
    expect(types.map((type) => [type.code, type.placeCount])).toEqual([
      // Counts include secondary types (La Vilateria is also a café, etc.).
      ['restaurant', 7],
      ['cafe', 4],
      ['tapas_bar', 2],
      ['drinks', 5],
      ['beach_club', 1],
    ])
    const categories = await call(
      'api_list_categories',
      { p_locale: 'ca', p_fallback: 'es', p_destination_id: CAMBRILS },
      z.array(categorySummarySchema),
    )
    expect(categories.every((category) => category.placeCount > 0)).toBe(true)
  })

  it('keeps demo and thin place pages out of sitemaps', async () => {
    const entries = await call(
      'api_sitemap_destination_entries',
      { p_destination_id: CAMBRILS },
      sitemapDestinationEntriesSchema,
    )
    // Imported places have no full description yet: served as noindex, not listed.
    expect(entries.places).toEqual([])
    expect(entries.landingPages).toEqual([])
    // Only place-type listings above the thin-collection threshold (3).
    expect(entries.placeTypes.map((type) => type.slugs.es)).toEqual([
      'restaurantes',
      'cafeterias',
      'bares',
    ])
  })
})
