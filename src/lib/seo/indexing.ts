import { MIN_PLACES_FOR_INDEXABLE_COLLECTION } from '@/config/seo'

export interface RobotsDirective {
  index: boolean
  follow: boolean
}

export type PageKind =
  'home' | 'destination' | 'collection' | 'landing' | 'place' | 'search' | 'about' | 'legal'

export interface IndexingInput {
  kind: PageKind
  /** Global gate: ALLOW_INDEXING=true and real (Supabase) data. */
  siteIndexable: boolean
  /** User-applied filters, sorting or keyword on top of the page context. */
  hasRefinements?: boolean
  /** False when the main content is a fallback from another locale. */
  contentTranslated?: boolean
  isDemo?: boolean
  /**
   * Place page without editorial content of its own (no full description):
   * served, but not indexed, so imports never create thin pages for SEO.
   */
  thinContent?: boolean
  /** `landing_pages.is_indexable`. */
  editorialIndexable?: boolean
  /** Places in the collection (collections and destinations). */
  placeCount?: number
}

const NOINDEX_FOLLOW: RobotsDirective = { index: false, follow: true }
const INDEX_FOLLOW: RobotsDirective = { index: true, follow: true }

/**
 * Index/noindex policy. Documented in docs/ARCHITECTURE.md → "Indexing strategy".
 * Order matters: the first matching rule wins.
 */
export function resolveIndexing(input: IndexingInput): RobotsDirective {
  if (!input.siteIndexable) return { index: false, follow: false }
  if (input.kind === 'search' || input.kind === 'legal') return NOINDEX_FOLLOW
  if (input.hasRefinements) return NOINDEX_FOLLOW
  if (input.isDemo) return NOINDEX_FOLLOW
  if (input.thinContent) return NOINDEX_FOLLOW
  if (input.contentTranslated === false) return NOINDEX_FOLLOW
  if (input.kind === 'landing' && input.editorialIndexable !== true) return NOINDEX_FOLLOW
  if (
    (input.kind === 'collection' || input.kind === 'landing') &&
    (input.placeCount ?? 0) < MIN_PLACES_FOR_INDEXABLE_COLLECTION
  ) {
    return NOINDEX_FOLLOW
  }
  if (input.kind === 'destination' && (input.placeCount ?? 0) === 0) return NOINDEX_FOLLOW
  return INDEX_FOLLOW
}
