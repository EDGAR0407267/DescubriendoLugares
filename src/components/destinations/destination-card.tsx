import Link from 'next/link'
import type { Locale } from '@/config/i18n'
import type { DestinationCard as DestinationCardData } from '@/lib/db/contracts'
import { plural } from '@/lib/i18n/format'
import type { Dictionary } from '@/lib/i18n/types'
import { destinationPath } from '@/lib/routing/paths'
import { CoverImage } from '@/components/ui/cover-image'

interface DestinationCardProps {
  destination: DestinationCardData
  locale: Locale
  dict: Dictionary
}

export function DestinationCard({ destination, locale, dict }: DestinationCardProps) {
  return (
    <article className="group relative flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-0.5">
      <CoverImage
        src={destination.imageUrl}
        alt={destination.name}
        sizes="(min-width: 1024px) 400px, (min-width: 640px) 45vw, 75vw"
        className="aspect-[4/5] rounded-card bg-placeholder"
      />
      <div className="flex flex-col gap-[3px] px-0.5">
        <h3 className="text-[17px] leading-tight font-medium tracking-[-0.015em] text-ink">
          <Link
            href={destinationPath(locale, destination.slug)}
            className="after:absolute after:inset-0"
          >
            {destination.name}
          </Link>
        </h3>
        <p className="text-sm leading-snug text-muted">
          {[destination.regionName, plural(locale, destination.placeCount, dict.common.places)]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </article>
  )
}
