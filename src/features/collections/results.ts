import 'server-only'
import type { Locale } from '@/config/i18n'
import { searchPlaces } from '@/features/places/queries'
import type { PlaceQuery } from '@/features/places/types'
import {
  hasRefinements,
  pageOffset,
  PAGE_SIZE,
  totalPages,
  type SearchState,
} from '@/features/search/params'
import { listCategories } from '@/features/taxonomy/queries'
import type { PlaceSearchResult } from '@/lib/db/contracts'
import type { Collection } from './load'

export interface CollectionResults {
  result: PlaceSearchResult
  /** User filters/sort applied on top of the collection → not indexable. */
  refined: boolean
  page: number
  totalPages: number
}

/** Applies URL refinements (ignored on curated landing pages) and runs the search. */
export async function getCollectionResults(
  locale: Locale,
  collection: Collection,
  state: SearchState,
): Promise<CollectionResults> {
  if (collection.curated) {
    const result = await searchPlaces(locale, { ...collection.query, limit: collection.limit })
    return { result, refined: false, page: 1, totalPages: 1 }
  }

  const refinedCategoryId =
    !collection.query.categoryId && state.category
      ? ((await listCategories(locale, collection.destination.id)).find(
          (category) => category.slug === state.category,
        )?.id ?? null)
      : null

  const query: PlaceQuery = {
    ...collection.query,
    categoryId: collection.query.categoryId ?? refinedCategoryId,
    features: state.features,
    priceLevels: state.price,
    sort: state.sort,
    limit: PAGE_SIZE,
    offset: pageOffset(state.page),
  }
  const result = await searchPlaces(locale, query)
  return {
    result,
    refined: hasRefinements(state, ['destination', 'type']),
    page: state.page,
    totalPages: totalPages(result.total),
  }
}
