import type { Locale } from '@/config/i18n'
import type {
  DestinationCard as DestinationCardData,
  PlaceType,
  RegionDetail,
} from '@/lib/db/contracts'
import { format } from '@/lib/i18n/format'
import type { Dictionary } from '@/lib/i18n/types'
import { pathsForAllLocales, buildLanguageLinks } from '@/lib/routing/language-links'
import { destinationPath, destinationSectionPath, homePath, regionPath } from '@/lib/routing/paths'
import { itemListSchema, regionSchema, webPageSchema } from '@/lib/seo/json-ld'
import { DestinationCard } from '@/components/destinations/destination-card'
import { SiteHeader } from '@/components/layout/site-header'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JsonLdScript } from '@/components/seo/json-ld'
import { RelatedLinks } from '@/components/seo/related-links'
import { Hero } from '@/components/ui/hero'
import { SectionHeading } from '@/components/ui/section-heading'

const section = 'container-page pt-14 md:pt-[clamp(56px,7vw,96px)]'

interface RegionViewProps {
  locale: Locale
  dict: Dictionary
  region: RegionDetail
  /** Second line of the H1 (src/content/seo). */
  heading: string
  /** Destinations with published places and their listed types. */
  destinations: readonly { destination: DestinationCardData; types: readonly PlaceType[] }[]
  siteUrl: string
}

/**
 * Regional hub (/es/costa-daurada): topical entry point that links every
 * destination and every destination × type listing with descriptive anchors.
 * Generated from data: a new destination in the region appears here, in the
 * sitemap and in the breadcrumbs without code changes.
 */
export function RegionView({
  locale,
  dict,
  region,
  heading,
  destinations,
  siteUrl,
}: RegionViewProps) {
  const path = regionPath(locale, region.slug)
  const url = `${siteUrl}${path}`
  const cover = destinations.find(({ destination }) => destination.imageUrl)?.destination ?? null

  return (
    <>
      <SiteHeader
        locale={locale}
        languageLinks={buildLanguageLinks(
          pathsForAllLocales((target) => regionPath(target, region.slug)),
        )}
      />
      <Breadcrumbs
        label={dict.breadcrumbs.label}
        siteUrl={siteUrl}
        items={[
          { name: dict.breadcrumbs.home, path: homePath(locale) },
          { name: region.name, path },
        ]}
      />
      <main id="main">
        <Hero
          meta={[region.parentName, region.countryName].filter(Boolean).join(', ')}
          title={region.name}
          titleSuffix={heading}
          description={region.description}
          image={
            cover
              ? {
                  src: cover.imageUrl,
                  alt: cover.name,
                  credit: cover.imageCredit
                    ? format(dict.common.imageCredit, { credit: cover.imageCredit })
                    : null,
                }
              : null
          }
        />

        <section aria-labelledby="destinations" className={section}>
          <SectionHeading
            id="destinations"
            title={dict.region.destinations}
            description={dict.region.destinationsText}
          />
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {destinations.map(({ destination }) => (
              <li key={destination.id}>
                <DestinationCard destination={destination} locale={locale} dict={dict} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="by-destination" className={section}>
          <SectionHeading id="by-destination" title={dict.region.tableTitle} />
          <div className="grid gap-x-10 md:grid-cols-2">
            {destinations.map(({ destination, types }) => (
              <RelatedLinks
                key={destination.id}
                id={`types-${destination.slug}`}
                title={destination.name}
                headingLevel="h3"
                className="pt-6 md:pt-8"
                links={types.map((type) => ({
                  href: destinationSectionPath(locale, destination.slug, type.slug),
                  label: format(dict.listing.placeTypeTitle, {
                    type: type.pluralName,
                    destination: destination.name,
                  }),
                  count: type.placeCount,
                }))}
              />
            ))}
          </div>
        </section>
      </main>
      <JsonLdScript
        data={[
          webPageSchema({
            type: 'CollectionPage',
            url,
            name: region.name,
            description: region.description,
            locale,
            siteUrl,
            dateModified: region.updatedAt,
            about: regionSchema(region, {
              url,
              destinationUrl: (slug) => `${siteUrl}${destinationPath(locale, slug)}`,
            }),
            mainEntity: itemListSchema({
              name: region.name,
              items: destinations.map(({ destination }) => ({
                name: destination.name,
                url: `${siteUrl}${destinationPath(locale, destination.slug)}`,
              })),
            }),
          }),
        ]}
      />
    </>
  )
}
