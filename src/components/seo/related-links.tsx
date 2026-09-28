import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export interface RelatedLink {
  href: string
  /** Descriptive anchor text ("Cafeterías en Salou"), never a bare "ver más". */
  label: string
  /** Optional count shown next to the label. */
  count?: number
}

interface RelatedLinksProps {
  id: string
  title: string
  links: readonly RelatedLink[]
  className?: string
  /** h3 when the block sits inside another section. */
  headingLevel?: 'h2' | 'h3'
}

/**
 * Internal-linking block ("Explora Salou", "También en otros destinos"):
 * plain crawlable anchors grouped under a real heading. Renders nothing
 * without links, so pages never show empty sections.
 */
export function RelatedLinks({
  id,
  title,
  links,
  className,
  headingLevel: Heading = 'h2',
}: RelatedLinksProps) {
  if (links.length === 0) return null
  return (
    <section aria-labelledby={id} className={cn('pt-12 md:pt-16', className)}>
      <Heading
        id={id}
        className="text-[22px] leading-tight font-medium tracking-[-0.025em] text-ink"
      >
        {title}
      </Heading>
      <ul className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {link.label}
              {link.count !== undefined ? (
                <span className="text-subtle tabular-nums">{link.count}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
