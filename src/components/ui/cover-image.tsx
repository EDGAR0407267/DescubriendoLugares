import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CoverImageProps {
  src: string | null
  alt: string
  sizes: string
  className?: string
  /** Above-the-fold hero images only (LCP candidate). */
  preload?: boolean
}

/** Responsive image filling its (aspect-ratio) parent; lazy unless preloaded. */
export function CoverImage({ src, alt, sizes, className, preload = false }: CoverImageProps) {
  return (
    <div className={cn('relative overflow-hidden bg-placeholder', className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-subtle">
          <ImageOff aria-hidden className="size-8" strokeWidth={1.25} />
        </div>
      )}
    </div>
  )
}
