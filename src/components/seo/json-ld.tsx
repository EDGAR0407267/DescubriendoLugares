import { serializeJsonLd, type JsonLd } from '@/lib/seo/json-ld'

/** Structured data script. Null entries (e.g. demo places) are skipped. */
export function JsonLdScript({ data }: { data: (JsonLd | null)[] }) {
  const items = data.filter((item): item is JsonLd => item !== null)
  if (items.length === 0) return null
  return (
    <script
      type="application/ld+json"
      // Safe: serializeJsonLd escapes "<", so content cannot break out of the tag.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(items.length === 1 ? items[0] : items) }}
    />
  )
}
