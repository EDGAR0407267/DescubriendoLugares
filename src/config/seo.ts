/**
 * Collections (category pages, place-type listings) with fewer published
 * places than this are served as `noindex, follow` to avoid thin pages.
 */
export const MIN_PLACES_FOR_INDEXABLE_COLLECTION = 3

/** Sitemaps protocol limit per file. */
export const SITEMAP_MAX_URLS = 50_000
