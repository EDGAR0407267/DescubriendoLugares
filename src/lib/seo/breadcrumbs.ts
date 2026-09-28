import type { Locale } from '@/config/i18n'
import type { DestinationDetail } from '@/lib/db/contracts'
import type { Dictionary } from '@/lib/i18n/types'
import { destinationPath, homePath, regionPath } from '@/lib/routing/paths'

export interface Crumb {
  name: string
  path: string
}

/**
 * Trail shared by every page below a destination:
 * Inicio → Costa Daurada (hub, when there is one) → Salou.
 * Pages append their own crumbs (listing, place).
 */
export function destinationTrail(
  locale: Locale,
  dict: Dictionary,
  destination: Pick<DestinationDetail, 'name' | 'slug' | 'hub'>,
): Crumb[] {
  return [
    { name: dict.breadcrumbs.home, path: homePath(locale) },
    ...(destination.hub
      ? [{ name: destination.hub.name, path: regionPath(locale, destination.hub.slug) }]
      : []),
    { name: destination.name, path: destinationPath(locale, destination.slug) },
  ]
}
