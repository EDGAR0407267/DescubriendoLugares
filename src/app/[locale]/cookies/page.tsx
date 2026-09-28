import type { Metadata } from 'next'
import { StaticPage, staticPageMetadata } from '@/components/layout/static-page'

export function generateMetadata({ params }: PageProps<'/[locale]/cookies'>): Promise<Metadata> {
  return staticPageMetadata('cookies', params)
}

export default function CookiesPage({ params }: PageProps<'/[locale]/cookies'>) {
  return <StaticPage page="cookies" params={params} />
}
