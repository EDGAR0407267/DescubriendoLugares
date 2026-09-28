import type { Metadata } from 'next'
import { StaticPage, staticPageMetadata } from '@/components/layout/static-page'

export function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
  return staticPageMetadata('about', params)
}

export default function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  return <StaticPage page="about" params={params} />
}
