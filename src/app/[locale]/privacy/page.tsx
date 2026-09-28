import type { Metadata } from 'next'
import { StaticPage, staticPageMetadata } from '@/components/layout/static-page'

export function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  return staticPageMetadata('privacy', params)
}

export default function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  return <StaticPage page="privacy" params={params} />
}
