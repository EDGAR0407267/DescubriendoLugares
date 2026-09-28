import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { publisherIsComplete } from '@/config/publisher'
import { publisherNotice } from '@/content/pages/publisher-notice'
import { getStaticPageContent, type ContentPage } from '@/content/pages'
import { getServerEnv } from '@/lib/env'
import { assertLocale } from '@/lib/i18n/params'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { buildLanguageLinks, pathsForAllLocales } from '@/lib/routing/language-links'
import { staticPagePath } from '@/lib/routing/paths'
import { resolveIndexing } from '@/lib/seo/indexing'
import { organizationSchema, webPageSchema } from '@/lib/seo/json-ld'
import { buildMetadata } from '@/lib/seo/metadata'
import { JsonLdScript } from '@/components/seo/json-ld'
import { SiteHeader } from './site-header'

type LocaleParams = Promise<{ locale: string }>

/** Pages about the project itself (E-E-A-T): indexable, unlike legal texts. */
const EDITORIAL_PAGES: readonly ContentPage[] = ['about', 'editorial', 'contact']

/** The contact page only exists when a contact e-mail is configured. */
export function isPageAvailable(page: ContentPage): boolean {
  return page !== 'contact' || Boolean(siteConfig.publisher.email)
}

export async function staticPageMetadata(
  page: ContentPage,
  params: LocaleParams,
): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  if (!isPageAvailable(page)) notFound()
  const content = await getStaticPageContent(locale, page)
  const env = getServerEnv()
  return buildMetadata(
    {
      locale,
      title: content.title,
      description: content.description,
      path: staticPagePath(locale, page),
      alternates: pathsForAllLocales((target) => staticPagePath(target, page)),
      robots: resolveIndexing({
        kind: EDITORIAL_PAGES.includes(page) ? 'about' : 'legal',
        siteIndexable: env.allowIndexing,
      }),
    },
    env.siteUrl,
  )
}

/** Publisher identification required by the legal notice (only filled fields). */
function PublisherDetails() {
  const { legalName, taxId, address, email } = siteConfig.publisher
  const rows = [legalName, taxId, address, email].filter((value): value is string => Boolean(value))
  if (rows.length === 0) return null
  return (
    <address className="mt-10 space-y-1 rounded-card bg-sunken p-6 text-sm not-italic text-ink-soft">
      {rows.map((row) => (
        <p key={row}>{row}</p>
      ))}
    </address>
  )
}

export async function StaticPage({ page, params }: { page: ContentPage; params: LocaleParams }) {
  const locale = assertLocale((await params).locale)
  if (!isPageAvailable(page)) notFound()
  const [content, dict] = await Promise.all([
    getStaticPageContent(locale, page),
    getDictionary(locale),
  ])
  const env = getServerEnv()
  const url = `${env.siteUrl}${staticPagePath(locale, page)}`
  const email = siteConfig.publisher.email
  return (
    <>
      <SiteHeader
        locale={locale}
        languageLinks={buildLanguageLinks(
          pathsForAllLocales((target) => staticPagePath(target, page)),
        )}
      />
      <main id="main" className="container-page py-12 sm:py-16">
        <article className="max-w-2xl">
          <h1 className="heading-display text-[clamp(30px,4vw,52px)] text-ink">{content.title}</h1>
          <p className="mt-4 text-lg text-ink-soft">{content.description}</p>
          {page === 'legal' ? <PublisherDetails /> : null}
          {page === 'legal' && !publisherIsComplete(siteConfig.publisher) ? (
            <p className="mt-6 rounded-card bg-sunken p-6 text-sm text-ink-soft">
              {publisherNotice[locale]}
            </p>
          ) : null}
          {content.sections.map((section) => (
            <section key={section.heading} className="mt-10">
              <h2 className="text-[22px] leading-tight font-medium tracking-[-0.025em] text-ink">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-4 leading-relaxed text-ink-soft">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
          {page === 'contact' && email ? (
            <p className="mt-6 text-lg">
              <a href={`mailto:${email}`} className="link-underline font-medium text-ink">
                {email}
              </a>
            </p>
          ) : null}
          {page === 'about' ? (
            <p className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href={staticPagePath(locale, 'editorial')} className="link-underline text-ink">
                {dict.footer.editorial}
              </Link>
              {isPageAvailable('contact') ? (
                <Link href={staticPagePath(locale, 'contact')} className="link-underline text-ink">
                  {dict.footer.contact}
                </Link>
              ) : null}
            </p>
          ) : null}
        </article>
      </main>
      {EDITORIAL_PAGES.includes(page) ? (
        <JsonLdScript
          data={[
            organizationSchema({ siteUrl: env.siteUrl, email }),
            webPageSchema({
              type: page === 'about' ? 'AboutPage' : 'WebPage',
              url,
              name: content.title,
              description: content.description,
              locale,
              siteUrl: env.siteUrl,
              about: { '@id': `${env.siteUrl}/#organization` },
            }),
          ]}
        />
      ) : null}
    </>
  )
}
