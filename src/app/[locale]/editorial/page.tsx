import type { Metadata } from 'next'
import { StaticPage, staticPageMetadata } from '@/components/layout/static-page'

export function generateMetadata({ params }: PageProps<'/[locale]/editorial'>): Promise<Metadata> {
  return staticPageMetadata('editorial', params)
}

export default function EditorialPage({ params }: PageProps<'/[locale]/editorial'>) {
  return <StaticPage page="editorial" params={params} />
}
