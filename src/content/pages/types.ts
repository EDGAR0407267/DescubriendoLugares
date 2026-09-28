/**
 * Editorial content of fixed pages (about, legal texts). Kept apart from UI
 * dictionaries: these are documents, reviewed and versioned as such. When a
 * CMS exists they can move to the database without touching the page code.
 */
export interface StaticPageContent {
  title: string
  description: string
  sections: { heading: string; paragraphs: string[] }[]
}

export type ContentPage = 'about' | 'editorial' | 'contact' | 'privacy' | 'cookies' | 'legal'

export type StaticPagesContent = Record<ContentPage, StaticPageContent>
