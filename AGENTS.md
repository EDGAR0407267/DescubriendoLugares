<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project notes

- Architecture and decisions: `docs/ARCHITECTURE.md`. Setup and scripts: `README.md`.
- All public data reads go through `rpc()` (`src/lib/db/client.ts`) → SQL functions in
  `supabase/migrations/*_read_api.sql`, validated by Zod contracts in `src/lib/db/contracts.ts`.
  Changing a response shape = new migration + contract update + `test/database.test.ts`.
- Build URLs only with `src/lib/routing/paths.ts`; fixed localized segments live in
  `src/config/routes.ts`.
- UI strings: `src/lib/i18n/dictionaries` (es is the reference type). Editorial text belongs
  in the database or `src/content`, never in dictionaries.
- Index/noindex decisions only through `resolveIndexing()` (`src/lib/seo/indexing.ts`).
- Before finishing: `npm run validate` and, after a build, `npm run test:smoke`.
