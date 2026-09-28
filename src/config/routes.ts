import type { Locale } from './i18n'

/**
 * Localized URL segments for routes whose folder name is fixed in `src/app`.
 *
 * The file system uses the English key (e.g. `app/[locale]/search`); the
 * proxy rewrites `/es/buscar` → `/es/search` and redirects the internal
 * spelling to the localized one, so each page has exactly one public URL.
 *
 * Dynamic segments (destinations, regional hubs, place-type listings,
 * categories, landing pages, places) are localized in the database instead.
 */
export const staticPageSegments = {
  search: { es: 'buscar', ca: 'cercar', en: 'search', fr: 'recherche', de: 'suche', it: 'cerca' },
  /** "Comer y beber": directory of every place, filterable by locality and type. */
  directory: {
    es: 'comer-y-beber',
    ca: 'menjar-i-beure',
    en: 'eat-and-drink',
    fr: 'manger-et-boire',
    de: 'essen-und-trinken',
    it: 'mangiare-e-bere',
  },
  about: {
    es: 'sobre-nosotros',
    ca: 'sobre-nosaltres',
    en: 'about',
    fr: 'a-propos',
    de: 'ueber-uns',
    it: 'chi-siamo',
  },
  /** Editorial policy: how places are selected, sources, corrections. */
  editorial: {
    es: 'como-seleccionamos',
    ca: 'com-seleccionem',
    en: 'how-we-select',
    fr: 'notre-methode',
    de: 'auswahlkriterien',
    it: 'come-selezioniamo',
  },
  /** Only served when a contact e-mail is configured (siteConfig.publisher.email). */
  contact: {
    es: 'contacto',
    ca: 'contacte',
    en: 'contact',
    fr: 'contact',
    de: 'kontakt',
    it: 'contatti',
  },
  privacy: {
    es: 'privacidad',
    ca: 'privacitat',
    en: 'privacy',
    fr: 'confidentialite',
    de: 'datenschutz',
    it: 'privacy',
  },
  cookies: {
    es: 'cookies',
    ca: 'galetes',
    en: 'cookies',
    fr: 'cookies',
    de: 'cookies',
    it: 'cookie',
  },
  legal: {
    es: 'aviso-legal',
    ca: 'avis-legal',
    en: 'legal-notice',
    fr: 'mentions-legales',
    de: 'impressum',
    it: 'note-legali',
  },
} as const satisfies Record<string, Record<Locale, string>>

export type StaticPage = keyof typeof staticPageSegments

/**
 * Former segment between the destination and the place slug
 * (/es/cambrils/lugar/{place}). Place pages now live under their type listing
 * (/es/cambrils/restaurantes/{place}); these URLs answer with a permanent
 * redirect, so the words stay reserved.
 */
export const legacyPlaceSegments = ['lugar', 'lloc', 'place', 'lieu', 'ort', 'luogo'] as const

/**
 * Slugs that destinations, regions, categories, place types and landing pages
 * must never use because they collide with fixed routes.
 */
export const reservedSlugs: ReadonlySet<string> = new Set([
  ...Object.keys(staticPageSegments),
  ...Object.values(staticPageSegments).flatMap((segments) => Object.values(segments)),
  ...legacyPlaceSegments,
  'api',
])
