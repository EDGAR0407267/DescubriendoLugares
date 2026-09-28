import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import { CoverImage } from './cover-image'

interface HeroProps {
  /** Short context line under the description (e.g. region and country). */
  meta?: string | null
  title: string
  /**
   * Second line of the H1 (e.g. "Dónde comer y tomar algo"): states the
   * page intent without turning the display title into a sentence.
   */
  titleSuffix?: string | null
  description?: string | null
  image?: { src: string | null; alt: string; credit?: string | null } | null
  children?: ReactNode
}

/**
 * Destination-style page header: wide photograph, oversized title on the
 * left and the editorial description on the right.
 */
export function Hero({ meta, title, titleSuffix, description, image, children }: HeroProps) {
  return (
    <header className="container-page pt-4">
      {image ? (
        <figure>
          <CoverImage
            src={image.src}
            alt={image.alt}
            preload
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="h-[clamp(260px,36vw,500px)] rounded-[clamp(14px,1.6vw,20px)]"
          />
          {image.credit ? (
            <figcaption className="mt-2 text-right text-xs text-subtle">{image.credit}</figcaption>
          ) : null}
        </figure>
      ) : null}
      <div className="grid items-end gap-4 pt-6 md:grid-cols-2 md:gap-12 md:pt-10">
        <h1 className="heading-display text-[clamp(48px,7.4vw,104px)] leading-[0.92] tracking-[-0.055em] text-ink">
          {title}
          {titleSuffix ? (
            <span className="mt-3 block font-sans text-[clamp(18px,1.7vw,24px)] leading-snug font-normal tracking-[-0.015em] text-muted">
              {titleSuffix}
            </span>
          ) : null}
        </h1>
        {description || meta ? (
          <div className="flex max-w-[520px] flex-col gap-3">
            {description ? (
              <p className="text-[17px] leading-relaxed text-pretty text-ink-soft">{description}</p>
            ) : null}
            {meta ? (
              <span className="flex items-center gap-1.5 text-[13px] text-subtle">
                <MapPin aria-hidden className="size-3.5" strokeWidth={1.8} />
                {meta}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      {children}
    </header>
  )
}
