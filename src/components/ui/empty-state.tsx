import type { ReactNode } from 'react'
import { Compass } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 pt-16 pb-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full border border-line text-ink">
        <Compass aria-hidden className="size-6" strokeWidth={1.5} />
      </span>
      <p className="mt-3 text-[22px] leading-tight font-medium tracking-[-0.02em] text-ink">
        {title}
      </p>
      {description ? (
        <p className="mt-3 max-w-sm text-[15px] leading-normal text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
