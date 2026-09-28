import Link from 'next/link'
import { Search, UtensilsCrossed } from 'lucide-react'
import type { Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { getDictionary } from '@/lib/i18n/dictionaries'
import type { LanguageLink } from '@/lib/routing/language-links'
import { directoryPath, homePath, searchPath, staticPagePath } from '@/lib/routing/paths'
import { Brand } from './brand'
import { LanguageMenu } from './language-menu'

interface SiteHeaderProps {
  locale: Locale
  /** Equivalent URLs of the current page per locale (from the page). */
  languageLinks: readonly LanguageLink[]
}

const navLink =
  'flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-sunken hover:text-ink'

/**
 * Rendered by each page (not the layout) because the language menu must link
 * to the current page's equivalents, which only the page knows.
 */
export async function SiteHeader({ locale, languageLinks }: SiteHeaderProps) {
  const dict = await getDictionary(locale)
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-canvas/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-2 md:h-[72px] md:gap-4 lg:gap-7">
        <Link href={homePath(locale)} aria-label={siteConfig.name} className="flex-none py-1">
          <Brand />
        </Link>
        <nav aria-label={dict.nav.primary} className="hidden items-center gap-1 lg:flex">
          <Link href={homePath(locale)} className={navLink}>
            {dict.nav.explore}
          </Link>
          <Link href={`${homePath(locale)}#destinations`} className={navLink}>
            {dict.nav.destinations}
          </Link>
          <Link href={directoryPath(locale)} className={navLink}>
            {dict.nav.eatAndDrink}
          </Link>
          <Link href={staticPagePath(locale, 'about')} className={navLink}>
            {dict.nav.about}
          </Link>
        </nav>
        <div className="flex-1" />
        <div className="flex items-center gap-1 md:gap-2">
          {/* Below lg the text nav does not fit: the directory keeps an icon entry. */}
          <Link
            href={directoryPath(locale)}
            className="flex size-11 items-center justify-center rounded-lg text-ink transition-colors hover:bg-sunken lg:hidden"
          >
            <UtensilsCrossed aria-hidden className="size-[18px]" strokeWidth={1.8} />
            <span className="sr-only">{dict.nav.eatAndDrink}</span>
          </Link>
          <Link
            href={searchPath(locale)}
            className="flex size-11 items-center justify-center rounded-lg text-ink transition-colors hover:bg-sunken md:w-auto md:gap-2 md:px-3"
          >
            <Search aria-hidden className="size-[18px]" strokeWidth={1.8} />
            <span className="sr-only text-sm font-medium md:not-sr-only">{dict.nav.search}</span>
          </Link>
          <LanguageMenu current={locale} label={dict.common.language} options={languageLinks} />
        </div>
      </div>
    </header>
  )
}
