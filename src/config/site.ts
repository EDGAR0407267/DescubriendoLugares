/**
 * Brand and publisher settings. Changing the name here updates titles, Open
 * Graph and structured data; the header/footer wordmark splits it into its
 * sans and serif-italic halves (see components/layout/brand.tsx).
 */
import { parsePublisher } from './publisher'

const publisher = parsePublisher(process.env)

export const siteConfig = {
  name: 'DescubriendoLugares',
  wordmark: { lead: 'descubriendo', accent: 'lugares' },
  /** X/Twitter handle including "@", or null. */
  twitterHandle: publisher.twitterHandle,
  /** Legal publisher data, required by the legal notice (LSSI-CE). */
  publisher,
} as const
