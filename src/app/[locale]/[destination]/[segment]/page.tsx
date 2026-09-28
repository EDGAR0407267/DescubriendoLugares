import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { collectionDescription, loadCollection, type Collection } from '@/features/collections/load'
import { getCollectionResults, type CollectionResults } from '@/features/collections/results'
import { getTypeInNearbyDestinations } from '@/features/destinations/nearby'
import { parseSearchState, toQuery } from '@/features/search/params'
import { listCategories, listFeatures, listPlaceTypes } from '@/features/taxonomy/queries'
import { getServerEnv } from '@/lib/env'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { format, formatDate, plural } from '@/lib/i18n/format'
import { assertLocale } from '@/lib/i18n/params'
import { buildLanguageLinks } from '@/lib/routing/language-links'
import {
  buildQueryString,
  destinationPath,
  destinationSectionPath,
  homePath,
  placePath,
} from '@/lib/routing/paths'
import { destinationTrail } from '@/lib/seo/breadcrumbs'
import { listNames } from '@/lib/seo/copy'
import { resolveIndexing } from '@/lib/seo/indexing'
import { itemListSchema, webPageSchema } from '@/lib/seo/json-ld'
import { buildMetadata } from '@/lib/seo/metadata'
import { toParagraphs } from '@/lib/utils/text'
import { PlaceTypeNav } from '@/components/destinations/place-type-nav'
import { SiteHeader } from '@/components/layout/site-header'
import { PlaceGrid } from '@/components/places/place-grid'
import { SearchFilters } from '@/components/search/search-filters'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JsonLdScript } from '@/components/seo/json-ld'
import { RelatedLinks } from '@/components/seo/related-links'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'

type Props = PageProps<'/[locale]/[destination]/[segment]'>

/** Only the page component redirects (see the destination page). */
async function load(props: Props, { redirect }: { redirect: boolean }) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams])
  const locale = assertLocale(params.locale)
  const dict = await getDictionary(locale)
  const lookup = await loadCollection(locale, dict, params.destination, params.segment)
  if (lookup.status === 'not_found') notFound()
  if (lookup.status === 'redirect') {
    if (redirect) permanentRedirect(lookup.path)
    return null
  }

  const collection = lookup.collection
  const state = parseSearchState(searchParams)
  const results = await getCollectionResults(locale, collection, state)
  if (results.page > results.totalPages) notFound()
  return { locale, dict, collection, state, results }
}

function canonicalPath(collection: Collection, results: CollectionResults): string {
  if (results.refined || results.page === 1) return collection.path
  return `${collection.path}${buildQueryString({ page: results.page })}`
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const loaded = await load(props, { redirect: false })
  if (!loaded) return {}
  const { locale, collection, results } = loaded
  const env = getServerEnv()
  const isFirstCleanPage = !results.refined && results.page === 1
  const names = listNames(
    locale,
    results.result.items.map((place) => place.name),
    results.result.total,
  )
  return buildMetadata(
    {
      locale,
      title: collection.metaTitle,
      description: collectionDescription(collection, names),
      path: canonicalPath(collection, results),
      alternates: isFirstCleanPage ? collection.alternates : {},
      robots: resolveIndexing({
        kind: collection.curated ? 'landing' : 'collection',
        siteIndexable: env.allowIndexing,
        hasRefinements: results.refined,
        editorialIndexable: collection.editorialIndexable,
        contentTranslated: collection.contentTranslated,
        placeCount: results.result.total,
      }),
      image: collection.destination.imageUrl
        ? { url: collection.destination.imageUrl, alt: collection.destination.name }
        : null,
      ogType: collection.curated ? 'article' : 'website',
    },
    env.siteUrl,
  )
}

export default async function CollectionPage(props: Props) {
  const loaded = await load(props, { redirect: true })
  if (!loaded) notFound()
  const { locale, dict, collection, state, results } = loaded
  const env = getServerEnv()
  const { destination } = collection
  // Only lists ordered by real ranking signals may present themselves as such.
  const ranked = results.result.items.some((place) => place.isRanked)
  const [features, categories, placeTypes, typeElsewhere] = await Promise.all([
    collection.curated ? [] : listFeatures(locale),
    collection.curated ? [] : listCategories(locale, destination.id),
    listPlaceTypes(locale, destination.id),
    collection.kind === 'place_type' && collection.placeTypeCode
      ? getTypeInNearbyDestinations(locale, destination, collection.placeTypeCode)
      : [],
  ])
  const pageUrl = `${env.siteUrl}${collection.path}`
  const listedTypes = placeTypes.filter((type) => type.hasListingPage)
  const crumbs = [
    ...destinationTrail(locale, dict, destination),
    { name: collection.title, path: collection.path },
  ]

  return (
    <>
      <SiteHeader
        locale={locale}
        languageLinks={buildLanguageLinks(collection.alternates, (target) =>
          destination.slugs[target]
            ? destinationPath(target, destination.slugs[target])
            : homePath(target),
        )}
      />
      <Breadcrumbs label={dict.breadcrumbs.label} siteUrl={env.siteUrl} items={crumbs} />
      <main id="main" className="container-page pt-5 md:pt-8">
        <header className="max-w-3xl">
          <h1 className="heading-display text-[clamp(30px,4vw,52px)] text-ink">
            {collection.title}
          </h1>
          {collection.intro ? (
            <p className="mt-2.5 text-[17px] leading-normal text-muted">{collection.intro}</p>
          ) : null}
          {collection.curated && collection.updatedAt ? (
            <p className="mt-3 text-[13px] text-subtle">
              <time dateTime={collection.updatedAt}>
                {format(dict.common.updatedOn, { date: formatDate(locale, collection.updatedAt) })}
              </time>
            </p>
          ) : null}
        </header>

        {collection.kind === 'place_type' ? (
          <PlaceTypeNav
            locale={locale}
            destinationSlug={destination.slug}
            label={format(dict.destination.sections, { name: destination.name })}
            allLabel={dict.destination.allPlaces}
            totalCount={destination.placeCount}
            types={placeTypes}
            activeCode={collection.placeTypeCode}
            className="mt-6"
          />
        ) : null}

        {!collection.curated ? (
          <div className="mt-8">
            <SearchFilters
              dict={dict}
              action={collection.path}
              state={state}
              features={features}
              categories={collection.kind === 'category' ? [] : categories}
            />
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-sm text-muted" aria-live="polite">
            <strong className="font-semibold text-ink">
              {plural(locale, results.result.total, dict.search.results)}
            </strong>{' '}
            · {ranked ? dict.listing.sortedBy : dict.listing.unranked}
          </p>
        </div>

        <div className="mt-6">
          {results.result.items.length > 0 ? (
            <PlaceGrid places={results.result.items} locale={locale} dict={dict} />
          ) : (
            <EmptyState title={dict.search.noResults} description={dict.search.noResultsHint} />
          )}
        </div>

        <Pagination
          dict={dict}
          page={results.page}
          totalPages={results.totalPages}
          hrefForPage={(page) =>
            `${collection.path}${buildQueryString(toQuery({ ...state, page }, ['destination', 'type']))}`
          }
        />

        <p className="mt-10 text-xs text-subtle">
          {ranked ? dict.listing.organicNotice : dict.listing.unrankedNotice}
        </p>

        {collection.body ? (
          <section className="mt-14 max-w-[760px] space-y-3.5 border-t border-line-soft pt-10 text-base leading-[1.65] text-pretty text-ink-soft">
            {toParagraphs(collection.body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ) : null}

        {/* Type listings already show these as the chip nav above. */}
        {collection.kind !== 'place_type' ? (
          <RelatedLinks
            id="explore-destination"
            title={format(dict.listing.exploreDestination, { destination: destination.name })}
            links={listedTypes.map((type) => ({
              href: destinationSectionPath(locale, destination.slug, type.slug),
              label: format(dict.listing.placeTypeTitle, {
                type: type.pluralName,
                destination: destination.name,
              }),
              count: type.placeCount,
            }))}
          />
        ) : null}

        <RelatedLinks
          id="other-destinations"
          title={dict.listing.otherDestinations}
          links={typeElsewhere.map((item) => ({
            href: destinationSectionPath(locale, item.destination.slug, item.slug),
            label: format(dict.listing.placeTypeTitle, {
              type: item.pluralName,
              destination: item.destination.name,
            }),
            count: item.count,
          }))}
        />
      </main>
      <JsonLdScript
        data={[
          webPageSchema({
            type: 'CollectionPage',
            url: pageUrl,
            name: collection.title,
            description: collection.intro,
            locale,
            siteUrl: env.siteUrl,
            about: {
              '@id': `${env.siteUrl}${destinationPath(locale, destination.slug)}#destination`,
            },
            dateModified: collection.updatedAt,
            mainEntity:
              results.result.items.length > 0
                ? itemListSchema({
                    name: collection.title,
                    items: results.result.items.map((place) => ({
                      name: place.name,
                      url: `${env.siteUrl}${placePath(locale, place.destination.slug, place.placeTypeSlug, place.slug)}`,
                    })),
                  })
                : null,
          }),
        ]}
      />
    </>
  )
}
