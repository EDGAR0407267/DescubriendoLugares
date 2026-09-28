/**
 * Typed catalogue of the SQL read API. Function and argument names are a
 * closed set checked at compile time, and the embedded driver re-validates
 * them at runtime before building SQL.
 */
interface LocaleArgs {
  p_locale: string
  p_fallback: string
}

export interface RpcArgs {
  api_list_destinations: LocaleArgs & { p_featured_only?: boolean }
  api_get_destination: LocaleArgs & { p_slug: string }
  api_get_region: LocaleArgs & { p_slug: string }
  api_list_place_types: LocaleArgs & { p_destination_id?: string | null }
  api_list_features: LocaleArgs
  api_list_categories: LocaleArgs & { p_destination_id?: string | null }
  api_get_category: LocaleArgs & { p_category_id: string; p_destination_id?: string | null }
  api_resolve_destination_segment: { p_locale: string; p_destination_id: string; p_segment: string }
  api_get_landing_page: { p_locale: string; p_landing_page_id: string }
  api_list_landing_pages: { p_locale: string; p_destination_id: string; p_featured_only?: boolean }
  api_search_places: LocaleArgs & {
    p_destination_id?: string | null
    p_place_type?: string | null
    p_category_id?: string | null
    p_features?: string[] | null
    p_price_levels?: number[] | null
    p_query?: string | null
    p_sort?: string
    p_limit?: number
    p_offset?: number
    p_pinned_ids?: string[] | null
    p_exclude_ids?: string[] | null
    p_featured_only?: boolean
  }
  api_get_place: LocaleArgs & { p_destination_id: string; p_slug: string }
  api_nearby_places: LocaleArgs & { p_place_id: string; p_radius_km?: number; p_limit?: number }
  api_sitemap_destinations: Record<string, never>
  api_sitemap_regions: Record<string, never>
  api_sitemap_destination_entries: { p_destination_id: string; p_min_category_places?: number }
}

export type RpcFunction = keyof RpcArgs

export interface RpcClient {
  call<F extends RpcFunction>(fn: F, args: RpcArgs[F]): Promise<unknown>
}

export class DatabaseError extends Error {
  constructor(fn: string, message: string) {
    super(`[db] ${fn}: ${message}`)
    this.name = 'DatabaseError'
  }
}

/** Drops undefined arguments so SQL defaults apply. */
export function definedArgs(args: object): [string, unknown][] {
  return Object.entries(args).filter(([, value]) => value !== undefined)
}
