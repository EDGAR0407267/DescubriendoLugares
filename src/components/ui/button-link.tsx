import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'outline'

const variants: Record<Variant, string> = {
  // Ink fill that turns brand teal on hover, as in the design mockups.
  primary: 'bg-ink text-white hover:bg-accent active:bg-accent-strong',
  secondary: 'border border-line bg-surface text-ink hover:border-ink',
  outline: 'border border-ink bg-transparent text-ink hover:bg-sunken',
}

export function buttonClasses(variant: Variant = 'primary', className?: string): string {
  return cn(
    'inline-flex h-11 items-center justify-center gap-2 rounded-control px-[18px] text-sm font-medium whitespace-nowrap transition-colors',
    variants[variant],
    className,
  )
}

export function ButtonLink({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClasses(variant, className)} {...props} />
}
