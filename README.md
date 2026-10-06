# DescubriendoLugares

A multilingual place discovery platform starting with food and travel in Costa Daurada, Spain. Its data model supports countries, regions, destinations, places, guides, and categories.

[Detailed Spanish guide](README.es.md) · [Architecture](docs/ARCHITECTURE.md) · [Production checklist](docs/PRODUCTION.md)

## Overview

The current project focuses on a reproducible foundation for destination discovery: localized routes, searchable listings, structured place data, SEO, and a database backed read API. It does not yet include accounts, payments, bookings, user reviews, or a CMS.

## Features

- Localized UI and routes in Spanish, Catalan, English, French, German, and Italian.
- Destination and category pages, place details, and URL based search filters.
- SQL migrations, row level security, typed read contracts, and a local embedded database for development.
- Canonical and alternate language metadata, structured data, robots rules, and sitemaps.
- Lint, type checking, database integration tests, content checks, and route smoke tests.

## Tech Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase/PostgreSQL, Zod, PGlite, Vitest, ESLint, and Prettier.

## Architecture

`src/app/` composes routes from domain modules in `src/features/`. Data reads go through `src/lib/db/` to SQL functions in `supabase/migrations/`, with response shapes checked by Zod. UI dictionaries and editorial content are separate. The local PGlite mode loads the same migrations and seed data without an external database. See the [architecture guide](docs/ARCHITECTURE.md).

## Getting Started

### Prerequisites

Node.js 20.9 or newer and npm. A Supabase project is optional for local exploration.

### Installation and local run

```bash
git clone https://github.com/EDGAR0407267/DescubriendoLugares.git
cd DescubriendoLugares
npm ci
npm run dev
```

Open `http://localhost:3000`. Without Supabase variables, the app uses its embedded PGlite demonstration database. The demo is excluded from indexing.

### Environment variables

Copy `.env.example` to `.env.local` when configuring a public origin, Supabase, indexing, or analytics. `SUPABASE_URL` and `SUPABASE_ANON_KEY` are required for the Supabase data source. Production publication also requires a reviewed canonical URL and publisher identity; see [production setup](docs/PRODUCTION.md). Never commit `.env.local`.

### Validation

Run `npm run validate` for lint, types, tests, and build. After a build, `npm run test:smoke` checks routes, redirects, headers, links, and sitemap output. `npm run check:content` audits imported place content.

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/app/` | Localized pages and server routes |
| `src/features/` | Place, destination, search, ranking, and sitemap logic |
| `src/lib/` | Database contracts, routing, i18n, and SEO utilities |
| `supabase/` | SQL migrations, seed, and imported place data |
| `data/`, `scripts/` | Source data and import tools |
| `test/`, `docs/` | Tests and technical documentation |

## Status

**In Development.** The platform foundation and demonstration mode are implemented; publication depends on content and production setup checks.

## Author

Edgar Pedret Girones · [GitHub](https://github.com/EDGAR0407267)
