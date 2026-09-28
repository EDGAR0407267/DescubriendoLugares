#!/usr/bin/env node
/**
 * Route smoke test against the production build.
 *
 *   npm run build && npm run test:smoke
 *
 * Starts `next start` on a free port (or uses SMOKE_BASE_URL if set), checks
 * status codes, redirects, localized routing, SEO tags and headers, then stops
 * the server. Expects the seed data (embedded database or a seeded Supabase).
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const PORT = Number(process.env.SMOKE_PORT ?? 3107)
const BASE = process.env.SMOKE_BASE_URL ?? `http://localhost:${PORT}`

/** [path, expected status, options] */
const checks = [
  ['/', 307, { location: '/es', headers: { 'accept-language': 'es-ES,es;q=0.9' } }],
  ['/', 307, { location: '/en', headers: { 'accept-language': 'en-GB,en;q=0.9' } }],
  ['/', 307, { location: '/ca', headers: { 'accept-language': 'en', cookie: 'NEXT_LOCALE=ca' } }],
  // Seed/embedded data is never indexable: noindex and no hreflang by design
  // (hreflang output itself is covered by unit tests).
  [
    '/es',
    200,
    {
      contains: ['<html lang="es"', 'rel="canonical"', 'noindex', '"@type":"WebSite"'],
      excludes: ['x-default'],
    },
  ],
  ['/en', 200, { contains: ['<html lang="en"', 'truly worth it.'] }],
  [
    '/es/cambrils',
    200,
    {
      contains: [
        '"@type":"TouristDestination"',
        'BreadcrumbList',
        'Restaurantes románticos en Cambrils',
        'Dónde comer y beber en Cambrils',
      ],
    },
  ],
  // Retired slug (slug_aliases) → permanent redirect to the current URL.
  ['/es/miami-playa', 308, { location: '/es/miami-platja' }],
  ['/en/miami-platja', 200],
  ['/ES/Salou', 308, { location: '/es/salou' }],
  [
    '/es/salou',
    200,
    {
      contains: [
        'Dónde comer y tomar algo',
        '/es/costa-daurada',
        'Otros destinos cercanos',
        '"@type":"TouristDestination"',
      ],
    },
  ],
  // Regional hub: every destination × type listing linked with descriptive anchors.
  [
    '/es/costa-daurada',
    200,
    {
      contains: [
        '<h1',
        'Costa Dorada',
        'Guía para comer y tomar algo',
        '/es/salou/restaurantes',
        'Cafeterías en Tarragona',
        '"@type":"CollectionPage"',
        '"containsPlace"',
      ],
    },
  ],
  ['/en/costa-daurada', 200, { contains: ['A guide to eating and drinking'] }],
  [
    '/es/hospitalet-de-l-infant',
    200,
    { contains: ['Restaurant Nàutic', '/es/comer-y-beber?destination=hospitalet-de-l-infant'] },
  ],
  [
    '/es/cambrils/restaurantes',
    200,
    { contains: ['Restaurantes en Cambrils', 'Demo Arrocería del Puerto'] },
  ],
  [
    '/es/cambrils/restaurantes?price=2&feature=terrace',
    200,
    { contains: ['Demo Trattoria Mare', 'noindex'], excludes: ['Demo Arrocería del Puerto'] },
  ],
  // Unpublished on purpose (seed.sql §5): it would rank unranked real places as "the best".
  ['/es/cambrils/mejores-restaurantes', 404],
  ['/es/cambrils/restaurantes-romanticos', 200, { contains: ['ItemList'] }],
  [
    '/es/salou/bares-de-tapas',
    200,
    {
      contains: ['Tapas en Salou', 'Malapecora', 'Sin orden de preferencia', 'aria-current="page"'],
      excludes: ['Casa Xavi', 'ranking orgánico'],
    },
  ],
  // Shared city category filter; counts and listings include secondary categories.
  [
    '/es/miami-platja',
    200,
    {
      contains: [
        '<h1',
        'Miami Platja',
        '>Todos<',
        '/es/miami-platja/brunch',
        '/es/miami-platja/bares',
      ],
      excludes: ['Miami Playa<'],
    },
  ],
  [
    '/es/salou/restaurantes',
    200,
    {
      contains: [
        'Restaurantes en Salou',
        'Dónde comer o cenar en Salou',
        'También en otros destinos',
        '/es/cambrils/restaurantes',
        '"@type":"CollectionPage"',
        '/es/salou/restaurantes/',
      ],
    },
  ],
  // A type without places in the destination is a real 404, not an empty page.
  ['/es/salou/beach-clubs', 404],
  [
    '/es/salou/brunch',
    200,
    { contains: ['Brunch en Salou', 'Sisters Cafe'], excludes: ['Malapecora'] },
  ],
  [
    '/es/cambrils/cafeterias',
    200,
    { contains: ['La Vilateria', 'Ehkis'], excludes: ['Twisted Lime'] },
  ],
  // Former "drinks" slug → the single bar listing.
  ['/es/cambrils/para-beber-algo', 308, { location: '/es/cambrils/bares' }],
  [
    '/es/cambrils/bares',
    200,
    { contains: ['Bares y copas en Cambrils', 'Kema Cambrils', 'Savash Beach'] },
  ],
  ['/es/salou/lugar/deliranto', 308, { location: '/es/salou/restaurantes/deliranto' }],
  ['/es/salou/restaurantes/deliranto', 200, { contains: ['Visitar web', 'deliranto.com'] }],
  ['/es/cambrils/restaurantes-frente-al-mar', 200, { contains: ['Demo Xiringuito de la Platja'] }],
  ['/es/cambrils/arroces', 200, { contains: ['Arroces en Cambrils'] }],
  ['/es/cambrils/chiringuitos', 200],
  ['/en/cambrils/restaurantes-romanticos', 308, { location: '/en/cambrils/romantic-restaurants' }],
  ['/fr/cambrils/restaurantes-romanticos', 404],
  // Place pages: /{locale}/{destination}/{type}/{place}; demo places get no business markup.
  [
    '/es/cambrils/restaurantes/demo-arroceria-del-puerto',
    200,
    {
      contains: ['Demo Arrocería del Puerto', 'openstreetmap.org/export/embed', 'ficticia'],
      excludes: ['"@type":"Restaurant"'],
    },
  ],
  // Old /lugar/ URLs, internal spellings and wrong type segments redirect permanently.
  [
    '/es/cambrils/lugar/demo-arroceria-del-puerto',
    308,
    { location: '/es/cambrils/restaurantes/demo-arroceria-del-puerto' },
  ],
  [
    '/de/cambrils/ort/demo-arroceria-del-puerto',
    308,
    { location: '/de/cambrils/restaurants/demo-arroceria-del-puerto' },
  ],
  [
    '/es/cambrils/cafeterias/demo-arroceria-del-puerto',
    308,
    { location: '/es/cambrils/restaurantes/demo-arroceria-del-puerto' },
  ],
  [
    '/de/cambrils/restaurants/demo-arroceria-del-puerto',
    200,
    { contains: ['noch nicht in deine Sprache'] },
  ],
  ['/es/cambrils/restaurantes/no-existe', 404],
  ['/es/cambrils/lugar/no-existe', 404],
  // Imported place: thin page → noindex; business markup only with real data
  // (published by the guide, not owned by it), Maps link, no internal notes.
  [
    '/es/salou/cafeterias/cafe-central',
    200,
    {
      contains: [
        'Café Central',
        'Ver en Google Maps',
        'noindex',
        'Abre una búsqueda por nombre',
        '"publisher":{"@id"',
        '/es/salou/cafeterias',
        'Café Central – Cafetería en Salou',
      ],
      excludes: [
        '"@type":"CafeOrCoffeeShop"',
        'contrastada',
        'visitsalou',
        'lucide-image-off',
        '"hasMap"',
        '"aggregateRating"',
        '"openingHours"',
      ],
    },
  ],
  [
    '/es/miami-platja/cafeterias/trece-brunch-speciality-coffee',
    200,
    {
      contains: ['query_place_id'],
      excludes: ['Avinguda de Barcelona, 160', 'Los Ángeles', '"hasMap"'],
    },
  ],
  [
    '/es/comer-y-beber',
    200,
    {
      contains: [
        'Dónde comer y beber',
        'Café Central',
        'Ver en Google Maps',
        'target="_blank"',
        'rel="noopener noreferrer"',
        'rel="canonical"',
      ],
      excludes: ['Consultar fuente', 'visitsalou', 'tripadvisor', 'Dirección no contrastada'],
    },
  ],
  [
    '/es/comer-y-beber?destination=miami-platja&type=tapas_bar',
    200,
    { contains: ['Casa Xavi', 'Ginger Café', 'noindex', '2 locales'], excludes: ['Malapecora'] },
  ],
  ['/es/comer-y-beber?q=miami+playa', 200, { contains: ['12 locales'] }],
  [
    '/es/comer-y-beber?q=Miami+Platja&type=drinks',
    200,
    { contains: ['4 locales', 'Mawui Beach', 'Ginger Café'] },
  ],
  [
    '/es/comer-y-beber?q=zzzz',
    200,
    { contains: ['No hay locales que coincidan', 'Ver todos los locales'] },
  ],
  ['/es/comer-y-beber?page=99', 404],
  ['/es/directory', 308, { location: '/es/comer-y-beber' }],
  ['/en/eat-and-drink', 200, { contains: ['Where to eat and drink', 'View on Google Maps'] }],
  [
    '/ca/menjar-i-beure?destination=miami-playa',
    200,
    { contains: ['/ca/menjar-i-beure?destination=miami-platja'] },
  ],
  ['/es/buscar', 200, { contains: ['Buscar lugares', 'noindex'] }],
  ['/es/buscar?destination=cambrils&feature=terrace', 200, { contains: ['Demo Trattoria Mare'] }],
  ['/es/buscar?q=cafe', 200, { contains: ['Demo Cafè del Passeig'] }],
  ['/es/search', 308, { location: '/es/buscar' }],
  ['/en/search', 200],
  ['/es/sobre-nosotros', 200, { contains: ['/es/como-seleccionamos'] }],
  [
    '/es/como-seleccionamos',
    200,
    { contains: ['Cómo seleccionamos los lugares', '"@type":"Organization"'] },
  ],
  ['/es/sobre-nosotros', 200, { contains: ['"@type":"AboutPage"'] }],
  ['/en/how-we-select', 200],
  // No contact e-mail configured (siteConfig.publisher.email): no contact page.
  ['/es/contacto', 404],
  ['/es/privacidad', 200],
  ['/es/cookies', 200, { contains: ['NEXT_LOCALE'] }],
  ['/es/aviso-legal', 200, { contains: ['Información del titular pendiente', 'noindex'] }],
  ['/de/impressum', 200],
  ['/es/no-existe', 404, { contains: ['No encontramos esta página'] }],
  ['/es/cambrils/no-existe', 404],
  ['/es/a/b/c/d', 404],
  ['/xx', 307, { location: '/es/xx', headers: { 'accept-language': 'es' } }],
  ['/robots.txt', 200, { contains: ['Disallow: /'] }],
  ['/sitemap.xml', 200, { contains: ['<sitemapindex'], excludes: ['<loc>'] }],
  [
    '/sitemaps/core.xml',
    200,
    {
      contains: ['<urlset'],
      excludes: ['<loc>', 'hreflang'],
    },
  ],
  [
    '/sitemaps/destination-cambrils.xml',
    200,
    {
      contains: ['<urlset'],
      // Demo and thin (imported, not yet enriched) place pages stay out.
      excludes: ['<loc>', 'demo-arroceria', '/lugar/', 'restaurantes-romanticos'],
    },
  ],
  ['/sitemaps/destination-nowhere.xml', 404],
  ['/manifest.webmanifest', 200, { contains: ['"name":"DescubriendoLugares"'] }],
  ['/icon.svg', 200],
  ['/logo.png', 200],
  ['/og-default.png', 200],
]

/**
 * SEO audit of representative pages (one per template and locale): each must
 * have a title, a meta description and a single H1; canonical must be an
 * absolute URL on the site origin; JSON-LD must parse; images need an alt
 * attribute; hreflang values must be supported locales or x-default; titles
 * and descriptions must not repeat across pages; internal links and sitemap
 * URLs must not be broken.
 */
const AUDIT_PAGES = [
  '/es',
  '/en',
  '/es/costa-daurada',
  '/es/salou',
  '/ca/salou',
  '/es/salou/restaurantes',
  '/es/salou/cafeterias',
  '/fr/salou/cafes',
  '/es/salou/cafeterias/cafe-central',
  '/de/cambrils/restaurants/demo-arroceria-del-puerto',
  '/es/comer-y-beber',
  '/es/como-seleccionamos',
]
const HREFLANGS = new Set(['es', 'ca', 'en', 'fr', 'de', 'it', 'x-default'])

const attr = (tag, name) =>
  new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1]?.replace(/&amp;/g, '&') ?? null

async function seoAudit() {
  const failures = []
  const seen = { title: new Map(), description: new Map() }
  const links = new Set()

  for (const path of AUDIT_PAGES) {
    const html = await (await fetch(`${BASE}${path}`)).text()
    const problems = []
    const head = html.slice(0, html.indexOf('</head>'))
    const title = /<title>([^<]*)<\/title>/.exec(head)?.[1]?.trim()
    const description = attr(/<meta name="description"[^>]*>/.exec(head)?.[0] ?? '', 'content')
    const canonical = attr(/<link rel="canonical"[^>]*>/.exec(head)?.[0] ?? '', 'href')
    const h1Count = (html.match(/<h1[\s>]/g) ?? []).length

    if (!title) problems.push('no <title>')
    if (!description) problems.push('no meta description')
    if (h1Count !== 1) problems.push(`${h1Count} <h1>`)
    // Absolute and self-referencing (prerendered pages carry the build-time
    // origin, so only the path is compared with the requested one).
    if (!canonical || !/^https?:[/][/][^/]+[/]/.test(canonical)) {
      problems.push(`canonical ${canonical}`)
    } else if (new URL(canonical).pathname !== path) {
      problems.push(`canonical points to ${new URL(canonical).pathname}`)
    }
    for (const [kind, value] of [
      ['title', title],
      ['description', description],
    ]) {
      if (!value) continue
      if (seen[kind].has(value)) problems.push(`duplicate ${kind} (also ${seen[kind].get(value)})`)
      seen[kind].set(value, path)
    }
    for (const tag of head.match(/<link rel="alternate" hrefLang="[^"]*"[^>]*>/g) ?? []) {
      if (!HREFLANGS.has(attr(tag, 'hrefLang'))) problems.push(`invalid hreflang ${tag}`)
    }
    for (const [, json] of html.matchAll(
      /<script type="application\/ld\+json">([^<]*)<\/script>/g,
    )) {
      try {
        JSON.parse(json)
      } catch {
        problems.push('invalid JSON-LD')
      }
    }
    for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
      if (!/\salt="/.test(tag)) problems.push(`img without alt ${tag.slice(0, 80)}`)
    }
    for (const [, href] of html.matchAll(/<a[^>]+href="(\/[^"#]*)/g)) {
      links.add(href.replace(/&amp;/g, '&'))
    }

    console.log(
      `${problems.length ? '✗' : '✓'} SEO ${path}${problems.length ? ` — ${problems.join('; ')}` : ''}`,
    )
    if (problems.length) failures.push(`SEO ${path}`)
  }

  const broken = []
  for (const href of links) {
    const response = await fetch(`${BASE}${href}`, { redirect: 'manual' })
    if (response.status >= 400) broken.push(`${response.status} ${href}`)
  }
  console.log(
    `${broken.length ? '✗' : '✓'} ${links.size} internal links${broken.length ? ` — ${broken.join('; ')}` : ''}`,
  )
  if (broken.length) failures.push('internal links')

  // Every sitemap URL answers 200 directly (no redirects, no 404s).
  const index = await (await fetch(`${BASE}/sitemap.xml`)).text()
  const sitemapUrls = []
  for (const [, loc] of index.matchAll(/<loc>([^<]*)<\/loc>/g)) {
    const xml = await (await fetch(loc.replace(/^https?:\/\/[^/]+/, BASE))).text()
    for (const [, url] of xml.matchAll(/<loc>([^<]*)<\/loc>/g)) sitemapUrls.push(url)
  }
  const badSitemap = []
  for (const url of sitemapUrls) {
    const response = await fetch(url.replace(/^https?:\/\/[^/]+/, BASE), { redirect: 'manual' })
    if (response.status !== 200) badSitemap.push(`${response.status} ${url}`)
    const html = await response.text()
    const robots = attr(/<meta name="robots"[^>]*>/.exec(html)?.[0] ?? '', 'content')
    if (!robots || robots.includes('noindex')) badSitemap.push(`noindex ${url}`)
    if (/demo-[a-z]/.test(new URL(url).pathname)) badSitemap.push(`demo ${url}`)
  }
  console.log(
    `${badSitemap.length ? '✗' : '✓'} ${sitemapUrls.length} sitemap URLs${badSitemap.length ? ` — ${badSitemap.join('; ')}` : ''}`,
  )
  if (badSitemap.length) failures.push('sitemap URLs')

  return failures
}

const REQUIRED_HEADERS = [
  'content-security-policy',
  'x-content-type-options',
  'referrer-policy',
  'x-frame-options',
]

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(url, { redirect: 'manual' })
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }
  throw new Error(`Server did not start at ${url}`)
}

async function run() {
  let server
  if (!process.env.SMOKE_BASE_URL) {
    const nextBin = require.resolve('next/dist/bin/next')
    server = spawn(process.execPath, [nextBin, 'start', '-p', String(PORT)], {
      stdio: ['ignore', 'ignore', 'inherit'],
      env: { ...process.env, NEXT_PUBLIC_SITE_URL: BASE },
    })
  }

  const failures = []
  try {
    await waitForServer(BASE)
    for (const [path, status, options = {}] of checks) {
      const response = await fetch(`${BASE}${path}`, {
        redirect: 'manual',
        headers: options.headers,
      })
      const body = status === 200 || status === 404 ? await response.text() : ''
      const problems = []
      if (response.status !== status) problems.push(`status ${response.status} ≠ ${status}`)
      if (options.location) {
        // Next.js 16.3 repeats an identical Location header on the first (cache
        // MISS) render of an ISR redirect; fetch joins them with ", ". All
        // values must still point to the expected URL.
        const locations = (response.headers.get('location') ?? '')
          .split(', ')
          .map((value) => new URL(value, BASE).pathname)
        if (locations.some((location) => location !== options.location)) {
          problems.push(`location ${locations.join(', ')} ≠ ${options.location}`)
        }
      }
      for (const text of options.contains ?? [])
        if (!body.includes(text)) problems.push(`missing "${text}"`)
      for (const text of options.excludes ?? [])
        if (body.includes(text)) problems.push(`unexpected "${text}"`)
      if (path === '/es') {
        for (const header of REQUIRED_HEADERS)
          if (!response.headers.has(header)) problems.push(`missing header ${header}`)
      }
      const label = `${options.headers?.['accept-language'] ? `[${options.headers['accept-language']}] ` : ''}${path}`
      console.log(
        `${problems.length ? '✗' : '✓'} ${status} ${label}${problems.length ? ` — ${problems.join('; ')}` : ''}`,
      )
      if (problems.length) failures.push(label)
    }

    const revalidate = await fetch(`${BASE}/api/revalidate`, { method: 'POST' })
    const expected = process.env.REVALIDATE_SECRET ? 401 : 501
    const ok = revalidate.status === expected
    console.log(`${ok ? '✓' : '✗'} ${expected} POST /api/revalidate (no credentials)`)
    if (!ok) failures.push('/api/revalidate')

    failures.push(...(await seoAudit()))
  } finally {
    server?.kill()
  }

  const total = checks.length + 1 + AUDIT_PAGES.length + 2
  console.log(`\n${total - failures.length}/${total} checks passed`)
  if (failures.length) process.exit(1)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
