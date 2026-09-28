import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { AtSign, BadgeCheck, Globe, Info, MapPin, Navigation, Phone } from 'lucide-react'
import { locales, type Locale } from '@/config/i18n'
import { getSeoContent } from '@/content/seo'
import { getDestination } from '@/features/destinations/queries'
import { getNearbyPlaces, getPlace } from '@/features/places/queries'
import { getRecommendations } from '@/features/recommendations'
import { listPlaceTypes } from '@/features/taxonomy/queries'
import type { PlaceDetail, PriceLevel as Level } from '@/lib/db/contracts'
import { getServerEnv } from '@/lib/env'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { format, formatCurrency, formatDate } from '@/lib/i18n/format'
import type { Dictionary } from '@/lib/i18n/types'
import { directionsUrl } from '@/lib/maps'
import { assertLocale } from '@/lib/i18n/params'
import { buildLanguageLinks } from '@/lib/routing/language-links'
import { destinationSectionPath, placePath } from '@/lib/routing/paths'
import { destinationTrail } from '@/lib/seo/breadcrumbs'
import { inSentence, sentences } from '@/lib/seo/copy'
import { resolveIndexing } from '@/lib/seo/indexing'
import { placeSchema, webPageSchema } from '@/lib/seo/json-ld'
import { buildMetadata, type LocalizedPaths } from '@/lib/seo/metadata'
import { displayHost, toParagraphs } from '@/lib/utils/text'
import { SiteHeader } from '@/components/layout/site-header'
import { MapsLink } from '@/components/places/maps-link'
import { OutboundLink } from '@/components/places/outbound-link'
import { PlaceGrid } from '@/components/places/place-grid'
import { PlaceMap } from '@/components/places/place-map'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JsonLdScript } from '@/components/seo/json-ld'
import { RelatedLinks } from '@/components/seo/related-links'
import { CoverImage } from '@/components/ui/cover-image'
import { FeatureBadge } from '@/components/ui/feature-badge'
import { PlaceTypeIcon } from '@/components/ui/icon'
import { PriceLevel } from '@/components/ui/price-level'
import { Rating } from '@/components/ui/rating'
import { SectionHeading } from '@/components/ui/section-heading'

export const revalidate = 3600

// Places are rendered on first request and then cached (ISR), instead of
// prerendering 100k+ pages at build time.
export function generateStaticParams() {
  return []
}

type Props = PageProps<'/[locale]/[destination]/[segment]/[placeSlug]'>

/**
 * A place is identified by destination + slug; the type segment only
 * mirrors its primary type. Any other spelling (old /lugar/ URLs, a
 * destination slug from another locale, a retired slug, a wrong or outdated
 * type segment) permanently redirects to the canonical URL. Only the page
 * component redirects (see the destination page).
 */
async function load(props: Props, { redirect }: { redirect: boolean }) {
  const params = await props.params
  const locale = assertLocale(params.locale)
  const destination = await getDestination(locale, params.destination)
  if (!destination) notFound()
  const place = await getPlace(locale, destination.id, params.placeSlug)
  if (!place) notFound()
  const path = placePath(locale, destination.slug, place.placeTypeSlug, place.slug)
  const canonical =
    destination.requestedSlugMatches &&
    params.segment === place.placeTypeSlug &&
    params.placeSlug === place.slug
  if (redirect && !canonical) permanentRedirect(path)
  return { locale, destination, place, path }
}

/** The place URL in every locale where its destination and type exist. */
function localizedPaths(
  place: PlaceDetail,
  onlyLocales: readonly Locale[] = locales,
): LocalizedPaths {
  return Object.fromEntries(
    onlyLocales.flatMap((locale) => {
      const destinationSlug = place.destinationSlugs[locale]
      const typeSlug = place.placeTypeSlugs[locale]
      return destinationSlug && typeSlug
        ? [[locale, placePath(locale, destinationSlug, typeSlug, place.slug)]]
        : []
    }),
  )
}

function neighbouringPriceLevels(level: Level | null): Level[] {
  if (level === null) return []
  return ([level - 1, level, level + 1] as number[]).filter(
    (value): value is Level => value >= 1 && value <= 4,
  )
}

/**
 * Title "Café Central – Cafetería en Salou" and a description assembled only
 * from real fields: type, place, specialty, confirmed address, Maps link.
 */
async function placeSeoText(locale: Locale, place: PlaceDetail, destinationName: string) {
  const copy = (await getSeoContent(locale)).place
  const type = place.placeTypeName ?? ''
  const values = { name: place.name, destination: destinationName }
  const title = type
    ? format(copy.metaTitle, { ...values, type })
    : `${place.name}, ${destinationName}`
  const specialty = place.shortDescription?.replace(/[.\s]+$/, '')
  const description = sentences(
    type ? format(copy.lead, { ...values, type: inSentence(locale, type) }) : null,
    specialty ? `${specialty}.` : null,
    place.addressLine ? format(copy.address, { address: place.addressLine }) : null,
    place.mapsUrl ? copy.maps : null,
  )
  return { title, description }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, destination, place, path } = await load(props, { redirect: false })
  const env = getServerEnv()
  const generated = await placeSeoText(locale, place, destination.name)
  return buildMetadata(
    {
      locale,
      title: place.seoTitle ?? generated.title,
      description: place.seoDescription ?? generated.description,
      path,
      // Only translated versions are hreflang alternates; fallbacks are noindex.
      alternates: localizedPaths(place, place.indexableLocales),
      robots: resolveIndexing({
        kind: 'place',
        siteIndexable: env.allowIndexing,
        isDemo: place.isDemo,
        thinContent: !place.indexableLocales.includes(locale),
        contentTranslated: place.contentLocale === locale,
      }),
      image: place.imageUrl ? { url: place.imageUrl, alt: place.name } : null,
    },
    env.siteUrl,
  )
}

const contactTile =
  'flex h-16 flex-col items-center justify-center gap-1.5 rounded-[11px] border border-line bg-surface text-xs font-medium text-ink transition-colors hover:border-ink'

function ContactCard({
  place,
  dict,
  directions,
}: {
  place: PlaceDetail
  dict: Dictionary
  directions: string | null
}) {
  const tiles = [
    place.phone
      ? {
          key: 'phone',
          href: `tel:${place.phone.replace(/[^\d+]/g, '')}`,
          kind: 'phone' as const,
          label: dict.place.call,
          icon: Phone,
        }
      : null,
    directions
      ? {
          key: 'directions',
          href: directions,
          kind: 'directions' as const,
          label: dict.place.directions,
          icon: Navigation,
        }
      : null,
    place.instagram
      ? {
          key: 'instagram',
          href: `https://www.instagram.com/${place.instagram}`,
          kind: 'instagram' as const,
          label: dict.place.instagram,
          icon: AtSign,
        }
      : null,
  ].filter((tile) => tile !== null)

  // Directions alone would only duplicate the map section.
  if (!place.website && !place.phone && !place.instagram) return null
  return (
    <section
      aria-labelledby="contact"
      className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-[22px]"
    >
      <h2 id="contact" className="mb-1 text-[15px] leading-snug font-medium text-ink">
        {dict.place.contact}
      </h2>
      {place.website ? (
        <OutboundLink
          href={place.website}
          kind="website"
          placeId={place.id}
          className="flex h-12 items-center justify-center gap-2 rounded-[11px] bg-ink text-[15px] font-medium text-white transition-colors hover:bg-accent"
          title={displayHost(place.website)}
        >
          <Globe aria-hidden className="size-4" />
          {dict.place.visitWebsite}
        </OutboundLink>
      ) : null}
      {tiles.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {tiles.map((tile) => (
            <OutboundLink
              key={tile.key}
              href={tile.href}
              kind={tile.kind}
              placeId={place.id}
              className={contactTile}
            >
              <tile.icon aria-hidden className="size-[18px]" strokeWidth={1.8} />
              {tile.label}
            </OutboundLink>
          ))}
        </div>
      ) : null}
    </section>
  )
}

/**
 * Location without coordinates (e.g. imported places): the address or area
 * when it is confirmed, and the Google Maps link as provided by the source.
 */
function MapsCard({
  place,
  address,
  dict,
}: {
  place: PlaceDetail
  address: string | null
  dict: Dictionary
}) {
  if (!place.mapsUrl || !place.mapsUrlKind) return null
  return (
    <section
      aria-labelledby="where"
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-[22px]"
    >
      <h2 id="where" className="text-[15px] leading-snug font-medium text-ink">
        {dict.place.location}
      </h2>
      {address ? (
        <p className="flex items-start gap-2 text-[15px] leading-snug text-ink-soft">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle" />
          {address}
        </p>
      ) : null}
      <MapsLink href={place.mapsUrl} kind={place.mapsUrlKind} placeId={place.id} dict={dict} />
      <p className="text-xs leading-snug text-subtle">{dict.place.checkDetails}</p>
    </section>
  )
}

const divider = <div aria-hidden className="my-7 h-px bg-line-soft md:my-10" />

export default async function PlacePage(props: Props) {
  const { locale, destination, place, path } = await load(props, { redirect: true })
  const env = getServerEnv()
  const coordinates =
    place.latitude !== null && place.longitude !== null
      ? { latitude: place.latitude, longitude: place.longitude }
      : null
  const [dict, recommendations, nearby, destinationTypes] = await Promise.all([
    getDictionary(locale),
    getRecommendations({
      locale,
      destinationId: destination.id,
      placeType: place.placeType,
      location: coordinates,
      budget: neighbouringPriceLevels(place.priceLevel),
      categoryIds: place.categories.map((category) => category.id),
      features: place.featureCodes,
      excludeIds: [place.id],
      limit: 4,
    }),
    coordinates ? getNearbyPlaces(locale, place.id) : Promise.resolve([]),
    listPlaceTypes(locale, destination.id),
  ])
  const recommendedIds = new Set(recommendations.map((item) => item.place.id))
  const nearbyOnly = nearby.filter((item) => !recommendedIds.has(item.id))
  const listedTypes = destinationTypes.filter((type) => type.hasListingPage)
  const primaryType = listedTypes.find((type) => type.code === place.placeType) ?? null
  const typeListingPath = primaryType
    ? destinationSectionPath(locale, destination.slug, primaryType.slug)
    : null
  const pageUrl = `${env.siteUrl}${path}`
  const business = placeSchema(place, { url: pageUrl, countryCode: destination.countryCode })
  const address = [place.addressLine, place.postalCode, destination.name].filter(Boolean).join(', ')
  const addressOrArea = place.addressLine ? address : null
  const paragraphs = toParagraphs(place.fullDescription ?? place.shortDescription)
  const sectionTitle = 'mb-3 text-[22px] leading-tight font-medium tracking-[-0.025em] text-ink'

  return (
    <>
      <SiteHeader locale={locale} languageLinks={buildLanguageLinks(localizedPaths(place))} />
      <Breadcrumbs
        label={dict.breadcrumbs.label}
        siteUrl={env.siteUrl}
        items={[
          ...destinationTrail(locale, dict, destination),
          ...(primaryType && typeListingPath
            ? [{ name: primaryType.pluralName, path: typeListingPath }]
            : []),
          { name: place.name, path },
        ]}
      />
      <main id="main" className="container-page pt-4">
        {/* No authorised photo → no stand-in image: the page starts with the title. */}
        {place.imageUrl ? (
          <figure>
            <CoverImage
              src={place.imageUrl}
              alt={place.name}
              preload
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="aspect-[4/3] rounded-card sm:aspect-[21/9] sm:rounded-[18px]"
            />
            {place.imageCredit ? (
              <figcaption className="mt-2 text-right text-xs text-subtle">
                {format(dict.common.imageCredit, { credit: place.imageCredit })}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="grid items-start gap-10 pt-6 md:pt-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-[clamp(32px,5vw,72px)]">
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-2.5 text-[13px] leading-none font-medium text-muted">
                {place.imageUrl ? null : (
                  <span
                    aria-hidden
                    className="flex size-9 items-center justify-center rounded-control bg-accent-soft text-accent"
                  >
                    <PlaceTypeIcon code={place.placeType} className="size-[18px]" />
                  </span>
                )}
                {[
                  ...new Set(
                    [
                      place.placeTypeName,
                      ...place.secondaryTypes.map((type) => type.name),
                      place.primaryCategory?.name,
                    ].filter(Boolean),
                  ),
                ].join(' · ')}
              </span>
              <h1 className="heading-display text-[clamp(32px,4vw,52px)] text-ink">{place.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-[15px] leading-snug text-muted tabular-nums">
                <Rating
                  locale={locale}
                  dict={dict}
                  rating={place.rating}
                  reviewCount={place.reviewCount}
                  source={place.ratingSource}
                  showSource
                />
                {place.priceLevel !== null ? (
                  <PriceLevel level={place.priceLevel} dict={dict} />
                ) : null}
                {place.averagePrice !== null ? (
                  <>
                    <span className="text-faint">·</span>
                    <span>
                      {format(dict.place.averagePrice, {
                        price: formatCurrency(locale, place.averagePrice, place.currency),
                      })}
                    </span>
                  </>
                ) : null}
                {place.rating !== null ||
                place.priceLevel !== null ||
                place.averagePrice !== null ? (
                  <span className="text-faint">·</span>
                ) : null}
                <span>{destination.name}</span>
              </div>
              {place.features.length > 0 ? (
                <ul aria-label={dict.place.features} className="mt-1 flex flex-wrap gap-2">
                  {place.features.map((feature) => (
                    <li key={feature.code}>
                      <FeatureBadge name={feature.name} icon={feature.icon} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {place.isFeatured && !place.isDemo ? (
                <span className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-accent">
                  <BadgeCheck aria-hidden className="size-4" strokeWidth={1.8} />
                  {dict.common.selection}
                </span>
              ) : null}
            </div>

            {place.isDemo ? (
              <p className="mt-6 flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm leading-normal text-ink-soft">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                {dict.place.demoNotice}
              </p>
            ) : null}
            {place.contentLocale !== locale ? (
              <p className="mt-4 text-sm text-subtle">{dict.place.fallbackNotice}</p>
            ) : null}

            {paragraphs.length > 0 ? (
              <>
                {divider}
                <section aria-labelledby="about">
                  <h2 id="about" className={sectionTitle}>
                    {dict.place.about}
                  </h2>
                  <div
                    className="max-w-[660px] space-y-3.5 text-base leading-[1.7] text-pretty text-ink-soft"
                    lang={place.contentLocale ?? undefined}
                  >
                    {paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            {place.categories.length > 0 ? (
              <>
                {divider}
                <section aria-labelledby="categories">
                  <h2 id="categories" className={sectionTitle}>
                    {dict.place.categories}
                  </h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {place.categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={destinationSectionPath(locale, destination.slug, category.slug)}
                          className="flex h-10 items-center rounded-full border border-line bg-surface px-3.5 text-sm text-ink transition-colors hover:border-ink"
                        >
                          {category.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            ) : null}

            {coordinates ? (
              <>
                {divider}
                <section aria-labelledby="location">
                  <h2 id="location" className={sectionTitle}>
                    {dict.place.location}
                  </h2>
                  <PlaceMap
                    point={{ id: place.id, label: place.name, ...coordinates }}
                    address={address}
                    dict={dict}
                  />
                </section>
              </>
            ) : null}
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
            <ContactCard
              place={place}
              dict={dict}
              directions={coordinates ? directionsUrl(coordinates) : null}
            />
            {coordinates ? null : <MapsCard place={place} address={addressOrArea} dict={dict} />}
            <p className="text-xs text-subtle">
              <time dateTime={place.updatedAt}>
                {format(dict.place.updatedOn, { date: formatDate(locale, place.updatedAt) })}
              </time>
            </p>
          </aside>
        </div>

        {recommendations.length > 0 ? (
          <section aria-labelledby="similar" className="pt-14 md:pt-[clamp(56px,7vw,96px)]">
            <SectionHeading
              id="similar"
              title={dict.place.similar}
              action={
                primaryType && typeListingPath
                  ? {
                      href: typeListingPath,
                      label: format(dict.place.moreOfType, {
                        type: inSentence(locale, primaryType.pluralName),
                        destination: destination.name,
                      }),
                    }
                  : null
              }
            />
            <PlaceGrid
              places={recommendations.map((item) => item.place)}
              locale={locale}
              dict={dict}
              showDestination={false}
            />
          </section>
        ) : null}

        {nearbyOnly.length > 0 ? (
          <section aria-labelledby="nearby" className="pt-14">
            <SectionHeading id="nearby" title={dict.place.nearby} />
            <PlaceGrid places={nearbyOnly} locale={locale} dict={dict} showDestination={false} />
          </section>
        ) : null}

        <RelatedLinks
          id="explore-destination"
          title={format(dict.place.exploreDestination, { destination: destination.name })}
          links={listedTypes.map((type) => ({
            href: destinationSectionPath(locale, destination.slug, type.slug),
            label: format(dict.listing.placeTypeTitle, {
              type: type.pluralName,
              destination: destination.name,
            }),
            count: type.placeCount,
          }))}
        />
      </main>
      {/*
        The page (published by the guide) is about the business; the business
        node never names the guide as owner. Demo places get no business node.
      */}
      <JsonLdScript
        data={[
          webPageSchema({
            url: pageUrl,
            name: place.name,
            description: place.shortDescription,
            locale,
            siteUrl: env.siteUrl,
            about: business,
            image: place.imageUrl,
            dateModified: place.updatedAt,
          }),
        ]}
      />
    </>
  )
}
