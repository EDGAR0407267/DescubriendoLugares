'use client'

import type { AnchorHTMLAttributes } from 'react'
import { track } from '@/lib/analytics/track'
import type { OutboundKind } from '@/lib/analytics/events'

interface OutboundLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  kind: OutboundKind
  placeId?: string
  /** Paid/affiliate links must be marked rel="sponsored" (Google policy). */
  sponsored?: boolean
}

/** External link that reports an analytics event; safe rel defaults. */
export function OutboundLink({
  kind,
  placeId,
  sponsored = false,
  href,
  onClick,
  ...props
}: OutboundLinkProps) {
  const isWeb = href.startsWith('http')
  return (
    <a
      href={href}
      {...(isWeb
        ? {
            target: '_blank',
            rel: sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer',
          }
        : {})}
      onClick={(event) => {
        track({ name: 'outbound_click', params: { kind, placeId, url: href } })
        onClick?.(event)
      }}
      {...props}
    />
  )
}
