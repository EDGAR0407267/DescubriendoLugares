import type { Locale } from '@/config/i18n'
import type { PlaceCard as PlaceCardData } from '@/lib/db/contracts'
import type { Dictionary } from '@/lib/i18n/types'
import { PlaceCard } from './place-card'

interface PlaceGridProps {
  places: readonly PlaceCardData[]
  locale: Locale
  dict: Dictionary
  showDestination?: boolean
}

export function PlaceGrid({ places, locale, dict, showDestination }: PlaceGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {places.map((place) => (
        <li key={place.id}>
          <PlaceCard place={place} locale={locale} dict={dict} showDestination={showDestination} />
        </li>
      ))}
    </ul>
  )
}
