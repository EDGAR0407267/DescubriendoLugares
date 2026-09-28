import Link from 'next/link'
import { DataIcon } from '@/components/ui/icon'

export interface CategoryLinkItem {
  key: string
  name: string
  href: string
  icon: string | null
}

/** Horizontally scrollable pills on mobile, wrapping on larger screens. */
export function CategoryLinks({ items }: { items: readonly CategoryLinkItem[] }) {
  return (
    <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {items.map((item) => (
        <li key={item.key} className="shrink-0">
          <Link
            href={item.href}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium whitespace-nowrap text-ink transition-colors hover:border-ink"
          >
            <DataIcon name={item.icon} className="size-4 text-muted" />
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
