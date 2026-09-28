import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { placeSearchResultSchema } from '@/lib/db/contracts'
import { createEmbeddedDatabase, createEmbeddedRpcClient } from '@/lib/db/embedded'
import type { RpcClient } from '@/lib/db/rpc'
import {
  buildImport,
  checkUrl,
  classifyMapsUrl,
  normalizeText,
  slugify,
  stableUuid,
} from '../scripts/lib/places-import.mjs'
import { readWorkbook } from '../scripts/lib/xlsx.mjs'

/**
 * The Costa Daurada spreadsheet import, end to end: the real .xlsx is parsed,
 * and the generated supabase/imports SQL (loaded by the embedded database) is
 * checked against it.
 */
const DATA_DIR = path.join(process.cwd(), 'data', 'imports', 'locales-costa-daurada')
const SOURCE = 'locales-costa-daurada'

type ImportResult = ReturnType<typeof buildImport>
type ImportRecord = ImportResult['records'][number]

let result: ImportResult
let db: PGlite
let client: RpcClient

beforeAll(async () => {
  const [workbook, translations] = await Promise.all([
    readFile(path.join(DATA_DIR, 'source.xlsx')),
    readFile(path.join(DATA_DIR, 'translations.json'), 'utf8'),
  ])
  const [sheet] = readWorkbook(workbook)
  result = buildImport(sheet, { translations: JSON.parse(translations) })
  db = await createEmbeddedDatabase()
  client = createEmbeddedRpcClient(async () => db)
})

afterAll(async () => {
  await db?.close()
})

const byName = (name: string) =>
  result.records.find((record) => record.name === name) as ImportRecord

describe('spreadsheet parsing', () => {
  it('reads the 60 data rows below the title and notes, rejecting none', () => {
    expect(result.headerRow).toBe(7)
    expect(result.dataRows).toBe(60)
    expect(result.records).toHaveLength(60)
    expect(result.rejected).toEqual([])
  })

  it('assigns every place to its destination and category', () => {
    const count = (key: 'destinationSlug' | 'placeType') =>
      Object.fromEntries(
        [...new Set(result.records.map((record) => record[key]))].map((value) => [
          value,
          result.records.filter((record) => record[key] === value).length,
        ]),
      )
    expect(count('destinationSlug')).toEqual({
      salou: 12,
      tarragona: 12,
      cambrils: 12,
      'miami-platja': 12,
      'hospitalet-de-l-infant': 12,
    })
    expect(count('placeType')).toEqual({ cafe: 14, restaurant: 21, tapas_bar: 10, drinks: 15 })
    expect(byName('Twisted Lime')).toMatchObject({
      destinationSlug: 'cambrils',
      placeType: 'tapas_bar',
    })
    expect(byName('Koko Beach Club')).toMatchObject({
      destinationSlug: 'salou',
      placeType: 'drinks',
    })
  })

  it('extracts hyperlink targets instead of the visible labels', () => {
    for (const record of result.records) {
      expect(record.mapsUrl).toMatch(/^https:\/\//)
      expect(record.record.sourceUrl).toMatch(/^https:\/\//)
      expect(record.mapsUrl).not.toContain('Abrir Google Maps')
    }
    expect(byName('Café Central').mapsUrl).toBe(
      'https://www.google.com/maps/search/?api=1&query=Caf%C3%A9%20Central%2C%20Salou%2C%20Tarragona%20Espa%C3%B1a',
    )
    expect(byName('Deliranto').record.sourceUrl).toBe('https://deliranto.com/')
    expect(byName('Savash Beach').mapsUrl).toBe('https://maps.app.goo.gl/UBjvfuqpUCDxwqo98')
  })

  it('classifies what each Maps link really points to', () => {
    const kinds = result.records.reduce<Record<string, number>>((acc, record) => {
      const kind = record.mapsUrlKind ?? 'none'
      acc[kind] = (acc[kind] ?? 0) + 1
      return acc
    }, {})
    expect(kinds).toEqual({ search: 54, place_id: 2, coordinates: 2, place: 1, short_link: 1 })
    expect(byName('El Pòsit del Serrallo').mapsUrlKind).toBe('coordinates')
    expect(byName('Sisters Cafe').mapsUrlKind).toBe('place_id')
    // Labelled "published by the source" but it is a text search.
    expect(byName('Kema Cambrils')).toMatchObject({ mapsUrlKind: 'search' })
    expect(byName('Kema Cambrils').record.reviewFlags).toContain('link_type_is_search')
  })

  it('withholds contradictory addresses and keeps notes internal', () => {
    const trece = byName('TRECE Brunch & Speciality Coffee')
    expect(trece.addressLine).toBeNull()
    expect(trece.record.address).toBe('Avinguda de Barcelona, 160')
    expect(trece.record.reviewFlags).toContain('address_conflict')
    expect(byName('La Ibense Salou - Paseo').addressLine).toBe('Passeig Jaume I, 50')
    expect(byName('Café Central').addressLine).toBeNull()
    expect(byName('El Mestral').record.reviewFlags).toContain('source_names_other_business')
    // Observations never reach public fields.
    for (const record of result.records) {
      const publicText = JSON.stringify([record.name, record.addressLine, record.descriptions])
      if (record.record.notes) expect(publicText).not.toContain(record.record.notes)
    }
  })

  it('translates every specialty into the six languages without changing names', () => {
    expect(result.untranslated).toEqual([])
    expect(byName('La Vilateria').descriptions).toEqual({
      es: 'Vermut, aperitivos y café',
      ca: 'Vermut, aperitius i cafè',
      en: 'Vermouth, aperitifs and coffee',
      fr: 'Vermouth, apéritifs et café',
      de: 'Wermut, Aperitifs und Kaffee',
      it: 'Vermut, aperitivi e caffè',
    })
  })

  it('derives stable keys, ids and slugs', () => {
    expect(new Set(result.records.map((record) => record.key)).size).toBe(60)
    expect(byName("Restaurant Vane's").slug).toBe('restaurant-vanes')
    expect(byName('Café Central').id).toBe(stableUuid('place:salou|cafe central'))
    expect(normalizeText('L’Hospitalet de l’Infant')).toBe('l hospitalet de l infant')
    expect(slugify('TRECE Brunch & Speciality Coffee')).toBe('trece-brunch-speciality-coffee')
  })

  it('adds secondary categories only from explicit words of the specialty', () => {
    const withExtra = Object.fromEntries(
      result.records
        .filter((record) => record.extraTypes.length > 0)
        .map((record) => [record.name, record.extraTypes]),
    )
    expect(withExtra).toEqual({
      'Café del Far': ['drinks'],
      'Sisters Cafe': ['brunch'],
      Metropolitan: ['restaurant'],
      'Mur Mur': ['restaurant'],
      'Cafè La Cantonada': ['cafe'],
      'Kema Cambrils': ['drinks'],
      'Twisted Lime': ['drinks'],
      Vila5: ['drinks'],
      'La Vilateria': ['cafe'],
      'TRECE Brunch & Speciality Coffee': ['brunch'],
      'Ginger Café': ['drinks'],
      'Rosarito Café': ['restaurant', 'drinks'],
    })
  })

  it('takes the website from the source only when it is the business’s own domain', () => {
    expect(byName('Deliranto').website).toBe('https://deliranto.com/')
    expect(byName('Kema Cambrils').website).toBe('https://kemacambrils.com/')
    // Club's page listing several restaurants, tourism sites, review sites: no.
    expect(byName('Restaurant Nàutic').website).toBeNull()
    expect(byName('El Terrat').website).toBeNull()
    expect(byName('Eclipse').website).toBeNull()
    expect(byName('Sisters Cafe').website).toBeNull()
    expect(result.records.filter((record) => record.website)).toHaveLength(13)
  })

  it('rejects duplicates, unknown localities and unknown categories', () => {
    const rows = [
      ['Título de la hoja'],
      ['Localidad', 'Local', 'Categoría'],
      ['Miami Playa', 'Casa Xavi', 'Bares de tapas'],
      ['Miami Platja', 'CASA  XAVÍ', 'Bares de tapas'],
      ['Reus', 'Otro', 'Restaurantes'],
      ['Salou', 'Otro', 'Heladerías'],
    ].map((values, index) => ({
      number: index + 1,
      cells: new Map(
        values.map((text, column) => [column + 1, { ref: `R${index + 1}`, text, hyperlink: null }]),
      ),
    }))
    const parsed = buildImport({ name: 'Test', rows })
    expect(parsed.records.map((record) => record.name)).toEqual(['Casa Xavi'])
    expect(parsed.rejected.map((item) => item.row)).toEqual([4, 5, 6])
    expect(parsed.rejected[0].reason).toContain('Duplicado de la fila 3')
  })

  it('accepts only https links on Google Maps hosts', () => {
    expect(checkUrl('http://www.google.com/maps')).toEqual({ url: null, problem: 'insecure_url' })
    expect(checkUrl('javascript:alert(1)').url).toBeNull()
    expect(classifyMapsUrl('https://evil.example/maps/search/?query=x')).toBeNull()
    expect(classifyMapsUrl('https://www.google.com/maps/dir/?api=1&destination=41.07,1.05')).toBe(
      'coordinates',
    )
  })
})

describe('database import', () => {
  it('loads every row once, published and without invented data', async () => {
    const { rows } = await db.query<{
      total: number
      distinct_keys: number
      with_rating: number
      with_coordinates: number
      with_phone: number
      demo: number
    }>(
      `select count(*)::int as total,
              count(distinct (destination_id, search_normalize(name)))::int as distinct_keys,
              count(rating)::int as with_rating,
              count(latitude)::int as with_coordinates,
              count(phone)::int as with_phone,
              count(*) filter (where is_demo)::int as demo
       from places p
       where exists (select 1 from place_import_records r where r.place_id = p.id)`,
    )
    expect(rows[0]).toEqual({
      total: 60,
      distinct_keys: 60,
      with_rating: 0,
      with_coordinates: 0,
      with_phone: 0,
      demo: 0,
    })
  })

  it('keeps link types, sources and raw hyperlinks internally', async () => {
    const { rows } = await db.query<{
      source_key: string
      maps_link_type: string
      source_url: string
      maps_url: string
    }>(
      `select source_key, maps_link_type, source_url, maps_url from place_import_records
       where source = $1 order by row_number`,
      [SOURCE],
    )
    expect(rows).toHaveLength(60)
    for (const [index, row] of rows.entries()) {
      const record = result.records[index]
      expect(row.source_key).toBe(record.key)
      expect(row.maps_url).toBe(record.record.mapsUrlRaw)
      expect(row.source_url).toBe(record.record.sourceUrl)
      expect(row.maps_link_type).toBe(record.record.mapsLinkType)
    }
  })

  it('hides import records and the import function from the public roles', async () => {
    await db.exec('set role anon')
    try {
      await expect(db.query('select count(*) from place_import_records')).rejects.toThrow()
      await expect(db.query(`select apply_place_import('x', '[]'::jsonb)`)).rejects.toThrow()
    } finally {
      await db.exec('reset role')
    }
  })

  const search = async (query: string, extra: Record<string, unknown> = {}) =>
    placeSearchResultSchema.parse(
      await client.call('api_search_places', {
        p_locale: 'es',
        p_fallback: 'es',
        p_query: query,
        p_limit: 100,
        ...extra,
      }),
    )

  it('searches name, locality and specialty ignoring case, accents and variants', async () => {
    for (const query of ['Miami Playa', 'miami platja', 'MIAMI PLATJA']) {
      expect((await search(query)).total, query).toBe(12)
    }
    expect((await search('l’hospitalet')).total).toBe(12)
    expect((await search('HOSPITALET DE L INFANT')).total).toBe(12)
    expect((await search('vermut')).items.map((place) => place.name)).toEqual(['La Vilateria'])
    expect((await search('tapas salou')).items.map((place) => place.name)).toEqual([
      'Malapecora',
      'Tabaré Gastrobar',
    ])
    expect((await search('pÒsit')).items.map((place) => place.name)).toEqual([
      'El Pòsit del Serrallo',
    ])
    // Other locales match their translated specialty and the Spanish fallback.
    expect((await search('cocktails', { p_locale: 'en' })).total).toBeGreaterThan(5)
    expect((await search('***')).total).toBe(0)
  })

  it('filters by primary or secondary category', async () => {
    const brunch = await search('', { p_place_type: 'brunch' })
    expect(brunch.items.map((place) => place.name)).toEqual([
      'Demo Cafè del Passeig',
      'Sisters Cafe',
      'TRECE Brunch & Speciality Coffee',
    ])
    const [trece] = (await search('trece')).items
    expect(trece).toMatchObject({
      placeType: 'cafe',
      secondaryTypes: [{ code: 'brunch', name: 'Brunch' }],
      destination: { slug: 'miami-platja', name: 'Miami Platja' },
    })
    // Every imported place appears under its spreadsheet category.
    for (const [type, count] of [
      ['cafe', 14],
      ['restaurant', 21],
      ['tapas_bar', 10],
      ['drinks', 15],
    ] as const) {
      const { rows } = await db.query<{ n: number }>(
        `select count(*)::int as n from places p
         join place_import_records r on r.place_id = p.id where p.place_type = $1`,
        [type],
      )
      expect(rows[0].n, type).toBe(count)
    }
  })

  it('exposes public card fields only', async () => {
    const [card] = (await search('Café Central')).items
    expect(card).toMatchObject({
      name: 'Café Central',
      placeType: 'cafe',
      placeTypeName: 'Cafetería',
      destination: { slug: 'salou', name: 'Salou' },
      shortDescription: 'Café, helados y comidas',
      addressLine: null,
      mapsUrlKind: 'search',
      isRanked: false,
      rating: null,
      imageUrl: null,
    })
    expect(JSON.stringify(card)).not.toContain('contrastada')
  })

  it('re-imports idempotently and never overwrites manual edits', async () => {
    const apply = async (rows: unknown[]) => {
      const { rows: out } = await db.query<{ summary: Record<string, number> }>(
        'select apply_place_import($1, $2::jsonb) as summary',
        [SOURCE, JSON.stringify(rows)],
      )
      return out[0].summary
    }
    const cafe = byName('Café Central')
    const ibense = byName('La Ibense Salou - Paseo')

    // Same data again: nothing changes.
    expect(await apply(result.records)).toMatchObject({ rows: 60, inserted: 0, updated: 0 })

    // Manual enrichment in the database.
    await db.query(
      `update places set name = 'Café Central Salou', address_line = 'Carrer Major, 1'
                    where id = $1`,
      [cafe.id],
    )
    await db.query(
      `update place_translations set short_description = 'Texto editorial propio'
                    where place_id = $1 and locale = 'es'`,
      [cafe.id],
    )
    await db.query(
      `update place_translations set full_description = 'Descripción larga'
                    where place_id = $1 and locale = 'es'`,
      [cafe.id],
    )

    // The spreadsheet changes both places; one row disappears.
    const changedCafe = {
      ...cafe,
      name: 'Cafe Central',
      addressLine: 'Passeig Jaume I, 1',
      descriptions: { ...cafe.descriptions, es: 'Café y helados', en: 'Coffee and ice cream' },
    }
    const changedIbense = { ...ibense, addressLine: 'Passeig Jaume I, 52' }
    const summary = await apply([changedCafe, changedIbense])
    expect(summary).toMatchObject({ inserted: 0, updated: 1, missingFromSource: 58 })

    const { rows } = await db.query<{
      name: string
      address_line: string
      es: string
      en: string
      full: string
    }>(
      `select p.name, p.address_line,
              (select short_description from place_translations where place_id = p.id and locale = 'es') as es,
              (select short_description from place_translations where place_id = p.id and locale = 'en') as en,
              (select full_description from place_translations where place_id = p.id and locale = 'es') as full
       from places p where p.id = $1`,
      [cafe.id],
    )
    expect(rows[0]).toEqual({
      name: 'Café Central Salou',
      address_line: 'Carrer Major, 1',
      es: 'Texto editorial propio',
      en: 'Coffee and ice cream',
      full: 'Descripción larga',
    })
    const { rows: ibenseRows } = await db.query<{ address_line: string }>(
      'select address_line from places where id = $1',
      [ibense.id],
    )
    expect(ibenseRows[0].address_line).toBe('Passeig Jaume I, 52')

    // Missing rows are flagged, never deleted or unpublished.
    const { rows: missing } = await db.query<{ missing: number; published: number }>(
      `select count(*) filter (where r.missing_since is not null)::int as missing,
              count(*) filter (where p.status = 'published')::int as published
       from place_import_records r join places p on p.id = r.place_id where r.source = $1`,
      [SOURCE],
    )
    expect(missing[0]).toEqual({ missing: 58, published: 60 })

    // A place deleted by hand is not resurrected.
    await db.query('delete from places where id = $1', [ibense.id])
    expect(await apply([changedIbense])).toMatchObject({ inserted: 0, skippedDeleted: 1 })
  })
})
