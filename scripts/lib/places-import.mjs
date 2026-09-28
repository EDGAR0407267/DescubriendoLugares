/**
 * Spreadsheet → places import (pure logic, no I/O).
 *
 * Turns the rows of a curated spreadsheet into records for
 * `public.apply_place_import()` (supabase/migrations/*_places_import.sql),
 * which merges them into `places` without overwriting manual edits.
 * Rules that protect published data live here:
 *   - Only https links are kept; Maps links must point to Google Maps.
 *   - Addresses flagged as contradictory are withheld, never published.
 *   - Observations, link types and sources are stored internally only.
 *   - Nothing is inferred: no coordinates, hours, prices or ratings.
 * See docs/IMPORTS.md.
 */
import { createHash } from 'node:crypto'
import { columnName } from './xlsx.mjs'

/** Lowercase, accent-free, punctuation collapsed to single spaces. */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[’'`´]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** URL slug: "Restaurant Vane's" → "restaurant-vanes". */
export function slugify(value) {
  const slug = String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '')
  return slug || 'local'
}

/** Deterministic UUID (v5 layout, SHA-1) so ids are stable across imports. */
export function stableUuid(name) {
  const bytes = createHash('sha1').update(`descubriendolugares:${name}`).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Spreadsheet locality (normalized) → canonical `destinations.slug`. */
export const DESTINATION_ALIASES = {
  salou: 'salou',
  tarragona: 'tarragona',
  cambrils: 'cambrils',
  vilafortuny: 'cambrils',
  'miami platja': 'miami-platja',
  'miami playa': 'miami-platja',
  miami: 'miami-platja',
  'l hospitalet de l infant': 'hospitalet-de-l-infant',
  'hospitalet de l infant': 'hospitalet-de-l-infant',
  'l hospitalet': 'hospitalet-de-l-infant',
  'hospitalet del infant': 'hospitalet-de-l-infant',
}

/** Spreadsheet category (normalized) → `place_types.code`. */
export const CATEGORY_ALIASES = {
  cafeterias: 'cafe',
  cafeteria: 'cafe',
  cafes: 'cafe',
  restaurantes: 'restaurant',
  restaurante: 'restaurant',
  'bares de tapas': 'tapas_bar',
  'bar de tapas': 'tapas_bar',
  tapas: 'tapas_bar',
  'para beber algo': 'drinks',
  'tomar algo': 'drinks',
  copas: 'drinks',
}

/**
 * Secondary types, only from explicit words of the "Especialidad / ambiente"
 * column (normalized text), never from the name or from guesses. The
 * spreadsheet's own category is always the primary type.
 */
export const SECONDARY_TYPE_RULES = [
  { type: 'restaurant', pattern: /\brestaurante\b/ },
  { type: 'cafe', pattern: /\b(cafe|cafeteria)\b/ },
  { type: 'tapas_bar', pattern: /\btapas?\b/ },
  { type: 'brunch', pattern: /\bbrunch\b/ },
  {
    type: 'drinks',
    pattern: /\b(bar|pub|copas|coctel|cocteles|cocteleria|mojitos?|vermut|cervezas?|cerveceria)\b/,
  },
]

/** @returns {string[]} secondary place type codes stated in the specialty. */
export function secondaryTypesFor(specialty, primaryType) {
  const text = normalizeText(specialty)
  if (!text) return []
  return SECONDARY_TYPE_RULES.filter(
    (rule) => rule.type !== primaryType && rule.pattern.test(text),
  ).map((rule) => rule.type)
}

const LOCALITY_WORDS = [
  'salou',
  'tarragona',
  'cambrils',
  'miami',
  'platja',
  'playa',
  'hospitalet',
  'infant',
  'vilafortuny',
  'costa',
  'daurada',
  'dorada',
]
const ARTICLES = ['el', 'la', 'les', 'los', 'las', 'de', 'del', 'dels', 'can', 'cal', 'the']

/**
 * The source URL doubles as the official website only when its domain is
 * the business's own: once the name's words and locality words are removed
 * from the host, (almost) nothing is left. "deliranto.com" → yes;
 * "clubnautichospitaletvandellos.com" for "Restaurant Nàutic" → no.
 */
export function officialWebsite(sourceUrl, name) {
  if (!sourceUrl) return null
  let host
  try {
    const url = new URL(sourceUrl)
    if (url.protocol !== 'https:') return null
    host = url.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
  const labels = host.split('.')
  let core = labels.slice(0, -1).join('').replace(/-/g, '')
  const words = [...normalizeText(name).split(' '), ...LOCALITY_WORDS, ...ARTICLES]
    .filter((word) => word.length >= 2)
    .sort((a, b) => b.length - a.length)
  if (
    !normalizeText(name)
      .split(' ')
      .some((word) => word.length >= 3 && core.includes(word))
  ) {
    return null
  }
  for (const word of words) core = core.split(word).join('')
  return core.length <= 2 ? sourceUrl : null
}

/** Column header aliases (normalized). */
const COLUMNS = {
  locality: ['localidad', 'municipio', 'poblacion'],
  name: ['local', 'nombre', 'establecimiento', 'nombre del establecimiento'],
  category: ['categoria', 'categoria principal'],
  specialty: ['especialidad ambiente', 'especialidad', 'ambiente'],
  address: ['direccion zona', 'direccion', 'zona'],
  maps: ['google maps', 'url google maps', 'maps', 'enlace google maps'],
  linkType: ['tipo de enlace'],
  source: ['fuente', 'url de la fuente'],
  notes: ['observaciones', 'notas'],
}
const REQUIRED_COLUMNS = ['locality', 'name', 'category']

const GOOGLE_MAPS_HOSTS =
  /^(www\.)?google\.[a-z.]+$|^maps\.google\.[a-z.]+$|^maps\.app\.goo\.gl$|^goo\.gl$/

/**
 * Validates an external URL: only https is accepted, http is not upgraded
 * silently (the target may not support it).
 * @returns {{ url: string | null, problem: string | null }}
 */
export function checkUrl(value) {
  const text = String(value ?? '').trim()
  if (!text) return { url: null, problem: null }
  let parsed
  try {
    parsed = new URL(text)
  } catch {
    return { url: null, problem: 'invalid_url' }
  }
  if (parsed.protocol !== 'https:') return { url: null, problem: 'insecure_url' }
  return { url: parsed.href, problem: null }
}

/**
 * What a Google Maps link actually points to, derived from the URL itself
 * (the spreadsheet's "link type" label is kept separately, verbatim):
 *   search      – free-text search (name + locality or address); not a verified listing
 *   place_id    – search pinned to a Google place id
 *   coordinates – explicit coordinates published by the source
 *   place       – /maps/place/ link
 *   short_link  – maps.app.goo.gl short link published by the source
 * @returns {'search' | 'place_id' | 'coordinates' | 'place' | 'short_link' | null}
 */
export function classifyMapsUrl(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (!GOOGLE_MAPS_HOSTS.test(parsed.hostname)) return null
  if (parsed.hostname === 'maps.app.goo.gl' || parsed.hostname === 'goo.gl') return 'short_link'
  const path = parsed.pathname
  const coordinates = /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/
  if (path.startsWith('/maps/search')) {
    if (parsed.searchParams.get('query_place_id')) return 'place_id'
    return coordinates.test(parsed.searchParams.get('query') ?? '') ? 'coordinates' : 'search'
  }
  if (path.startsWith('/maps/dir')) {
    return coordinates.test(parsed.searchParams.get('destination') ?? '') ? 'coordinates' : 'search'
  }
  if (path.startsWith('/maps/place')) return 'place'
  if (path.startsWith('/maps')) return 'search'
  return null
}

const GENERIC_NAME_TOKENS = new Set([
  'bar',
  'bars',
  'bares',
  'cafe',
  'cafeteria',
  'restaurant',
  'restaurante',
  'beach',
  'club',
  'the',
  'los',
  'las',
  'del',
  'dels',
  'les',
  'els',
  'pizzeria',
  'casa',
  'salou',
  'tarragona',
  'cambrils',
  'playa',
  'platja',
  'paseo',
  'music',
])

/** Business-specific pages (as opposed to listings) on review/directory sites. */
function isBusinessPage(url) {
  return (
    /tripadvisor\.[a-z.]+\/(Restaurant|Attraction|Hotel)_Review-/i.test(url) ||
    /restaurantguru\.com\/[^/?#]+/i.test(url) ||
    /waze\.com\/.+\/directions\//i.test(url)
  )
}

/** True when a distinctive token of the name appears in the URL. */
function urlMentionsName(url, name) {
  const haystack = normalizeText(decodeURIComponent(url))
  const tokens = normalizeText(name)
    .split(' ')
    .filter((token) => token.length >= 3 && !GENERIC_NAME_TOKENS.has(token))
  if (tokens.length === 0) return true
  return tokens.some((token) => haystack.includes(token))
}

/** Observations that signal contradictory addresses (see rule in docs/IMPORTS.md). */
const ADDRESS_CONFLICT = /otra ficha|otra direcci[oó]n|contradic|discrepan|direcci[oó]n dudosa/i
const ADDRESS_UNVERIFIED = /direcci[oó]n no contrastada|sin direcci[oó]n/i

function findHeader(rows) {
  for (const row of rows) {
    const columns = {}
    for (const [column, cell] of row.cells) {
      const header = normalizeText(cell.text)
      for (const [key, aliases] of Object.entries(COLUMNS)) {
        if (!(key in columns) && aliases.includes(header)) columns[key] = column
      }
    }
    if (REQUIRED_COLUMNS.every((key) => key in columns)) return { row: row.number, columns }
  }
  return null
}

function cellValue(row, column) {
  if (!column) return { text: '', hyperlink: null, ref: null }
  const cell = row.cells.get(column)
  return {
    text: (cell?.text ?? '').replace(/\s+/g, ' ').trim(),
    hyperlink: cell?.hyperlink ?? null,
    ref: cell?.ref ?? `${columnName(column)}${row.number}`,
  }
}

/** A link cell's URL: its hyperlink target, or the text when it is itself a URL. */
function linkValue(cell) {
  if (cell.hyperlink) return cell.hyperlink.trim()
  return /^https?:\/\//i.test(cell.text) ? cell.text : ''
}

/**
 * @typedef {Record<string, Record<string, string>>} Translations
 *   Spanish text → { ca, en, fr, de, it }
 */

/**
 * Maps the rows of a sheet to import records.
 * @param {import('./xlsx.mjs').Sheet} sheet
 * @param {{ translations?: Translations, locales?: string[] }} [options]
 */
export function buildImport(
  sheet,
  { translations = {}, locales = ['es', 'ca', 'en', 'fr', 'de', 'it'] } = {},
) {
  const header = findHeader(sheet.rows)
  if (!header) {
    throw new Error(
      `Sheet "${sheet.name}": header row not found (needs ${REQUIRED_COLUMNS.join(', ')} columns)`,
    )
  }
  const { columns } = header

  /** @type {any[]} */
  const records = []
  /** @type {{ row: number, name: string, locality: string, reason: string }[]} */
  const rejected = []
  /** @type {{ row: number, reason: string }[]} */
  const ignored = []
  const untranslated = new Set()
  const seen = new Map()
  let dataRows = 0

  for (const row of sheet.rows) {
    if (row.number <= header.row) continue
    const values = Object.fromEntries(
      Object.entries(COLUMNS).map(([key]) => [key, cellValue(row, columns[key])]),
    )
    const filled = Object.values(values).filter((value) => value.text || value.hyperlink).length
    if (filled === 0) continue
    if (filled === 1 && !values.name.text) {
      ignored.push({ row: row.number, reason: 'Fila sin datos de local (nota o título)' })
      continue
    }
    dataRows++

    const name = values.name.text
    const locality = values.locality.text
    const reject = (reason) => rejected.push({ row: row.number, name, locality, reason })

    if (!name) {
      reject('Falta el nombre del local')
      continue
    }
    if (!locality) {
      reject('Falta la localidad')
      continue
    }
    const destinationSlug = DESTINATION_ALIASES[normalizeText(locality)]
    if (!destinationSlug) {
      reject(`Localidad desconocida: "${locality}"`)
      continue
    }
    const placeType = CATEGORY_ALIASES[normalizeText(values.category.text)]
    if (!placeType) {
      reject(`Categoría desconocida: "${values.category.text}"`)
      continue
    }

    const nameKey = normalizeText(name)
    const key = `${destinationSlug}|${nameKey}`
    if (seen.has(key)) {
      reject(`Duplicado de la fila ${seen.get(key)} (misma localidad y nombre normalizado)`)
      continue
    }
    seen.set(key, row.number)

    const flags = []
    const notes = values.notes.text || null
    const specialty = values.specialty.text || null

    // Maps link: must be https and on a Google Maps host.
    const rawMaps = linkValue(values.maps)
    const mapsCheck = checkUrl(rawMaps)
    let mapsUrl = mapsCheck.url
    let mapsUrlKind = mapsUrl ? classifyMapsUrl(mapsUrl) : null
    if (mapsCheck.problem) flags.push(`maps_${mapsCheck.problem}`)
    if (mapsUrl && !mapsUrlKind) {
      flags.push('maps_not_google')
      mapsUrl = null
    }
    if (!rawMaps) flags.push('maps_missing')

    const linkType = values.linkType.text || null
    if (linkType && /fuente/i.test(linkType) && mapsUrlKind === 'search') {
      // Labelled as a link published by the source, but it is a text search.
      flags.push('link_type_is_search')
    }

    // Source: kept internally, never shown.
    const rawSource = linkValue(values.source)
    const sourceCheck = checkUrl(rawSource)
    if (sourceCheck.problem) flags.push(`source_${sourceCheck.problem}`)
    if (!rawSource) flags.push('source_missing')
    const sourceUrl = sourceCheck.url ?? (rawSource || null)
    if (sourceCheck.url && !urlMentionsName(sourceCheck.url, name)) {
      flags.push(isBusinessPage(sourceCheck.url) ? 'source_names_other_business' : 'source_generic')
    }

    // Address: published only when present and not contradicted.
    let addressLine = values.address.text || null
    if (addressLine && notes && ADDRESS_CONFLICT.test(notes)) {
      flags.push('address_conflict')
      addressLine = null
    }
    if (!values.address.text && notes && ADDRESS_UNVERIFIED.test(notes)) {
      flags.push('address_unverified')
    }

    const descriptions = {}
    if (specialty) {
      const translated = translations[specialty] ?? {}
      for (const locale of locales) {
        const text = locale === 'es' ? specialty : translated[locale]
        if (text) descriptions[locale] = text
        else untranslated.add(specialty)
      }
    }

    const website = officialWebsite(sourceCheck.url, name)

    records.push({
      key,
      id: stableUuid(`place:${key}`),
      slug: slugify(name),
      destinationSlug,
      placeType,
      extraTypes: secondaryTypesFor(specialty, placeType),
      name,
      addressLine,
      website,
      mapsUrl,
      mapsUrlKind: mapsUrl ? mapsUrlKind : null,
      descriptions,
      record: {
        rowNumber: row.number,
        sheet: sheet.name,
        locality,
        category: values.category.text,
        specialty,
        address: values.address.text || null,
        mapsLinkType: linkType,
        mapsUrlRaw: rawMaps || null,
        sourceUrl,
        notes,
        reviewFlags: flags,
      },
    })
  }

  return {
    headerRow: header.row,
    dataRows,
    records,
    rejected,
    ignored,
    untranslated: [...untranslated].sort(),
  }
}

/** Human-readable meaning of each review flag (used in the report). */
export const FLAG_DESCRIPTIONS = {
  address_conflict:
    'Las observaciones indican direcciones contradictorias: la dirección NO se publica hasta revisarla.',
  address_unverified: 'Dirección no contrastada en la fuente: no se publica ninguna dirección.',
  link_type_is_search:
    'Marcado como "enlace publicado por la fuente", pero la URL es una búsqueda de Google Maps.',
  source_names_other_business:
    'La fuente es la ficha de otro negocio (el nombre del local no aparece en la URL).',
  source_generic:
    'La fuente es un listado o documento general; no confirma el local de forma individual.',
  maps_missing: 'Sin enlace de Google Maps.',
  maps_insecure_url: 'Enlace de Maps sin https: descartado.',
  maps_invalid_url: 'Enlace de Maps no válido: descartado.',
  maps_not_google: 'El enlace de Maps no apunta a Google Maps: descartado.',
  source_missing: 'Sin fuente.',
  source_insecure_url: 'Fuente sin https (se conserva solo internamente).',
  source_invalid_url: 'Fuente con URL no válida.',
}

/** Flags that need a human decision (the rest are informative). */
export const REVIEW_FLAGS = new Set([
  'address_conflict',
  'link_type_is_search',
  'source_names_other_business',
  'maps_missing',
  'maps_insecure_url',
  'maps_invalid_url',
  'maps_not_google',
  'source_insecure_url',
  'source_invalid_url',
])

/**
 * SQL that applies the import. Rows travel as one JSON document inside a
 * dollar-quoted literal, so no value is ever interpolated into SQL syntax.
 */
export function renderSql({ source, inputName, records, summary }) {
  const json = `[\n${records.map((record) => JSON.stringify(record)).join(',\n')}\n]`
  let tag = 'import'
  while (json.includes(`$${tag}$`)) tag += '_'
  return [
    '-- =============================================================================',
    `-- GENERATED by scripts/import-places.mjs from ${inputName}. Do not edit by hand:`,
    '-- change the spreadsheet (or data/imports/*/translations.json) and re-run',
    '--   npm run import:places',
    `-- ${summary}`,
    '--',
    '-- Idempotent: public.apply_place_import() inserts new places and updates only',
    '-- the fields whose current value is still the one written by the previous',
    '-- import, so manual edits in the database are preserved. See docs/IMPORTS.md.',
    '-- =============================================================================',
    `select public.apply_place_import('${source.replace(/'/g, "''")}', $${tag}$${json}$${tag}$::jsonb);`,
    '',
  ].join('\n')
}

function escapeCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
}

function table(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`),
  ].join('\n')
}

/** Markdown report of an import run (rows read, rejected, review queue). */
export function renderReport({ source, inputName, result, generatedAt }) {
  const { records, rejected, ignored, untranslated } = result
  const count = (predicate) => records.filter(predicate).length
  const byDestination = new Map()
  const byType = new Map()
  const byKind = new Map()
  for (const record of records) {
    byDestination.set(record.destinationSlug, (byDestination.get(record.destinationSlug) ?? 0) + 1)
    byType.set(record.placeType, (byType.get(record.placeType) ?? 0) + 1)
    const kind = record.mapsUrlKind ?? 'sin enlace'
    byKind.set(kind, (byKind.get(kind) ?? 0) + 1)
  }
  const review = records.filter((record) =>
    record.record.reviewFlags.some((flag) => REVIEW_FLAGS.has(flag)),
  )
  const generic = records.filter((record) => record.record.reviewFlags.includes('source_generic'))
  const withExtraTypes = records.filter((record) => record.extraTypes.length > 0)
  const withWebsite = records.filter((record) => record.website)

  return [
    `# Informe de importación: ${source}`,
    '',
    `Generado por \`npm run import:places\` el ${generatedAt} a partir de \`${inputName}\`.`,
    'No editar a mano: se regenera en cada importación.',
    '',
    '## Resumen',
    '',
    table(
      ['Concepto', 'Valor'],
      [
        ['Fila de cabecera', result.headerRow],
        ['Filas de datos leídas', result.dataRows],
        ['Locales importados', records.length],
        ['Filas rechazadas', rejected.length],
        ['Filas ignoradas (notas/títulos tras la cabecera)', ignored.length],
        ['Con dirección publicada', count((record) => record.addressLine)],
        ['Con enlace de Google Maps', count((record) => record.mapsUrl)],
        [
          'Con descripción traducida a todos los idiomas',
          count((record) => Object.keys(record.descriptions).length === 6),
        ],
        ['Pendientes de revisión', review.length],
      ],
    ),
    '',
    '### Por localidad',
    '',
    table(['Destino (slug)', 'Locales'], [...byDestination]),
    '',
    '### Por categoría',
    '',
    table(['Tipo (place_types.code)', 'Locales'], [...byType]),
    '',
    '### Enlaces de Google Maps por tipo real de URL',
    '',
    table(['Tipo', 'Locales'], [...byKind]),
    '',
    'Solo `place_id`, `coordinates`, `place` y `short_link` apuntan a una ficha o punto concreto;',
    '`search` es una búsqueda por texto y la interfaz lo indica al visitante.',
    '',
    '## Filas rechazadas',
    '',
    rejected.length
      ? table(
          ['Fila', 'Localidad', 'Local', 'Motivo'],
          rejected.map((item) => [item.row, item.locality, item.name, item.reason]),
        )
      : 'Ninguna.',
    '',
    ...(ignored.length
      ? [
          '### Filas ignoradas',
          '',
          table(
            ['Fila', 'Motivo'],
            ignored.map((item) => [item.row, item.reason]),
          ),
          '',
        ]
      : []),
    '## Pendiente de revisión',
    '',
    review.length
      ? table(
          ['Fila', 'Localidad', 'Local', 'Motivo', 'Observaciones del Excel'],
          review.map((record) => [
            record.record.rowNumber,
            record.record.locality,
            record.name,
            record.record.reviewFlags
              .filter((flag) => REVIEW_FLAGS.has(flag))
              .map((flag) => FLAG_DESCRIPTIONS[flag] ?? flag)
              .join(' '),
            record.record.notes ?? '',
          ]),
        )
      : 'Nada pendiente.',
    '',
    '## Categorías secundarias (de la columna "Especialidad / ambiente")',
    '',
    'Regla: solo palabras explícitas de la especialidad (p. ej. "brunch", "cócteles", "restaurante").',
    'Revísalas; se pueden quitar o añadir a mano en `place_secondary_types` y la reimportación lo respeta.',
    '',
    withExtraTypes.length
      ? table(
          ['Fila', 'Local', 'Principal', 'Secundarias', 'Especialidad'],
          withExtraTypes.map((record) => [
            record.record.rowNumber,
            record.name,
            record.placeType,
            record.extraTypes.join(', '),
            record.record.specialty,
          ]),
        )
      : 'Ninguna.',
    '',
    '## Web oficial (fuente en el dominio propio del local)',
    '',
    withWebsite.length
      ? table(
          ['Fila', 'Local', 'Web'],
          withWebsite.map((record) => [record.record.rowNumber, record.name, record.website]),
        )
      : 'Ninguna.',
    '',
    '## Fuentes genéricas (informativo)',
    '',
    'La fuente no menciona el local de forma individual (listados, buscadores, documentos).',
    'No se muestra al visitante; conviene sustituirla por una fuente específica cuando sea posible.',
    '',
    generic.length
      ? table(
          ['Fila', 'Local', 'Fuente'],
          generic.map((record) => [record.record.rowNumber, record.name, record.record.sourceUrl]),
        )
      : 'Ninguna.',
    '',
    '## Especialidades sin traducción completa',
    '',
    untranslated.length
      ? [
          'Se publican en español y el resto de idiomas usa el fallback (ficha `noindex`).',
          'Añádelas a `translations.json` y vuelve a importar.',
          '',
          ...untranslated.map((text) => `- ${text}`),
        ].join('\n')
      : 'Todas las especialidades tienen traducción a los seis idiomas.',
    '',
  ].join('\n')
}
