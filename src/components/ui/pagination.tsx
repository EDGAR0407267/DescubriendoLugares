import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from '@/lib/i18n/format'
import type { Dictionary } from '@/lib/i18n/types'
import { buttonClasses } from './button-link'

interface PaginationProps {
  dict: Dictionary
  page: number
  totalPages: number
  hrefForPage: (page: number) => string
}

/** Crawlable prev/next links (plain anchors, no JavaScript required). */
export function Pagination({ dict, page, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) return null
  const hasPrevious = page > 1
  const hasNext = page < totalPages

  return (
    <nav
      aria-label={dict.pagination.label}
      className="mt-12 flex items-center justify-between gap-4"
    >
      {hasPrevious ? (
        <Link href={hrefForPage(page - 1)} rel="prev" className={buttonClasses('secondary')}>
          <ChevronLeft aria-hidden className="size-4" />
          {dict.pagination.previous}
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-muted">
        {format(dict.pagination.status, { page, total: totalPages })}
      </p>
      {hasNext ? (
        <Link href={hrefForPage(page + 1)} rel="next" className={buttonClasses('secondary')}>
          {dict.pagination.next}
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
