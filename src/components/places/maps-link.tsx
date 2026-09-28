import { ArrowUpRight } from 'lucide-react'
import type { MapsUrlKind } from '@/lib/db/contracts'
import type { Dictionary } from '@/lib/i18n/types'
import { cn } from '@/lib/utils/cn'
import { OutboundLink } from './outbound-link'

interface MapsLinkProps {
  href: string
  kind: MapsUrlKind
  placeId: string
  dict: Dictionary
  className?: string
  /** Show the "name search" hint below the link (it is always announced). */
  showHint?: boolean
}

/**
 * "View on Google Maps". Most imported links are text searches, not verified
 * listings, so a `search` link says so instead of implying a confirmed pin.
 */
export function MapsLink({ href, kind, placeId, dict, className, showHint = true }: MapsLinkProps) {
  const isSearch = kind === 'search'
  const hintId = `maps-hint-${placeId}`
  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <OutboundLink
        href={href}
        kind="maps"
        placeId={placeId}
        aria-describedby={isSearch ? hintId : undefined}
        className="relative z-10 -mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 text-sm font-medium text-accent underline-offset-4 transition-colors hover:text-accent-strong hover:underline"
      >
        {dict.place.viewOnMaps}
        <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.9} />
        <span className="sr-only">({dict.common.opensInNewTab})</span>
      </OutboundLink>
      {isSearch ? (
        <span
          id={hintId}
          className={cn('text-xs leading-snug text-subtle', !showHint && 'sr-only')}
        >
          {dict.place.mapsSearchHint}
        </span>
      ) : null}
    </div>
  )
}
