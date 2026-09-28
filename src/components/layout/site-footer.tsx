import type { ReactNode } from 'react'
import Link from 'next/link'
import type { Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import type { DestinationCard } from '@/lib/db/contracts'
import { format } from '@/lib/i18n/format'
import type { Dictionary } from '@/lib/i18n/types'
import { destinationPath, directoryPath, regionPath, staticPagePath } from '@/lib/routing/paths'
import { Brand } from './brand'

interface SiteFooterProps {
  locale: Locale
  dict: Dictionary
  destinations: readonly DestinationCard[]
  /** Regional hubs (e.g. Costa Daurada), linked above their destinations. */
  hubs: readonly { slug: string; name: string }[]
  /** Whether the contact page exists (a contact e-mail is configured). */
  hasContactPage: boolean
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-ink">{title}</p>
      <ul className="mt-3 space-y-3 text-sm text-muted">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      {/* Localized fixed routes are rewritten by Proxy; speculative segment
          prefetch can choose the overlapping dynamic destination route. */}
      <Link href={href} prefetch={false} className="transition-colors hover:text-ink">
        {children}
      </Link>
    </li>
  )
}

export function SiteFooter({ locale, dict, destinations, hubs, hasContactPage }: SiteFooterProps) {
  return (
    <footer className="mt-20 border-t border-line-soft md:mt-32">
      <div className="container-page pt-10 pb-7 md:pt-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3.5">
            <Brand size="sm" />
            <p className="max-w-60 text-sm leading-normal text-muted">{dict.footer.tagline}</p>
          </div>
          <FooterColumn title={dict.footer.destinations}>
            {hubs.map((hub) => (
              <FooterLink key={hub.slug} href={regionPath(locale, hub.slug)}>
                {hub.name}
              </FooterLink>
            ))}
            <FooterLink href={directoryPath(locale)}>{dict.nav.eatAndDrink}</FooterLink>
            {destinations.map((destination) => (
              <FooterLink key={destination.id} href={destinationPath(locale, destination.slug)}>
                {destination.name}
              </FooterLink>
            ))}
          </FooterColumn>
          <FooterColumn title={dict.footer.company}>
            <FooterLink href={staticPagePath(locale, 'about')}>{dict.footer.about}</FooterLink>
            <FooterLink href={staticPagePath(locale, 'editorial')}>
              {dict.footer.editorial}
            </FooterLink>
            {hasContactPage ? (
              <FooterLink href={staticPagePath(locale, 'contact')}>
                {dict.footer.contact}
              </FooterLink>
            ) : null}
          </FooterColumn>
          <FooterColumn title={dict.footer.legal}>
            <FooterLink href={staticPagePath(locale, 'legal')}>
              {dict.footer.legalNotice}
            </FooterLink>
            <FooterLink href={staticPagePath(locale, 'privacy')}>{dict.footer.privacy}</FooterLink>
            <FooterLink href={staticPagePath(locale, 'cookies')}>{dict.footer.cookies}</FooterLink>
          </FooterColumn>
        </div>
        <p className="mt-12 border-t border-line-soft pt-6 text-[13px] text-subtle">
          {format(dict.footer.rights, { year: new Date().getFullYear(), site: siteConfig.name })}
        </p>
      </div>
    </footer>
  )
}
