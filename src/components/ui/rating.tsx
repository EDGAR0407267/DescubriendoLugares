import { Star } from 'lucide-react'
import type { Locale } from '@/config/i18n'
import { format, formatNumber, plural } from '@/lib/i18n/format'
import type { Dictionary } from '@/lib/i18n/types'

interface RatingProps {
  locale: Locale
  dict: Dictionary
  rating: number | null
  reviewCount: number | null
  source?: string | null
  showSource?: boolean
}

/** Renders nothing without a real rating: no placeholders, no fake stars. */
export function Rating({
  locale,
  dict,
  rating,
  reviewCount,
  source,
  showSource = false,
}: RatingProps) {
  if (rating === null) return null
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-sm text-ink">
      <Star aria-hidden className="size-4 fill-ink" strokeWidth={0} />
      <span className="font-medium">{formatNumber(locale, Number(rating.toFixed(1)))}</span>
      {reviewCount ? (
        <span className="text-muted">({plural(locale, reviewCount, dict.place.reviews)})</span>
      ) : null}
      {showSource && source ? (
        <span className="text-muted">· {format(dict.place.ratingFrom, { source })}</span>
      ) : null}
    </span>
  )
}
