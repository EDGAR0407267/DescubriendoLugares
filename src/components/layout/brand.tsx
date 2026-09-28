import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils/cn'

/** Wordmark: sans lead + serif-italic accent in the brand color. */
export function Brand({ size = 'md' }: { size?: 'md' | 'sm' }) {
  const { lead, accent } = siteConfig.wordmark
  return (
    <span className="flex items-baseline gap-px text-ink">
      <span
        className={cn(
          'font-semibold tracking-[-0.035em]',
          size === 'md' ? 'text-[19px]' : 'text-[18px]',
        )}
      >
        {lead}
      </span>
      <span
        className={cn('accent-serif text-accent', size === 'md' ? 'text-[22px]' : 'text-[21px]')}
      >
        {accent}
      </span>
    </span>
  )
}
