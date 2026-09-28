/**
 * Minimal, dependency-free .xlsx reader for import scripts (Node only).
 *
 * An .xlsx file is a ZIP of XML parts. This reader extracts the parts it
 * needs with node:zlib and parses them with narrow regular expressions, which
 * is enough for the tabular sheets we import. It returns cell text *and* the
 * hyperlink target of each cell: spreadsheets often show a label ("Abrir
 * Google Maps") while the URL lives in the sheet's relationship part.
 */
import { inflateRawSync } from 'node:zlib'

const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_SIGNATURE = 0x02014b50
const LOCAL_SIGNATURE = 0x04034b50

/**
 * @param {Buffer} buffer
 * @returns {Map<string, Buffer>} entry name → uncompressed bytes
 */
export function readZip(buffer) {
  let eocd = -1
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65_557); offset--) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) {
      eocd = offset
      break
    }
  }
  if (eocd < 0) throw new Error('Not a ZIP/XLSX file (end of central directory not found)')

  const entryCount = buffer.readUInt16LE(eocd + 10)
  let pointer = buffer.readUInt32LE(eocd + 16)
  const entries = new Map()

  for (let index = 0; index < entryCount; index++) {
    if (buffer.readUInt32LE(pointer) !== CENTRAL_SIGNATURE) {
      throw new Error('Corrupt ZIP central directory')
    }
    const method = buffer.readUInt16LE(pointer + 10)
    const compressedSize = buffer.readUInt32LE(pointer + 20)
    const nameLength = buffer.readUInt16LE(pointer + 28)
    const extraLength = buffer.readUInt16LE(pointer + 30)
    const commentLength = buffer.readUInt16LE(pointer + 32)
    const localOffset = buffer.readUInt32LE(pointer + 42)
    const name = buffer.toString('utf8', pointer + 46, pointer + 46 + nameLength)
    pointer += 46 + nameLength + extraLength + commentLength

    if (buffer.readUInt32LE(localOffset) !== LOCAL_SIGNATURE) {
      throw new Error(`Corrupt ZIP local header for ${name}`)
    }
    const dataStart =
      localOffset +
      30 +
      buffer.readUInt16LE(localOffset + 26) +
      buffer.readUInt16LE(localOffset + 28)
    const data = buffer.subarray(dataStart, dataStart + compressedSize)
    if (method === 0) entries.set(name, Buffer.from(data))
    else if (method === 8) entries.set(name, inflateRawSync(data))
    else throw new Error(`Unsupported ZIP compression method ${method} for ${name}`)
  }
  return entries
}

/** Decodes XML entities and OOXML `_xHHHH_` escapes. */
export function decodeXml(text) {
  return text
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
      const lower = entity.toLowerCase()
      if (lower === 'amp') return '&'
      if (lower === 'lt') return '<'
      if (lower === 'gt') return '>'
      if (lower === 'quot') return '"'
      if (lower === 'apos') return "'"
      const code = lower.startsWith('#x')
        ? parseInt(lower.slice(2), 16)
        : parseInt(lower.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    })
    .replace(/_x([0-9a-f]{4})_/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

/** Element regex tolerant to namespace prefixes (`<x:row>`, `<row>`). */
function elements(xml, tag) {
  const pattern = new RegExp(
    `<(?:[\\w-]+:)?${tag}\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>)`,
    'g',
  )
  return [...xml.matchAll(pattern)].map((match) => ({
    attributes: match[1] ?? '',
    body: match[2] ?? '',
  }))
}

/** Reads an attribute; `prefixed` matches namespaced ones such as `r:id`. */
function attribute(attributes, name, { prefixed = false } = {}) {
  const pattern = prefixed
    ? new RegExp(`\\s[\\w-]+:${name}="([^"]*)"`)
    : new RegExp(`(?:^|\\s)${name}="([^"]*)"`)
  const match = attributes.match(pattern)
  return match ? decodeXml(match[1]) : null
}

/** Concatenated text of all <t> runs (rich text included, phonetic runs excluded). */
function textRuns(xml) {
  const withoutPhonetic = xml.replace(/<(?:[\w-]+:)?rPh\b[\s\S]*?<\/(?:[\w-]+:)?rPh>/g, '')
  return elements(withoutPhonetic, 't')
    .map((element) => decodeXml(element.body))
    .join('')
}

function relationships(xml) {
  const map = new Map()
  for (const element of elements(xml, 'Relationship')) {
    const id = attribute(element.attributes, 'Id')
    if (id) {
      map.set(id, {
        target: attribute(element.attributes, 'Target') ?? '',
        external: attribute(element.attributes, 'TargetMode') === 'External',
      })
    }
  }
  return map
}

/** Resolves a relationship target against the directory of the source part. */
function resolvePart(fromPart, target) {
  if (target.startsWith('/')) return target.slice(1)
  const parts = fromPart.split('/').slice(0, -1)
  for (const segment of target.split('/')) {
    if (segment === '..') parts.pop()
    else if (segment !== '.') parts.push(segment)
  }
  return parts.join('/')
}

function relsPathFor(part) {
  const segments = part.split('/')
  const file = segments.pop()
  return [...segments, '_rels', `${file}.rels`].join('/')
}

/** "AB12" → { column: 28, row: 12 } (1-based). */
export function parseCellRef(ref) {
  const match = /^([A-Z]+)(\d+)$/.exec(ref)
  if (!match) return null
  let column = 0
  for (const char of match[1]) column = column * 26 + (char.charCodeAt(0) - 64)
  return { column, row: Number(match[2]) }
}

export function columnName(column) {
  let name = ''
  for (let value = column; value > 0; value = Math.floor((value - 1) / 26)) {
    name = String.fromCharCode(65 + ((value - 1) % 26)) + name
  }
  return name
}

/**
 * @typedef {{ ref: string, text: string, hyperlink: string | null }} Cell
 * @typedef {{ number: number, cells: Map<number, Cell> }} Row
 * @typedef {{ name: string, rows: Row[] }} Sheet
 */

/**
 * Reads every worksheet of a workbook.
 * @param {Buffer} buffer
 * @returns {Sheet[]}
 */
export function readWorkbook(buffer) {
  const zip = readZip(buffer)
  const read = (part) => {
    const data = zip.get(part)
    return data ? data.toString('utf8') : null
  }

  const workbookPart = 'xl/workbook.xml'
  const workbookXml = read(workbookPart)
  if (!workbookXml) throw new Error('Invalid XLSX: xl/workbook.xml is missing')
  const workbookRels = relationships(read(relsPathFor(workbookPart)) ?? '')

  const sharedStringsXml = read('xl/sharedStrings.xml')
  const sharedStrings = sharedStringsXml
    ? elements(sharedStringsXml, 'si').map((element) => textRuns(element.body))
    : []

  return elements(workbookXml, 'sheet').map((sheetElement) => {
    const name = attribute(sheetElement.attributes, 'name') ?? 'Sheet'
    const relId = attribute(sheetElement.attributes, 'id', { prefixed: true })
    const rel = relId ? workbookRels.get(relId) : undefined
    if (!rel) throw new Error(`Invalid XLSX: sheet "${name}" has no part`)
    const sheetPart = resolvePart(workbookPart, rel.target)
    const sheetXml = read(sheetPart)
    if (!sheetXml) throw new Error(`Invalid XLSX: missing ${sheetPart}`)
    const sheetRels = relationships(read(relsPathFor(sheetPart)) ?? '')

    // Hyperlinks: ref (cell or range) → external URL or internal location.
    const links = new Map()
    for (const element of elements(sheetXml, 'hyperlink')) {
      const ref = attribute(element.attributes, 'ref')
      if (!ref) continue
      const hyperlinkRel = attribute(element.attributes, 'id', { prefixed: true })
      const target = hyperlinkRel
        ? (sheetRels.get(hyperlinkRel)?.target ?? null)
        : attribute(element.attributes, 'location')
      if (!target) continue
      const [start, end = start] = ref.split(':')
      const from = parseCellRef(start)
      const to = parseCellRef(end)
      if (!from || !to) continue
      for (let row = from.row; row <= to.row; row++) {
        for (let column = from.column; column <= to.column; column++) {
          links.set(`${columnName(column)}${row}`, target)
        }
      }
    }

    const rows = elements(sheetXml, 'row').map((rowElement) => {
      const number = Number(attribute(rowElement.attributes, 'r'))
      const cells = new Map()
      for (const cellElement of elements(rowElement.body, 'c')) {
        const ref = attribute(cellElement.attributes, 'r')
        const position = ref ? parseCellRef(ref) : null
        if (!ref || !position) continue
        const type = attribute(cellElement.attributes, 't')
        const value = elements(cellElement.body, 'v')[0]
        let text = ''
        if (type === 's') text = sharedStrings[Number(value?.body)] ?? ''
        else if (type === 'inlineStr') text = textRuns(cellElement.body)
        else if (type === 'b') text = value?.body === '1' ? 'TRUE' : 'FALSE'
        else text = value ? decodeXml(value.body) : ''
        cells.set(position.column, { ref, text, hyperlink: links.get(ref) ?? null })
      }
      return { number, cells }
    })
    return { name, rows }
  })
}
