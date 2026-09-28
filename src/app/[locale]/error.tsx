'use client'

import { useParams } from 'next/navigation'
import { defaultLocale, isLocale } from '@/config/i18n'
import { errorMessages } from '@/lib/i18n/error-messages'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams<{ locale: string }>()
  const messages = errorMessages[isLocale(params.locale) ? params.locale : defaultLocale]

  return (
    <main id="main" className="container-page py-24 sm:py-32">
      <h1 className="heading-display text-[clamp(30px,4vw,52px)] text-ink">{messages.title}</h1>
      <p className="mt-4 max-w-lg text-lg text-ink-soft">{messages.text}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex min-h-11 items-center rounded-control bg-ink px-6 text-sm font-medium text-white hover:bg-accent"
      >
        {messages.retry}
      </button>
    </main>
  )
}
