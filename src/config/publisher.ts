import { z } from 'zod'

const optionalText = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined),
  z.string().min(1).optional(),
)

/** Public publisher identity only; never place credentials in these variables. */
export function parsePublisher(source: Record<string, string | undefined>) {
  const fields = z
    .object({
      PUBLISHER_LEGAL_NAME: optionalText,
      PUBLISHER_TAX_ID: optionalText,
      PUBLISHER_ADDRESS: optionalText,
      PUBLISHER_EMAIL: optionalText.pipe(z.email().optional()),
      PUBLISHER_SOCIAL_URLS: optionalText,
      PUBLISHER_TWITTER_HANDLE: optionalText.pipe(
        z
          .string()
          .regex(/^@[A-Za-z0-9_]{1,15}$/)
          .optional(),
      ),
    })
    .parse(source)
  return {
    legalName: fields.PUBLISHER_LEGAL_NAME ?? null,
    taxId: fields.PUBLISHER_TAX_ID ?? null,
    address: fields.PUBLISHER_ADDRESS ?? null,
    email: fields.PUBLISHER_EMAIL ?? null,
    socialUrls: z
      .array(z.url({ protocol: /^https$/ }))
      .parse(fields.PUBLISHER_SOCIAL_URLS?.split(',').map((url) => url.trim()) ?? []),
    twitterHandle: fields.PUBLISHER_TWITTER_HANDLE ?? null,
  }
}

export function publisherIsComplete(publisher: ReturnType<typeof parsePublisher>) {
  return Boolean(publisher.legalName && publisher.taxId && publisher.address && publisher.email)
}
