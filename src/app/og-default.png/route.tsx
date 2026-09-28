import { defaultShareImage } from '@/lib/brand/images'

export const dynamic = 'force-static'

/** /og-default.png — share image of pages without a photo (see buildMetadata). */
export function GET() {
  return defaultShareImage()
}
