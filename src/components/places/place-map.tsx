import { MapPin, Navigation } from 'lucide-react'
import { format } from '@/lib/i18n/format'
import type { Dictionary } from '@/lib/i18n/types'
import { directionsUrl, mapProvider, type MapPoint } from '@/lib/maps'
import { buttonClasses } from '@/components/ui/button-link'
import { OutboundLink } from './outbound-link'

interface PlaceMapProps {
  point: MapPoint
  address: string | null
  dict: Dictionary
}

/**
 * Lazy iframe map from the configured provider (no JS, no API key) with a
 * universal directions link. Swapping the provider does not change this API.
 */
export function PlaceMap({ point, address, dict }: PlaceMapProps) {
  const embedUrl = mapProvider.embedUrl(point)
  return (
    <div>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={format(dict.place.mapTitle, { name: point.label })}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="aspect-[16/8] min-h-[220px] w-full rounded-card border border-line bg-sunken"
        />
      ) : null}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-4">
        {address ? (
          <p className="flex items-start gap-2 text-[15px] leading-snug text-ink-soft">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle" />
            {address}
          </p>
        ) : (
          <span />
        )}
        <OutboundLink
          href={directionsUrl(point)}
          kind="directions"
          placeId={point.id}
          className={buttonClasses('outline')}
        >
          <Navigation aria-hidden className="size-4" />
          {dict.place.directions}
        </OutboundLink>
      </div>
    </div>
  )
}
