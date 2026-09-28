import type { QueryValue } from '@/lib/routing/paths'
import { parseSearchState, type RawSearchParams } from '@/features/search/params'

/**
 * Filters of the "Comer y beber" directory, encoded in the URL so searches
 * can be shared and survive back/forward navigation:
 *   ?destination=salou&type=tapas_bar&q=vermut&page=2
 */
export interface DirectoryState {
  /** Destination slug in any locale (resolved by the destination API). */
  destination: string | null
  /** Place type code, e.g. `cafe`. */
  type: string | null
  /** Free text: name, locality or specialty. */
  q: string | null
  page: number
}

/** Same lenient validation as the search page; unrelated params are ignored. */
export function parseDirectoryState(raw: RawSearchParams): DirectoryState {
  const { destination, type, q, page } = parseSearchState(raw)
  return { destination, type, q, page }
}

/** Query for a directory URL; `page` 1 and empty values are dropped. */
export function directoryQuery(state: DirectoryState): Record<string, QueryValue> {
  return {
    destination: state.destination,
    type: state.type,
    q: state.q,
    page: state.page > 1 ? state.page : null,
  }
}

export function hasDirectoryFilters(state: DirectoryState): boolean {
  return state.destination !== null || state.type !== null || state.q !== null
}
