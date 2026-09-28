import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check, MapPin, Star } from 'lucide-react'
import type { Locale } from '@/config/i18n'
import type { PlaceCard as PlaceCardData } from '@/lib/db/contracts'
import { format, formatNumber } from '@/lib/i18n/format'
import type { Dictionary } from '@/lib/i18n/types'
import { placePath } from '@/lib/routing/paths'
import { cn } from '@/lib/utils/cn'
import { CoverImage } from '@/components/ui/cover-image'
import { PlaceTypeIcon } from '@/components/ui/icon'
import { MapsLink } from './maps-link'

interface PlaceCardProps {
  place: PlaceCardData
  locale: Locale
  dict: Dictionary
  showDestination?: boolean
}

function ImageBadge({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-[7px] bg-white/95 px-2.5 py-[5px] text-xs font-medium text-ink">
      {children}
    </span>
  )
}

function InlineBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-md border border-line px-1.5 py-0.5 text-[11px] leading-none font-medium text-ink-soft normal-case">
      {children}
    </span>
  )
}

/**
 * Card for listings and grids. With an authorised photo it keeps the image-led
 * layout of the design mockups; without one it becomes a bordered text card
 * with a neutral category icon, never a stand-in picture of the business.
 * Empty fields are simply not rendered.
 */
export function PlaceCard({ place, locale, dict, showDestination = true }: PlaceCardProps) {
  const types = [place.placeTypeName, ...place.secondaryTypes.map((type) => type.name)]
  const category = place.primaryCategory?.name ?? types.filter(Boolean).join(' · ')
  const hasImage = Boolean(place.imageUrl)
  // Text cards show the category in their header, so the subtitle skips it.
  const subtitle = [hasImage ? category : null, showDestination ? place.destination.name : null]
    .filter(Boolean)
    .join(' · ')
  const badge = place.isDemo ? (
    dict.common.demoBadge
  ) : place.isFeatured ? (
    <>
      <Check aria-hidden className="size-[13px] text-accent" strokeWidth={2.4} />
      {dict.common.selection}
    </>
  ) : null

  return (
    <article
      className={cn(
        'group relative flex h-full min-w-0 flex-col transition-[transform,border-color] duration-200 hover:-translate-y-0.5',
        // Keyboard focus on the stretched title link outlines the whole card.
        'has-[[data-card-link]:focus-visible]:outline-2 has-[[data-card-link]:focus-visible]:outline-offset-4 has-[[data-card-link]:focus-visible]:outline-focus',
        hasImage
          ? 'gap-3 rounded-card'
          : 'gap-4 rounded-card border border-line-soft bg-surface p-5 hover:border-line-strong',
      )}
    >
      {hasImage ? (
        <div className="relative">
          <CoverImage
            src={place.imageUrl}
            alt={place.name}
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
            className="aspect-[4/3] rounded-card"
          />
          {badge ? <ImageBadge>{badge}</ImageBadge> : null}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 flex-none items-center justify-center rounded-control bg-accent-soft text-accent"
          >
            <PlaceTypeIcon code={place.placeType} className="size-5" />
          </span>
          {category ? (
            <span className="min-w-0 truncate text-[11px] leading-none font-medium tracking-[0.08em] text-muted uppercase">
              {category}
            </span>
          ) : null}
          {badge ? (
            <span className="ml-auto flex-none">
              <InlineBadge>{badge}</InlineBadge>
            </span>
          ) : null}
        </div>
      )}

      <div className={cn('flex flex-col gap-1.5', hasImage && 'px-0.5')}>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="line-clamp-2 min-w-0 text-[17px] leading-snug font-semibold tracking-[-0.01em] text-balance text-ink">
            <Link
              href={placePath(locale, place.destination.slug, place.placeTypeSlug, place.slug)}
              data-card-link
              className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none"
            >
              {place.name}
            </Link>
          </h3>
          {place.rating !== null ? (
            <span className="flex flex-none items-center gap-1 text-sm font-medium text-ink tabular-nums">
              <Star aria-hidden className="size-[13px] fill-ink" strokeWidth={0} />
              {formatNumber(locale, Number(place.rating.toFixed(1)))}
              {place.reviewCount ? (
                <span className="font-normal text-subtle">
                  ({formatNumber(locale, place.reviewCount)})
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        {subtitle ? <p className="truncate text-sm leading-snug text-muted">{subtitle}</p> : null}

        {place.shortDescription ? (
          <p className="line-clamp-2 text-[15px] leading-normal text-ink-soft">
            {place.shortDescription}
          </p>
        ) : null}

        {place.addressLine ? (
          <p className="flex items-start gap-1.5 text-[13px] leading-snug text-muted">
            <MapPin
              aria-hidden
              className="mt-px size-3.5 flex-none text-subtle"
              strokeWidth={1.8}
            />
            <span className="min-w-0">{place.addressLine}</span>
          </p>
        ) : null}

        {place.priceLevel !== null || place.distanceKm !== undefined ? (
          <div className="flex flex-wrap items-center gap-1.5 text-[13px] leading-snug text-muted">
            {place.priceLevel !== null ? (
              <span
                className="tracking-[0.02em]"
                title={`${dict.price.label}: ${dict.price.levels[place.priceLevel]}`}
              >
                <span className="font-medium text-ink">{'€'.repeat(place.priceLevel)}</span>
                <span className="text-faint">{'€'.repeat(4 - place.priceLevel)}</span>
              </span>
            ) : null}
            {place.priceLevel !== null && place.distanceKm !== undefined ? (
              <span className="text-faint">·</span>
            ) : null}
            {place.distanceKm !== undefined ? (
              <span>{format(dict.place.distance, { distance: place.distanceKm.toFixed(1) })}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {place.mapsUrl && place.mapsUrlKind ? (
        <MapsLink
          href={place.mapsUrl}
          kind={place.mapsUrlKind}
          placeId={place.id}
          dict={dict}
          className={cn('mt-auto', hasImage ? 'px-0.5' : 'border-t border-line-soft pt-2')}
        />
      ) : null}
    </article>
  )
}
