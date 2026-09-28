import { brandMark } from '@/lib/brand/images'

export const dynamic = 'force-static'

/** /logo.png — 512×512 logo for Organization structured data and the manifest. */
export function GET() {
  return brandMark(512)
}
