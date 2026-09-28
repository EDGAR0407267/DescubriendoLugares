import Link from 'next/link'
import { breadcrumbListSchema } from '@/lib/seo/json-ld'
import { JsonLdScript } from './json-ld'

export interface Crumb {
  name: string
  path: string
}

interface BreadcrumbsProps {
  label: string
  items: readonly Crumb[]
  siteUrl: string
}

/** Visible trail + matching BreadcrumbList structured data (single source). */
export function Breadcrumbs({ label, items, siteUrl }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className="container-page pt-4 md:pt-6">
      <ol className="scrollbar-none flex items-center gap-2 overflow-x-auto text-[13px] whitespace-nowrap text-subtle">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.path} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="text-ink">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="transition-colors hover:text-ink">
                    {item.name}
                  </Link>
                  <span aria-hidden>/</span>
                </>
              )}
            </li>
          )
        })}
      </ol>
      <JsonLdScript
        data={[
          breadcrumbListSchema(
            items.map((item) => ({ name: item.name, url: `${siteUrl}${item.path}` })),
          ),
        ]}
      />
    </nav>
  )
}
