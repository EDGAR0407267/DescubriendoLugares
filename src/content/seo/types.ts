import type { PluralMessages } from '@/lib/i18n/types'

/**
 * Search-intent copy for generated pages (titles, descriptions, intros).
 *
 * Templates only: every concrete fact ({destination}, {names}, counts) is
 * filled in from the database, so no page claims anything the data does not
 * support. Each template targets one intent cluster, e.g. the restaurant
 * listing answers "restaurantes en X", "dónde comer/cenar en X"; the café
 * listing "cafeterías en X", "dónde desayunar/tomar café en X". See
 * docs/SEO.md → "Mapa de intenciones".
 */
export interface CollectionCopy {
  /** <title> (brand appended automatically). {type}, {destination} */
  metaTitle: string
  /** Meta description. {type}, {destination}, {names} (first places listed) */
  description: string
  /** Visible intro under the H1. {type}, {destination} */
  intro: string
}

export interface SeoContent {
  home: {
    /** When all destinations share one hub. {region}, {destinations} */
    metaTitleRegion: string
    metaDescriptionRegion: string
  }
  region: {
    metaTitle: string
    /** {region}, {destinations} */
    metaDescription: string
    /** Second line of the H1, under the region name. */
    heading: string
  }
  destination: {
    metaTitle: string
    /** {destination}, {places} (plural below), {description} */
    metaDescription: string
    places: PluralMessages
    /** Second line of the H1, under the destination name. */
    heading: string
  }
  place: {
    /** {name}, {type}, {destination} */
    metaTitle: string
    /** Opening of the meta description: {name}, {type}, {destination} */
    lead: string
    address: string
    maps: string
  }
  /** Keyed by place type code (restaurant, cafe, brunch, tapas_bar, drinks…). */
  placeTypes: Partial<Record<string, CollectionCopy>>
  /** Any type without specific copy (new types work without code changes). */
  defaultPlaceType: CollectionCopy
}
