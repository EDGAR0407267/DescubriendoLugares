#!/usr/bin/env node
/**
 * Imports a curated places spreadsheet (.xlsx) into the database seed flow.
 *
 *   npm run import:places                       # default dataset
 *   npm run import:places -- --input ~/Downloads/Locales.xlsx
 *
 * Options:
 *   --input <file>     spreadsheet (default: data/imports/<source>/source.xlsx)
 *   --source <name>    import id, stable across runs (default: locales-costa-daurada)
 *   --sheet <name>     worksheet name (default: first sheet)
 *   --check            validate and print the summary without writing files
 *
 * Writes:
 *   supabase/imports/<source>.sql        applied after seed.sql (embedded DB)
 *                                        and with psql on Supabase
 *   data/imports/<source>/report.md      rows read, rejected, review queue
 *
 * The spreadsheet is processed here, once, never in the visitor's browser.
 * See docs/IMPORTS.md.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { buildImport, renderReport, renderSql } from './lib/places-import.mjs'
import { readWorkbook } from './lib/xlsx.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const { values } = parseArgs({
  options: {
    input: { type: 'string' },
    source: { type: 'string', default: 'locales-costa-daurada' },
    sheet: { type: 'string' },
    check: { type: 'boolean', default: false },
  },
})

const source = values.source
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(source)) {
  throw new Error(`--source must be a slug, got "${source}"`)
}
const dataDir = path.join(ROOT, 'data', 'imports', source)
const input = path.resolve(values.input ?? path.join(dataDir, 'source.xlsx'))

const sheets = readWorkbook(await readFile(input))
const sheet = values.sheet ? sheets.find((item) => item.name === values.sheet) : sheets[0]
if (!sheet) throw new Error(`Sheet "${values.sheet}" not found in ${input}`)

let translations = {}
try {
  translations = JSON.parse(await readFile(path.join(dataDir, 'translations.json'), 'utf8'))
} catch (error) {
  if (error?.code !== 'ENOENT') throw error
}

const result = buildImport(sheet, { translations })
const summary = `${result.dataRows} filas leídas · ${result.records.length} importadas · ${result.rejected.length} rechazadas`
const relativeInput = path.relative(ROOT, input).split(path.sep).join('/')

console.log(`${relativeInput} → hoja "${sheet.name}" (cabecera en la fila ${result.headerRow})`)
console.log(summary)
for (const item of result.rejected) console.log(`  ✗ fila ${item.row}: ${item.reason}`)
if (result.untranslated.length) {
  console.log(`  ! ${result.untranslated.length} especialidades sin traducción completa`)
}

if (!values.check) {
  const sqlFile = path.join(ROOT, 'supabase', 'imports', `${source}.sql`)
  const reportFile = path.join(dataDir, 'report.md')
  await writeFile(
    sqlFile,
    renderSql({ source, inputName: relativeInput, records: result.records, summary }),
  )
  await writeFile(
    reportFile,
    renderReport({
      source,
      inputName: relativeInput,
      result,
      generatedAt: new Date().toISOString().slice(0, 10),
    }),
  )
  console.log(`Escrito ${path.relative(ROOT, sqlFile)} y ${path.relative(ROOT, reportFile)}`)
}
