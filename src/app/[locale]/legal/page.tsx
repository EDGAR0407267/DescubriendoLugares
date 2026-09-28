import type { Metadata } from 'next'
import { StaticPage, staticPageMetadata } from '@/components/layout/static-page'

export function generateMetadata({ params }: PageProps<'/[locale]/legal'>): Promise<Metadata> {
  return staticPageMetadata('legal', params)
}

export default function LegalPage({ params }: PageProps<'/[locale]/legal'>) {
  return <StaticPage page="legal" params={params} />
}
