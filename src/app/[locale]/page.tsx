import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { getSeoContent } from '@/content/seo'
import { listDestinations } from '@/features/destinations/queries'
import { listLandingPages } from '@/features/landing-pages/queries'
import { searchPlaces } from '@/features/places/queries'
import { getRegion, listSitemapRegions } from '@/features/regions/queries'
import { listCategories, listPlaceTypes } from '@/features/taxonomy/queries'
import type { DestinationCard as DestinationCardData } from '@/lib/db/contracts'
import { getServerEnv } from '@/lib/env'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { format } from '@/lib/i18n/format'
import { assertLocale } from '@/lib/i18n/params'
import { buildLanguageLinks, pathsForAllLocales } from '@/lib/routing/language-links'
import {
  destinationPath,
  destinationSectionPath,
  directoryPath,
  homePath,
  regionPath,
} from '@/lib/routing/paths'
import { listNames } from '@/lib/seo/copy'
import { resolveIndexing } from '@/lib/seo/indexing'
import { organizationSchema, websiteSchema } from '@/lib/seo/json-ld'
import { buildMetadata } from '@/lib/seo/metadata'
import { DestinationCard } from '@/components/destinations/destination-card'
import { SiteHeader } from '@/components/layout/site-header'
import { PlaceGrid } from '@/components/places/place-grid'
import { DiscoveryForm } from '@/components/search/discovery-form'
import { HeroSearch } from '@/components/search/hero-search'
import { JsonLdScript } from '@/components/seo/json-ld'
import { CoverImage } from '@/components/ui/cover-image'
import { PlaceTypeIcon } from '@/components/ui/icon'
import { SectionHeading } from '@/components/ui/section-heading'

export const revalidate = 3600

const FEATURED_PLACES = 8
const SUGGESTED_DESTINATIONS = 4
const HOME_GUIDES = 3
const HERO_IMAGE = '/images/home-hero.webp'

const section = 'container-page pt-14 md:pt-[clamp(56px,7vw,104px)]'

/**
 * The single regional hub when every destination belongs to one (today:
 * Costa Daurada). With several hubs the home falls back to generic copy.
 */
async function getMainHub(locale: Locale) {
  const hubs = await listSitemapRegions()
  return hubs.length === 1 ? getRegion(locale, hubs[0].slug) : null
}

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const [dict, copy, hub, env] = [
    await getDictionary(locale),
    (await getSeoContent(locale)).home,
    await getMainHub(locale),
    getServerEnv(),
  ]
  const hubDestinations = (hub?.destinations ?? [])
    .filter((destination) => destination.placeCount > 0)
    .map((destination) => destination.name)
  return buildMetadata(
    {
      locale,
      title: hub
        ? format(copy.metaTitleRegion, {
            region: hub.name,
            destinations: listNames(locale, hubDestinations.slice(0, 3), 3),
          })
        : dict.home.metaTitle,
      description: hub
        ? format(copy.metaDescriptionRegion, {
            region: hub.name,
            destinations: listNames(locale, hubDestinations, hubDestinations.length, 5),
          })
        : dict.home.metaDescription,
      path: homePath(locale),
      alternates: pathsForAllLocales(homePath),
      robots: resolveIndexing({ kind: 'home', siteIndexable: env.allowIndexing }),
    },
    env.siteUrl,
  )
}

/** Editorial guides (landing pages) of the destinations that have places. */
async function listHomeGuides(locale: Locale, destinations: readonly DestinationCardData[]) {
  const withPlaces = destinations.filter((destination) => destination.placeCount > 0)
  const perDestination = await Promise.all(
    withPlaces.map(async (destination) => {
      const [guides, places] = await Promise.all([
        listLandingPages(locale, destination.id),
        searchPlaces(locale, { destinationId: destination.id, limit: HOME_GUIDES }),
      ])
      // Each guide borrows a different place photo so cards do not repeat.
      const photos = places.items.flatMap((place) => (place.imageUrl ? [place.imageUrl] : []))
      return guides.map((guide, index) => ({
        guide,
        destination,
        imageUrl: photos[index % Math.max(photos.length, 1)] ?? destination.imageUrl,
      }))
    }),
  )
  return perDestination.flat().slice(0, HOME_GUIDES)
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const locale = assertLocale((await params).locale)
  const [dict, destinations, placeTypes, categories, featured] = await Promise.all([
    getDictionary(locale),
    listDestinations(locale),
    listPlaceTypes(locale),
    listCategories(locale),
    searchPlaces(locale, { featuredOnly: true, limit: FEATURED_PLACES }),
  ])
  const [guides, hub] = await Promise.all([
    listHomeGuides(locale, destinations),
    getMainHub(locale),
  ])
  const env = getServerEnv()
  const availableTypes = placeTypes.filter((type) => type.placeCount > 0)

  return (
    <>
      <SiteHeader
        locale={locale}
        languageLinks={buildLanguageLinks(pathsForAllLocales(homePath))}
      />
      <main id="main">
        {/* Hero: photograph with title, floating search bar, suggestions. */}
        <section className="container-page pt-3 md:pt-6">
          <div className="relative h-[clamp(440px,46vw,600px)] overflow-hidden rounded-[clamp(14px,1.6vw,20px)] bg-placeholder">
            {/* Decorative: the title over it carries the meaning. */}
            <CoverImage
              src={HERO_IMAGE}
              alt=""
              preload
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="h-full"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(20_20_18/0)_35%,rgb(20_20_18/0.55)_100%)]"
            />
            <div className="absolute inset-x-0 bottom-0 flex max-w-[820px] flex-col gap-3.5 p-6 pb-[clamp(72px,7vw,100px)] text-white md:p-[clamp(24px,4.5vw,64px)] md:pb-[clamp(72px,7vw,100px)]">
              <h1 className="heading-display text-[clamp(36px,5.4vw,68px)] tracking-[-0.04em]">
                {dict.home.titleLead}{' '}
                <em className="accent-serif text-[1.1em] leading-none">{dict.home.titleAccent}</em>
              </h1>
              <p className="max-w-[460px] text-[clamp(16px,1.4vw,19px)] leading-snug text-white/90">
                {dict.home.subtitle}
              </p>
            </div>
          </div>
          <div className="relative z-10 mx-auto -mt-11 max-w-[900px] px-2.5 sm:px-8">
            <HeroSearch
              locale={locale}
              dict={dict}
              destinations={destinations}
              placeTypes={availableTypes}
            />
          </div>
          <div className="mt-[18px] flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-[13px] text-subtle">{dict.home.suggestions}</span>
            {destinations.slice(0, SUGGESTED_DESTINATIONS).map((destination) => (
              <Link
                key={destination.id}
                href={destinationPath(locale, destination.slug)}
                className="flex h-9 items-center rounded-full border border-line bg-surface px-3.5 text-sm text-ink transition-colors hover:border-ink"
              >
                {destination.name}
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="destinations" className={section}>
          <SectionHeading
            id="destinations"
            title={dict.home.destinations}
            description={dict.home.destinationsText}
            action={
              hub
                ? {
                    href: regionPath(locale, hub.slug),
                    label: format(dict.home.regionGuide, { region: hub.name }),
                  }
                : null
            }
          />
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {destinations.map((destination) => (
              <li key={destination.id}>
                <DestinationCard destination={destination} locale={locale} dict={dict} />
              </li>
            ))}
          </ul>
        </section>

        {availableTypes.length > 0 ? (
          <section aria-labelledby="looking-for" className={section}>
            <SectionHeading id="looking-for" title={dict.home.lookingFor} />
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,150px),1fr))] gap-3">
              {availableTypes.map((type) => (
                <li key={type.code}>
                  <Link
                    href={directoryPath(locale, { type: type.code })}
                    className="flex h-full flex-col items-start gap-7 rounded-card border border-line-soft bg-surface p-[18px] transition-colors hover:border-ink"
                  >
                    <PlaceTypeIcon code={type.code} className="size-[22px] text-ink" />
                    <span className="text-[15px] leading-none font-medium text-ink">
                      {type.pluralName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {featured.items.length > 0 ? (
          <section aria-labelledby="featured-places" className={section}>
            <SectionHeading
              id="featured-places"
              title={dict.home.featuredPlaces}
              description={dict.home.featuredPlacesText}
              action={{ href: directoryPath(locale), label: dict.home.viewAll }}
            />
            <PlaceGrid places={featured.items} locale={locale} dict={dict} />
          </section>
        ) : null}

        <section aria-labelledby="unsure" className={section}>
          <div className="grid items-center gap-7 rounded-[20px] border border-line bg-surface p-7 md:grid-cols-2 md:gap-16 md:p-[clamp(28px,4.5vw,64px)]">
            <div className="flex flex-col items-start gap-3.5">
              <h2
                id="unsure"
                className="heading-section text-[clamp(28px,3.2vw,42px)] leading-[1.05] tracking-[-0.035em] text-ink"
              >
                {dict.home.unsureTitle}
              </h2>
              <p className="max-w-[380px] text-[17px] leading-normal text-muted">
                {dict.home.unsureText}
              </p>
            </div>
            <div className="rounded-card bg-hover p-[clamp(18px,2.4vw,28px)]">
              <DiscoveryForm
                locale={locale}
                dict={dict}
                destinations={destinations}
                categories={categories}
              />
            </div>
          </div>
        </section>

        {guides.length > 0 ? (
          <section aria-labelledby="guides" className={section}>
            <SectionHeading id="guides" title={dict.home.guides} />
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-x-6 gap-y-7">
              {guides.map(({ guide, destination, imageUrl }) => (
                <li key={guide.id}>
                  <article className="group relative flex flex-col gap-3.5 transition-transform duration-200 hover:-translate-y-0.5">
                    <CoverImage
                      src={imageUrl}
                      alt=""
                      sizes="(min-width: 1024px) 400px, 100vw"
                      className="aspect-[16/11] rounded-card"
                    />
                    <span className="text-[11px] leading-none font-medium tracking-[0.08em] text-subtle uppercase">
                      {destination.name}
                    </span>
                    <h3 className="font-serif text-[clamp(24px,2.1vw,28px)] leading-[1.1] text-balance text-ink">
                      <Link
                        href={destinationSectionPath(locale, destination.slug, guide.slug)}
                        className="after:absolute after:inset-0"
                      >
                        {guide.title}
                      </Link>
                    </h3>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <JsonLdScript
        data={[
          organizationSchema({ siteUrl: env.siteUrl, email: siteConfig.publisher.email }),
          websiteSchema({
            url: `${env.siteUrl}${homePath(locale)}`,
            name: siteConfig.name,
            locale,
            siteUrl: env.siteUrl,
          }),
        ]}
      />
    </>
  )
}
