import type { Metadata } from 'next'
import { StaticPage, staticPageMetadata } from '@/components/layout/static-page'

export function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  return staticPageMetadata('contact', params)
}

export default function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  return <StaticPage page="contact" params={params} />
}
