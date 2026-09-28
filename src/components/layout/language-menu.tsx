'use client'

import { ChevronDown, Globe } from 'lucide-react'
import { LOCALE_COOKIE, type Locale } from '@/config/i18n'
import { cn } from '@/lib/utils/cn'

export interface LanguageOption {
  locale: Locale
  nativeName: string
  href: string
}

interface LanguageMenuProps {
  current: Locale
  label: string
  options: readonly LanguageOption[]
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`
}

/**
 * Plain links to the equivalent page in each language (crawlable, work
 * without JS). The click handler only persists the explicit choice, which the
 * proxy uses for URLs without a locale prefix.
 */
export function LanguageMenu({ current, label, options }: LanguageMenuProps) {
  return (
    <details className="group relative">
      <summary
        aria-label={label}
        className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-control border border-line bg-surface px-2.5 text-[13px] font-medium text-ink transition-colors hover:border-line-strong sm:h-[38px]"
      >
        <Globe aria-hidden className="hidden size-4 sm:block" strokeWidth={1.8} />
        <span className="uppercase">{current}</span>
        <ChevronDown
          aria-hidden
          className="hidden size-3.5 transition-transform group-open:rotate-180 sm:block"
          strokeWidth={2}
        />
      </summary>
      <ul className="absolute right-0 z-50 mt-2 w-[200px] rounded-xl border border-line bg-surface p-1.5 shadow-raised">
        {options.map((option) => {
          const isCurrent = option.locale === current
          return (
            <li key={option.locale}>
              <a
                href={option.href}
                hrefLang={option.locale}
                lang={option.locale}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => rememberLocale(option.locale)}
                className="flex items-center justify-between rounded-lg px-2.5 py-2.5 text-sm text-ink hover:bg-hover"
              >
                {option.nativeName}
                <span
                  className={cn(
                    'text-xs font-medium uppercase',
                    isCurrent ? 'text-accent' : 'text-subtle',
                  )}
                >
                  {option.locale}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
