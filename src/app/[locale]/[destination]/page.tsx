import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { locales, type Locale } from '@/config/i18n'
import { getSeoContent } from '@/content/seo'
import { getNearbyDestinations } from '@/features/destinations/nearby'
import { getDestination, listDestinations } from '@/features/destinations/queries'
import { listLandingPages } from '@/features/landing-pages/queries'
import { searchPlaces } from '@/features/places/queries'
import { getRegion, listSitemapRegions } from '@/features/regions/queries'
import { listCategories, listPlaceTypes } from '@/features/taxonomy/queries'
import type { DestinationDetail, RegionDetail } from '@/lib/db/contracts'
import { getServerEnv } from '@/lib/env'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { format, plural } from '@/lib/i18n/format'
import { assertLocale } from '@/lib/i18n/params'
import { buildLanguageLinks } from '@/lib/routing/language-links'
import {
  destinationPath,
  destinationSectionPath,
  directoryPath,
  placePath,
  regionPath,
} from '@/lib/routing/paths'
import { destinationTrail } from '@/lib/seo/breadcrumbs'
import { listNames } from '@/lib/seo/copy'
import { resolveIndexing } from '@/lib/seo/indexing'
import { itemListSchema, touristDestinationSchema, webPageSchema } from '@/lib/seo/json-ld'
import { buildMetadata, type LocalizedPaths } from '@/lib/seo/metadata'
import { CategoryLinks } from '@/components/categories/category-links'
import { DestinationCard } from '@/components/destinations/destination-card'
import { PlaceTypeNav } from '@/components/destinations/place-type-nav'
import { SiteHeader } from '@/components/layout/site-header'
import { PlaceGrid } from '@/components/places/place-grid'
import { RegionView } from '@/components/regions/region-view'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JsonLdScript } from '@/components/seo/json-ld'
import { EmptyState } from '@/components/ui/empty-state'
import { Hero } from '@/components/ui/hero'
import { SectionHeading } from '@/components/ui/section-heading'

export const revalidate = 3600

// Every place of the city up to one page; the directory holds the rest.
const TOP_PLACES = 24

const section = 'container-page pt-14 md:pt-[clamp(56px,7vw,96px)]'

type Props = PageProps<'/[locale]/[destination]'>

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const [destinations, regions] = await Promise.all([
    listDestinations(assertLocale(params.locale)),
    listSitemapRegions(),
  ])
  return [
    ...destinations.map((destination) => ({ destination: destination.slug })),
    ...regions.map((region) => ({ destination: region.slug })),
  ]
}

type Loaded =
  | { kind: 'destination'; locale: Locale; destination: DestinationDetail }
  | { kind: 'region'; locale: Locale; region: RegionDetail }

/**
 * /{locale}/{slug} is a destination (Salou) or a regional hub (Costa
 * Daurada); destinations take precedence. Only the page component redirects
 * non-canonical slugs; redirecting from generateMetadata as well would emit
 * the Location header twice.
 */
async function load(props: Props, { redirect }: { redirect: boolean }): Promise<Loaded> {
  const params = await props.params
  const locale = assertLocale(params.locale)
  const destination = await getDestination(locale, params.destination)
  if (destination) {
    if (redirect && !destination.requestedSlugMatches) {
      permanentRedirect(destinationPath(locale, destination.slug))
    }
    return { kind: 'destination', locale, destination }
  }
  const region = await getRegion(locale, params.destination)
  if (region) return { kind: 'region', locale, region }
  notFound()
}

function localizedPaths(slugs: Partial<Record<Locale, string>>): LocalizedPaths {
  return Object.fromEntries(
    locales.flatMap((locale) =>
      slugs[locale] ? [[locale, destinationPath(locale, slugs[locale])]] : [],
    ),
  )
}

/** Hub destinations with published places, each with its listed types. */
async function regionDestinations(locale: Locale, region: RegionDetail) {
  const withPlaces = region.destinations.filter((destination) => destination.placeCount > 0)
  return Promise.all(
    withPlaces.map(async (destination) => ({
      destination,
      types: (await listPlaceTypes(locale, destination.id)).filter((type) => type.hasListingPage),
    })),
  )
}

async function regionMetadata(locale: Locale, region: RegionDetail): Promise<Metadata> {
  const [copy, env] = [(await getSeoContent(locale)).region, getServerEnv()]
  const withPlaces = region.destinations.filter((destination) => destination.placeCount > 0)
  const names = withPlaces.map((destination) => destination.name)
  return buildMetadata(
    {
      locale,
      title: region.seoTitle ?? format(copy.metaTitle, { region: region.name }),
      description:
        region.seoDescription ??
        format(copy.metaDescription, {
          region: region.name,
          destinations: listNames(locale, names, names.length, names.length),
        }),
      path: regionPath(locale, region.slug),
      // Only translations with editorial text are alternates (others are noindex).
      alternates: Object.fromEntries(
        region.translatedLocales.map((target) => [target, regionPath(target, region.slug)]),
      ),
      robots: resolveIndexing({
        kind: 'destination',
        siteIndexable: env.allowIndexing,
        contentTranslated: region.translatedLocales.includes(locale),
        placeCount: withPlaces.reduce((sum, destination) => sum + destination.placeCount, 0),
      }),
      image: withPlaces[0]?.imageUrl
        ? { url: withPlaces[0].imageUrl, alt: withPlaces[0].name }
        : null,
    },
    env.siteUrl,
  )
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const loaded = await load(props, { redirect: false })
  if (loaded.kind === 'region') return regionMetadata(loaded.locale, loaded.region)

  const { locale, destination } = loaded
  const [copy, env] = [(await getSeoContent(locale)).destination, getServerEnv()]
  return buildMetadata(
    {
      locale,
      title: destination.seoTitle ?? format(copy.metaTitle, { destination: destination.name }),
      description:
        destination.seoDescription ??
        format(copy.metaDescription, {
          destination: destination.name,
          places: plural(locale, destination.placeCount, copy.places),
          description: destination.description ?? '',
        }),
      path: destinationPath(locale, destination.slug),
      alternates: localizedPaths(destination.indexableSlugs),
      robots: resolveIndexing({
        kind: 'destination',
        siteIndexable: env.allowIndexing,
        contentTranslated: Boolean(destination.indexableSlugs[locale]),
        placeCount: destination.placeCount,
      }),
      image: destination.imageUrl ? { url: destination.imageUrl, alt: destination.name } : null,
    },
    env.siteUrl,
  )
}

export default async function DestinationPage(props: Props) {
  const loaded = await load(props, { redirect: true })
  const env = getServerEnv()

  if (loaded.kind === 'region') {
    const { locale, region } = loaded
    const [dict, copy, destinations] = await Promise.all([
      getDictionary(locale),
      getSeoContent(locale),
      regionDestinations(locale, region),
    ])
    return (
      <RegionView
        locale={locale}
        dict={dict}
        region={region}
        heading={copy.region.heading}
        destinations={destinations}
        siteUrl={env.siteUrl}
      />
    )
  }

  const { locale, destination } = loaded
  const [dict, copy, placeTypes, categories, guides, topPlaces, nearby] = await Promise.all([
    getDictionary(locale),
    getSeoContent(locale),
    listPlaceTypes(locale, destination.id),
    listCategories(locale, destination.id),
    listLandingPages(locale, destination.id),
    searchPlaces(locale, { destinationId: destination.id, limit: TOP_PLACES }),
    getNearbyDestinations(locale, destination),
  ])
  const path = destinationPath(locale, destination.slug)
  const pageUrl = `${env.siteUrl}${path}`
  const sectionPath = (slug: string) => destinationSectionPath(locale, destination.slug, slug)

  return (
    <>
      <SiteHeader
        locale={locale}
        languageLinks={buildLanguageLinks(localizedPaths(destination.slugs))}
      />
      <Breadcrumbs
        label={dict.breadcrumbs.label}
        siteUrl={env.siteUrl}
        items={destinationTrail(locale, dict, destination)}
      />
      <main id="main">
        <Hero
          meta={[destination.regionName, destination.countryName].filter(Boolean).join(', ')}
          title={destination.name}
          titleSuffix={copy.destination.heading}
          description={destination.description}
          image={{
            src: destination.imageUrl,
            alt: destination.name,
            credit: destination.imageCredit
              ? format(dict.common.imageCredit, { credit: destination.imageCredit })
              : null,
          }}
        >
          <PlaceTypeNav
            locale={locale}
            destinationSlug={destination.slug}
            label={format(dict.destination.sections, { name: destination.name })}
            allLabel={dict.destination.allPlaces}
            totalCount={destination.placeCount}
            types={placeTypes}
            activeCode={null}
            className="mt-6 md:mt-9"
          />
        </Hero>

        <section aria-labelledby="top-places" className={section}>
          <SectionHeading
            id="top-places"
            title={format(dict.destination.whereToEat, { name: destination.name })}
            action={
              topPlaces.total > 0
                ? {
                    href: directoryPath(locale, { destination: destination.slug }),
                    label: dict.destination.exploreAll,
                  }
                : null
            }
          />
          {topPlaces.items.length > 0 ? (
            <PlaceGrid
              places={topPlaces.items}
              locale={locale}
              dict={dict}
              showDestination={false}
            />
          ) : (
            <EmptyState
              title={dict.destination.emptyTitle}
              description={dict.destination.emptyText}
            />
          )}
        </section>

        {guides.length > 0 ? (
          <section aria-labelledby="guides" className={section}>
            <SectionHeading
              id="guides"
              title={format(dict.destination.guides, { name: destination.name })}
            />
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-x-6 gap-y-7">
              {guides.map((guide) => (
                <li key={guide.id}>
                  <article className="group relative flex flex-col gap-3 border-t border-line-soft pt-5">
                    <span className="text-[11px] leading-none font-medium tracking-[0.08em] text-subtle uppercase">
                      {destination.name}
                    </span>
                    <h3 className="font-serif text-[clamp(24px,2.1vw,28px)] leading-[1.1] text-balance text-ink">
                      <Link href={sectionPath(guide.slug)} className="after:absolute after:inset-0">
                        {guide.title}
                      </Link>
                    </h3>
                    {guide.intro ? (
                      <p className="line-clamp-2 text-[15px] leading-normal text-muted">
                        {guide.intro}
                      </p>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {categories.length > 0 ? (
          <section aria-labelledby="categories" className={section}>
            <SectionHeading id="categories" title={dict.destination.categories} />
            <CategoryLinks
              items={categories.map((category) => ({
                key: category.id,
                name: category.name,
                icon: category.icon,
                href: sectionPath(category.slug),
              }))}
            />
          </section>
        ) : null}

        {nearby.length > 0 ? (
          <section aria-labelledby="nearby-destinations" className={section}>
            <SectionHeading
              id="nearby-destinations"
              title={dict.destination.otherDestinations}
              action={
                destination.hub
                  ? {
                      href: regionPath(locale, destination.hub.slug),
                      label: format(dict.destination.regionGuide, {
                        region: destination.hub.name,
                      }),
                    }
                  : null
              }
            />
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {nearby.map((item) => (
                <li key={item.id}>
                  <DestinationCard destination={item} locale={locale} dict={dict} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <JsonLdScript
        data={[
          touristDestinationSchema(destination, pageUrl),
          webPageSchema({
            url: pageUrl,
            name: destination.name,
            description: destination.description,
            locale,
            siteUrl: env.siteUrl,
            about: { '@id': `${pageUrl}#destination` },
            image: destination.imageUrl,
            mainEntity:
              topPlaces.items.length > 0
                ? itemListSchema({
                    name: format(dict.destination.whereToEat, { name: destination.name }),
                    items: topPlaces.items.map((place) => ({
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
