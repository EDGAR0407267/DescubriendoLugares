#!/usr/bin/env node
/** Audits the committed production snapshot; never connects to a remote DB. */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { unaccent } from '@electric-sql/pglite/contrib/unaccent'

const db = new PGlite({ extensions: { pg_trgm, unaccent } })
try {
  await db.exec('create role anon nologin; create role authenticated nologin;')
  for (const dir of ['supabase/migrations', 'supabase/imports']) {
    for (const file of (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort()) {
      await db.exec(await readFile(`${dir}/${file}`, 'utf8'))
    }
  }
  const { rows } = await db.query(await readFile('docs/queries/content-quality.sql', 'utf8'))
  const { rows: invalidAliases } = await db.query(`select a.* from slug_aliases a where not (
    (kind = 'destination' and exists (select 1 from destinations d where d.id::text = target_key))
    or (kind = 'place_type' and exists (select 1 from place_types pt where pt.code = target_key))
    or (kind = 'category' and exists (select 1 from categories c where c.id::text = target_key))
    or (kind = 'place' and exists (select 1 from places p where p.id::text = target_key and p.destination_id = scope_id))
    or (kind = 'landing_page' and exists (select 1 from landing_pages l where l.id::text = target_key and l.destination_id = scope_id))
  )`)
  if (invalidAliases.length) throw new Error(`Broken aliases: ${JSON.stringify(invalidAliases)}`)
  const { rows: collisions } = await db.query(`select a.slug from slug_aliases a where
    (a.kind = 'destination' and exists (select 1 from destination_translations t where t.slug = a.slug and t.destination_id::text <> a.target_key))
    or (a.kind = 'place_type' and exists (select 1 from place_type_translations t where t.slug = a.slug and t.place_type_code <> a.target_key))
    or (a.kind = 'place' and exists (select 1 from places p where p.slug = a.slug and p.destination_id = a.scope_id and p.id::text <> a.target_key))`)
  if (collisions.length) throw new Error(`Alias collisions: ${JSON.stringify(collisions)}`)

  await db.exec('set role anon')
  const { rows: publicResult } = await db.query(
    "select api_search_places('es', 'es', p_limit => 100) as result",
  )
  if (publicResult[0].result.items.some((p) => p.isDemo)) throw new Error('Public demo data')
  const { rows: destinations } = await db.query('select api_sitemap_destinations() as result')
  let sitemapPlaces = 0
  for (const destination of destinations[0].result) {
    const { rows: entries } = await db.query(
      'select api_sitemap_destination_entries($1) as result',
      [destination.id],
    )
    for (const place of entries[0].result.places) {
      const source = rows.find((r) => r.destination === destination.slug && r.slug === place.slug)
      if (
        !source ||
        !place.locales.length ||
        place.locales.some((locale) => !source.indexable_locales.includes(locale))
      ) {
        throw new Error(`Ineligible sitemap place: ${place.slug}`)
      }
      sitemapPlaces++
    }
  }
  const lines = [
    '# Calidad del snapshot de producción',
    '',
    'Generado con `npm run check:content -- --report`. Audita migraciones + importaciones; no carga el seed ni consulta una base remota.',
    '',
    `Lugares reales: **${rows.length}**. Fichas con algún idioma apto para indexar: **${rows.filter((r) => r.indexable_locales.length).length}**. Fichas candidatas en sitemap: **${sitemapPlaces}**.`,
    '',
    '| Campo pendiente | Lugares |',
    '| --- | ---: |',
    ...[
      'image',
      'image_credit',
      'coordinates',
      'rating',
      'full_description',
      'categories',
      'features',
      'ranking_score',
      'website',
      'address',
      'editorial_review',
    ].map((field) => `| ${field} | ${rows.filter((r) => r.missing.includes(field)).length} |`),
    '',
    'Las carencias de rating, ranking, web, categorías, features y coordenadas se informan, pero no son todas obligatorias para SEO. La ubicación puede acreditarse con dirección o coordenadas. Ver `docs/PRODUCTION.md` para los mínimos.',
    '',
    '| Destino | Local | Pendientes | Alertas de fuente |',
    '| --- | --- | --- | --- |',
    ...rows.map(
      (r) =>
        `| ${r.destination} | ${r.name.replaceAll('|', '\\|')} | ${r.missing.join(', ')} | ${r.source_flags.replaceAll('|', '\\|')} |`,
    ),
    '',
  ]
  if (process.argv.includes('--report')) await writeFile('docs/DATA-QUALITY.md', lines.join('\n'))
  console.log(
    `${rows.length} real places; ${sitemapPlaces} indexable place candidates; demo exposure and aliases OK.`,
  )
  console.log(
    `${rows.filter((r) => !r.indexable_locales.length).length} places need editorial completion (remain noindex).`,
  )
  if (
    process.argv.includes('--strict') &&
    rows.some((r) => r.status === 'published' && !r.indexable_locales.length)
  ) {
    throw new Error(
      'Published places await editorial completion. Use --strict only for the final launch gate.',
    )
  }
} finally {
  await db.close()
}
