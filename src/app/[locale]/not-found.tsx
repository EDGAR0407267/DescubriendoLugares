import type { Metadata } from 'next'
import { locale as localeParam } from 'next/root-params'
import { defaultLocale, isLocale, type Locale } from '@/config/i18n'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { buildLanguageLinks } from '@/lib/routing/language-links'
import { homePath, searchPath } from '@/lib/routing/paths'
import { SiteHeader } from '@/components/layout/site-header'
import { ButtonLink } from '@/components/ui/button-link'

async function currentLocale(): Promise<Locale> {
  const value = await localeParam()
  return isLocale(value) ? value : defaultLocale
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(await currentLocale())
  return { title: dict.notFound.metaTitle, robots: { index: false, follow: true } }
}

export default async function NotFound() {
  const locale = await currentLocale()
  const dict = await getDictionary(locale)
  return (
    <>
      <SiteHeader locale={locale} languageLinks={buildLanguageLinks({})} />
      <main id="main" className="container-page flex flex-col items-start py-24 sm:py-32">
        <p className="accent-serif text-7xl text-accent sm:text-8xl">404</p>
        <h1 className="mt-4 heading-display text-[clamp(30px,4vw,52px)] text-ink">
          {dict.notFound.title}
        </h1>
        <p className="mt-4 max-w-lg text-lg text-ink-soft">{dict.notFound.text}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={homePath(locale)}>{dict.notFound.backHome}</ButtonLink>
          <ButtonLink href={searchPath(locale)} variant="secondary">
            {dict.notFound.search}
          </ButtonLink>
        </div>
      </main>
    </>
  )
}
