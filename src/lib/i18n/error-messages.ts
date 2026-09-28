import type { Locale } from '@/config/i18n'

/**
 * The only UI strings shipped to the client: error boundaries are Client
 * Components and cannot load the server-side dictionaries.
 */
export const errorMessages: Record<Locale, { title: string; text: string; retry: string }> = {
  es: {
    title: 'Algo ha fallado',
    text: 'No hemos podido cargar esta página. Inténtalo de nuevo en unos segundos.',
    retry: 'Reintentar',
  },
  ca: {
    title: 'Alguna cosa ha fallat',
    text: 'No hem pogut carregar aquesta pàgina. Torna-ho a provar d’aquí a uns segons.',
    retry: 'Torna-ho a provar',
  },
  en: {
    title: 'Something went wrong',
    text: 'We couldn’t load this page. Please try again in a few seconds.',
    retry: 'Try again',
  },
  fr: {
    title: 'Une erreur est survenue',
    text: 'Impossible de charger cette page. Réessayez dans quelques secondes.',
    retry: 'Réessayer',
  },
  de: {
    title: 'Etwas ist schiefgelaufen',
    text: 'Diese Seite konnte nicht geladen werden. Bitte versuche es gleich noch einmal.',
    retry: 'Erneut versuchen',
  },
  it: {
    title: 'Qualcosa è andato storto',
    text: 'Non è stato possibile caricare questa pagina. Riprova tra qualche secondo.',
    retry: 'Riprova',
  },
}
