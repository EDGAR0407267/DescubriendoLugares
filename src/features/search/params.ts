import { z } from 'zod'
import type { PriceLevel } from '@/lib/db/contracts'
import type { QueryValue } from '@/lib/routing/paths'
import { sortOptions, type SortOption } from '@/features/places/types'

export const PAGE_SIZE = 24
export const MAX_PAGE = 100

export type RawSearchParams = Record<string, string | string[] | undefined>

/**
 * Filter state encoded in the URL, e.g. `?price=2&feature=terrace&page=2`.
 * URLs are the single source of truth so results are shareable and work
 * without client-side JavaScript.
 */
export interface SearchState {
  /** Destination slug (search page only; listings get it from the path). */
  destination: string | null
  /** Place type code, e.g. `restaurant`. */
  type: string | null
  /** Localized category slug. */
  category: string | null
  price: PriceLevel[]
  features: string[]
  q: string | null
  sort: SortOption
  page: number
}

const code = z.string().regex(/^[a-z][a-z0-9_]{0,63}$/)
const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(120)
const priceLevel = z.coerce
  .number()
  .pipe(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]))

function values(raw: string | string[] | undefined): string[] {
  const list = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]
  return list
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)
}

function first<T>(raw: string | string[] | undefined, schema: z.ZodType<T>): T | null {
  const [value] = values(raw)
  if (value === undefined) return null
  const parsed = schema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function unique<T>(schema: z.ZodType<T>, raw: string | string[] | undefined, max: number): T[] {
  const result: T[] = []
  for (const value of values(raw)) {
    const parsed = schema.safeParse(value)
    if (parsed.success && !result.includes(parsed.data)) result.push(parsed.data)
    if (result.length === max) break
  }
  return result
}

/** Free text keeps its commas ("café, helados"); only list params are split. */
function text(raw: string | string[] | undefined, maxLength: number): string | null {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.replace(/\s+/g, ' ').trim()
  return value && value.length <= maxLength ? value : null
}

/** Lenient parser: invalid values are ignored instead of producing errors. */
export function parseSearchState(raw: RawSearchParams): SearchState {
  const page = first(raw.page, z.coerce.number().int().min(1).max(MAX_PAGE)) ?? 1
  return {
    destination: first(raw.destination, slug),
    type: first(raw.type, code),
    category: first(raw.category, slug),
    price: unique(priceLevel, raw.price, 4).sort(),
    features: unique(code, raw.feature, 12).sort(),
    q: text(raw.q, 80),
    sort: first(raw.sort, z.enum(sortOptions)) ?? 'ranking',
    page,
  }
}

type SearchStateKey = keyof SearchState

/** Serializes to URL query values, omitting defaults and the given keys. */
export function toQuery(
  state: SearchState,
  omit: readonly SearchStateKey[] = [],
): Record<string, QueryValue> {
  const query: Record<string, QueryValue> = {
    destination: state.destination,
    type: state.type,
    category: state.category,
    price: state.price,
    feature: state.features,
    q: state.q,
    sort: state.sort === 'ranking' ? null : state.sort,
    page: state.page > 1 ? state.page : null,
  }
  for (const key of omit) {
    delete query[key === 'features' ? 'feature' : key]
  }
  return query
}

/**
 * True when the user narrowed or reordered results beyond the page's own
 * context. Refined result sets are not indexable (see lib/seo/indexing.ts).
 */
export function hasRefinements(
  state: SearchState,
  context: readonly SearchStateKey[] = [],
): boolean {
  const is = (key: SearchStateKey) => !context.includes(key)
  return (
    (is('destination') && state.destination !== null) ||
    (is('type') && state.type !== null) ||
    (is('category') && state.category !== null) ||
    state.price.length > 0 ||
    state.features.length > 0 ||
    state.q !== null ||
    state.sort !== 'ranking'
  )
}

export function pageOffset(page: number, pageSize = PAGE_SIZE): number {
  return (page - 1) * pageSize
}

export function totalPages(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.min(MAX_PAGE, Math.ceil(total / pageSize)))
}
