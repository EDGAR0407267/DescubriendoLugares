import { DataIcon } from './icon'

export function FeatureBadge({ name, icon }: { name: string; icon: string | null }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-[11px] py-[7px] text-[13px] leading-none text-ink-soft">
      <DataIcon name={icon} className="size-3.5 text-muted" />
      {name}
    </span>
  )
}
