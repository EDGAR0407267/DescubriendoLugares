import type { Metadata } from 'next'
import { Suspense } from 'react'
import type { Locale } from '@/config/i18n'
import { getDestination, listDestinations } from '@/features/destinations/queries'
import { searchPlaces } from '@/features/places/queries'
import {
  pageOffset,
  PAGE_SIZE,
  parseSearchState,
  toQuery,
  totalPages,
  type SearchState,
} from '@/features/search/params'
import { listCategories, listFeatures, listPlaceTypes } from '@/features/taxonomy/queries'
import { getServerEnv } from '@/lib/env'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { plural } from '@/lib/i18n/format'
import { assertLocale } from '@/lib/i18n/params'
import type { Dictionary } from '@/lib/i18n/types'
import { buildLanguageLinks, pathsForAllLocales } from '@/lib/routing/language-links'
import { searchPath } from '@/lib/routing/paths'
import { resolveIndexing } from '@/lib/seo/indexing'
import { buildMetadata } from '@/lib/seo/metadata'
import { SiteHeader } from '@/components/layout/site-header'
import { PlaceGrid } from '@/components/places/place-grid'
import { SearchFilters } from '@/components/search/search-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Pagination } from '@/components/ui/pagination'

type Props = PageProps<'/[locale]/search'>

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = assertLocale((await props.params).locale)
  const dict = await getDictionary(locale)
  const env = getServerEnv()
  return buildMetadata(
    {
      locale,
      title: dict.search.metaTitle,
      description: dict.search.metaDescription,
      path: searchPath(locale),
      robots: resolveIndexing({ kind: 'search', siteIndexable: env.allowIndexing }),
    },
    env.siteUrl,
  )
}

async function SearchResults({
  locale,
  dict,
  state,
}: {
  locale: Locale
  dict: Dictionary
  state: SearchState
}) {
  const [destination, categories, placeTypes] = await Promise.all([
    state.destination ? getDestination(locale, state.destination) : null,
    listCategories(locale),
    listPlaceTypes(locale),
  ])
  const result = await searchPlaces(locale, {
    destinationId: destination?.id ?? null,
    placeType: placeTypes.some((type) => type.code === state.type) ? state.type : null,
    categoryId: categories.find((category) => category.slug === state.category)?.id ?? null,
    features: state.features,
    priceLevels: state.price,
    text: state.q,
    sort: state.sort,
    limit: PAGE_SIZE,
    offset: pageOffset(state.page),
  })

  return (
    <>
      <p className="text-sm text-muted" aria-live="polite">
        {plural(locale, result.total, dict.search.results)}
      </p>
      <div className="mt-6">
        {result.items.length > 0 ? (
          <PlaceGrid places={result.items} locale={locale} dict={dict} showDestination />
        ) : (
          <EmptyState title={dict.search.noResults} description={dict.search.noResultsHint} />
        )}
      </div>
      <Pagination
        dict={dict}
        page={state.page}
        totalPages={totalPages(result.total)}
        hrefForPage={(page) => searchPath(locale, toQuery({ ...state, page }))}
      />
    </>
  )
}

export default async function SearchPage(props: Props) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams])
  const locale = assertLocale(params.locale)
  const state = parseSearchState(searchParams)
  const [dict, destinations, placeTypes, features, categories] = await Promise.all([
    getDictionary(locale),
    listDestinations(locale),
    listPlaceTypes(locale),
    listFeatures(locale),
    listCategories(locale),
  ])
  // Category and destination slugs are localized, so only locale-neutral
  // filters carry over when switching language.
  const neutralQuery = toQuery(state, ['category', 'destination', 'page'])

  return (
    <>
      <SiteHeader
        locale={locale}
        languageLinks={buildLanguageLinks(
          pathsForAllLocales((target) => searchPath(target, neutralQuery)),
        )}
      />
      <main id="main" className="container-page pt-8 md:pt-12">
        <h1 className="heading-display text-[clamp(30px,4vw,52px)] text-ink">
          {dict.search.title}
        </h1>
        <div className="mt-8">
          <SearchFilters
            dict={dict}
            action={searchPath(locale)}
            state={state}
            features={features}
            categories={categories.filter((category) => category.placeCount > 0)}
            destinations={destinations}
            placeTypes={placeTypes.filter((type) => type.placeCount > 0)}
            showKeyword
          />
        </div>
        <div className="mt-8">
          <Suspense
            key={JSON.stringify(state)}
            fallback={<LoadingState label={dict.common.loading} />}
          >
            <SearchResults locale={locale} dict={dict} state={state} />
          </Suspense>
        </div>
      </main>
    </>
  )
}
