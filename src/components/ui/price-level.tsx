import type { PriceLevel as Level } from '@/lib/db/contracts'
import type { Dictionary } from '@/lib/i18n/types'

export function PriceLevel({ level, dict }: { level: Level | null; dict: Dictionary }) {
  if (level === null) return null
  const label = `${dict.price.label}: ${dict.price.levels[level]}`
  return (
    <span className="text-sm tracking-wider" title={label}>
      <span className="sr-only">{label}</span>
      <span aria-hidden className="text-ink">
        {'€'.repeat(level)}
      </span>
      <span aria-hidden className="text-line-strong">
        {'€'.repeat(4 - level)}
      </span>
    </span>
  )
}
