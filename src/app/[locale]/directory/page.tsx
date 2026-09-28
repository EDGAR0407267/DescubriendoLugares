import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { X } from 'lucide-react'
import { locales, type Locale } from '@/config/i18n'
import {
  directoryQuery,
  hasDirectoryFilters,
  parseDirectoryState,
  type DirectoryState,
} from '@/features/directory/state'
import { getDestination, listDestinations } from '@/features/destinations/queries'
import { searchPlaces } from '@/features/places/queries'
import { pageOffset, PAGE_SIZE, totalPages } from '@/features/search/params'
import { listPlaceTypes } from '@/features/taxonomy/queries'
import { getServerEnv } from '@/lib/env'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { format, plural } from '@/lib/i18n/format'
import { assertLocale } from '@/lib/i18n/params'
import { buildLanguageLinks, pathsForAllLocales } from '@/lib/routing/language-links'
import { directoryPath, homePath } from '@/lib/routing/paths'
import { resolveIndexing } from '@/lib/seo/indexing'
import { buildMetadata, type LocalizedPaths } from '@/lib/seo/metadata'
import { DirectoryFilters } from '@/components/directory/directory-filters'
import { SiteHeader } from '@/components/layout/site-header'
import { PlaceGrid } from '@/components/places/place-grid'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { ButtonLink } from '@/components/ui/button-link'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'

type Props = PageProps<'/[locale]/directory'>

/**
 * "Comer y beber": every published place, searchable by name, locality and
 * specialty and filterable by locality and type. The clean URL (and its clean
 * pagination) is an indexable hub; any filter combination is noindex with a
 * canonical to the clean URL, so filters never create crawlable page sets.
 */
async function load(props: Props) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams])
  const locale = assertLocale(params.locale)
  const state = parseDirectoryState(searchParams)
  const [destination, placeTypes] = await Promise.all([
    state.destination ? getDestination(locale, state.destination) : null,
    listPlaceTypes(locale),
  ])
  const activeType = placeTypes.some((type) => type.code === state.type && type.placeCount > 0)
    ? state.type
    : null
  const result = await searchPlaces(locale, {
    destinationId: destination?.id ?? null,
    placeType: activeType,
    text: state.q,
    sort: 'name',
    limit: PAGE_SIZE,
    offset: pageOffset(state.page),
  })
  const pages = totalPages(result.total)
  if (result.total > 0 && state.page > pages) notFound()
  return { locale, state, destination, activeType, placeTypes, result, pages }
}

function languagePaths(
  state: DirectoryState,
  destinationSlugs: Partial<Record<Locale, string>> | null,
): LocalizedPaths {
  return Object.fromEntries(
    locales.map((target) => [
      target,
      directoryPath(
        target,
        directoryQuery({
          ...state,
          destination: destinationSlugs?.[target] ?? null,
          page: 1,
        }),
      ),
    ]),
  )
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, state, result } = await load(props)
  const dict = await getDictionary(locale)
  const env = getServerEnv()
  const refined = hasDirectoryFilters(state)
  const clean = !refined && state.page === 1
  return buildMetadata(
    {
      locale,
      title: dict.directory.metaTitle,
      description: dict.directory.metaDescription,
      path: directoryPath(locale, refined ? {} : { page: state.page > 1 ? state.page : null }),
      alternates: clean ? pathsForAllLocales((target) => directoryPath(target)) : {},
      robots: resolveIndexing({
        kind: 'collection',
        siteIndexable: env.allowIndexing,
        hasRefinements: refined,
        placeCount: result.total,
      }),
    },
    env.siteUrl,
  )
}

export default async function DirectoryPage(props: Props) {
  const { locale, state, destination, activeType, placeTypes, result, pages } = await load(props)
  const env = getServerEnv()
  const [dict, destinations] = await Promise.all([getDictionary(locale), listDestinations(locale)])
  const t = dict.directory
  const path = directoryPath(locale)
  const filtered = hasDirectoryFilters(state)
  // Links keep the destination in this locale's spelling of its slug.
  const current: DirectoryState = {
    ...state,
    destination: destination?.slug ?? null,
    type: activeType,
  }

  return (
    <>
      <SiteHeader
        locale={locale}
        languageLinks={buildLanguageLinks(languagePaths(current, destination?.slugs ?? null))}
      />
      <Breadcrumbs
        label={dict.breadcrumbs.label}
        siteUrl={env.siteUrl}
        items={[
          { name: dict.breadcrumbs.home, path: homePath(locale) },
          { name: t.title, path },
        ]}
      />
      <main id="main" className="container-page pt-5 md:pt-8">
        <header className="max-w-3xl">
          <h1 className="heading-display text-[clamp(30px,4vw,52px)] text-ink">{t.title}</h1>
          <p className="mt-2.5 text-[17px] leading-normal text-muted">{t.intro}</p>
        </header>

        <div className="mt-8">
          <DirectoryFilters
            locale={locale}
            dict={dict}
            state={current}
            activeDestinationId={destination?.id ?? null}
            activeType={activeType}
            destinations={destinations}
            placeTypes={placeTypes.filter((type) => type.placeCount > 0)}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p role="status" className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <strong className="font-semibold text-ink">
              {plural(locale, result.total, t.results)}
            </strong>
            {state.q ? (
              <>
                <span>{format(t.forQuery, { query: state.q })}</span>
                <Link
                  href={directoryPath(locale, directoryQuery({ ...current, q: null, page: 1 }))}
                  scroll={false}
                  aria-label={format(t.removeQuery, { query: state.q })}
                  className="inline-flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-sunken"
                >
                  <X aria-hidden className="size-4" />
                </Link>
              </>
            ) : null}
          </p>
          {filtered ? (
            <Link
              href={path}
              scroll={false}
              className="link-underline inline-flex min-h-11 items-center text-sm font-medium text-ink"
            >
              {t.clear}
            </Link>
          ) : null}
        </div>

        <div className="mt-6">
          {result.items.length > 0 ? (
            <PlaceGrid places={result.items} locale={locale} dict={dict} />
          ) : (
            <EmptyState
              title={t.emptyTitle}
              description={t.emptyText}
              action={
                filtered ? (
                  <ButtonLink href={path} variant="secondary">
                    {t.showAll}
                  </ButtonLink>
                ) : null
              }
            />
          )}
        </div>

        <Pagination
          dict={dict}
          page={state.page}
          totalPages={pages}
          hrefForPage={(page) => directoryPath(locale, directoryQuery({ ...current, page }))}
        />

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-subtle">{t.notice}</p>
      </main>
    </>
  )
}
