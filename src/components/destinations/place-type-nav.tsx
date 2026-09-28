import Link from 'next/link'
import type { Locale } from '@/config/i18n'
import type { PlaceType } from '@/lib/db/contracts'
import { destinationPath, destinationSectionPath } from '@/lib/routing/paths'
import { cn } from '@/lib/utils/cn'
import { PlaceTypeIcon } from '@/components/ui/icon'

interface PlaceTypeNavProps {
  locale: Locale
  /** Localized slug of the destination. */
  destinationSlug: string
  label: string
  allLabel: string
  /** Published places in the destination ("All" chip). */
  totalCount: number
  /** Types with places in the destination (counts include secondary types). */
  types: readonly PlaceType[]
  /** Current type listing, or null on the destination page itself. */
  activeCode: string | null
  className?: string
}

const chip =
  'flex h-11 flex-none items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors'

/**
 * City-level category filter shared by every destination: "All" is the
 * destination page and each category is its indexable listing
 * (/es/salou/cafeterias), so filtering is plain links with real URLs.
 */
export function PlaceTypeNav({
  locale,
  destinationSlug,
  label,
  allLabel,
  totalCount,
  types,
  activeCode,
  className,
}: PlaceTypeNavProps) {
  if (types.length === 0) return null
  const items = [
    {
      key: 'all',
      href: destinationPath(locale, destinationSlug),
      label: allLabel,
      count: totalCount,
      code: null,
    },
    ...types
      .filter((type) => type.hasListingPage)
      .map((type) => ({
        key: type.code,
        href: destinationSectionPath(locale, destinationSlug, type.slug),
        label: type.pluralName,
        count: type.placeCount,
        code: type.code,
      })),
  ]

  return (
    <nav
      aria-label={label}
      className={cn(
        'scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 md:mx-0 md:px-0',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.code === activeCode
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              chip,
              active
                ? 'border-ink bg-ink text-white hover:bg-accent'
                : 'border-line bg-surface text-ink hover:border-ink',
            )}
          >
            {item.code ? <PlaceTypeIcon code={item.code} className="size-4" /> : null}
            {item.label}
            <span className={active ? 'text-white/60' : 'text-subtle'}>{item.count}</span>
          </Link>
        )
      })}
    </nav>
  )
}
