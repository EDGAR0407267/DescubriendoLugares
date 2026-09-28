import Link from 'next/link'

interface SectionHeadingProps {
  title: string
  description?: string | null
  /** Optional "view all" style link aligned to the right. */
  action?: { href: string; label: string } | null
  id?: string
  as?: 'h1' | 'h2' | 'h3'
}

export function SectionHeading({
  title,
  description,
  action,
  id,
  as: Tag = 'h2',
}: SectionHeadingProps) {
  return (
    <div className="mb-[22px] flex items-end justify-between gap-4">
      <div className="flex max-w-2xl flex-col gap-1.5">
        <Tag id={id} className="heading-section text-2xl text-ink md:text-[32px]">
          {title}
        </Tag>
        {description ? <p className="text-[15px] leading-snug text-muted">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="link-underline flex-none py-2 text-sm font-medium text-ink"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
