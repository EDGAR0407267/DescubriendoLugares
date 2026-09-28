# DescubriendoLugares — plataforma de descubrimiento turístico

> Marca y wordmark en `src/config/site.ts`; tokens visuales (Geist + Instrument Serif, acento #1D5360) en `src/app/globals.css`.

Plataforma multilingüe para descubrir dónde comer y qué hacer en cada destino. Empieza por la
gastronomía de la Costa Daurada (Cambrils, Salou, Tarragona, Miami Platja, L'Hospitalet de
l'Infant), pero el modelo es genérico: `País → Región → Destino → Lugares / Guías / Categorías`.

Esta fase entrega la **infraestructura**: arquitectura, base de datos, rutas localizadas, SEO,
búsqueda, sistema de componentes, seeds, tests y documentación. No incluye login, pagos,
reservas, reviews propias ni CMS.

- Arquitectura detallada y decisiones: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Stack

| Área          | Elección                                                                    |
| ------------- | --------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Server Components, `proxy.ts`), React 19            |
| Lenguaje      | TypeScript estricto                                                         |
| Estilos       | Tailwind CSS v4 (tokens en `src/app/globals.css`), Geist + Instrument Serif |
| Datos         | Supabase (PostgreSQL) vía funciones SQL + RLS                               |
| Validación    | Zod (entorno, parámetros de URL, respuestas de la BD, filtros de landing)   |
| Iconos        | lucide-react                                                                |
| Calidad       | ESLint (config de Next), Prettier, Vitest                                   |
| Dev/CI sin BD | PGlite (Postgres en WASM) cargado con las mismas migraciones y seed         |

Dependencias de runtime: `next`, `react`, `react-dom`, `@supabase/supabase-js`, `zod`,
`lucide-react`, `server-only`. Nada más.

## Puesta en marcha

Requisitos: Node.js ≥ 20.9 (probado con Node 24).

```bash
npm install
cp .env.example .env.local   # opcional para empezar
npm run dev                  # http://localhost:3000
```

Sin variables de Supabase la app usa la **base de datos embebida** (PGlite): aplica
`supabase/migrations/*.sql` + `supabase/seed.sql` + `supabase/imports/*.sql` en memoria al
arrancar. Se muestra un aviso de "entorno de demostración" y el sitio queda en `noindex`.

## Variables de entorno

| Variable                                                                           | Obligatoria      | Descripción                                                                                         |
| ---------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                                             | En producción    | Origen canónico sin barra final (canonical, hreflang, OG, sitemaps).                                |
| `ALLOW_INDEXING`                                                                   | No               | `true` para permitir indexación con Supabase, origen público e identidad del titular completa.      |
| `PUBLISHER_LEGAL_NAME`, `PUBLISHER_TAX_ID`, `PUBLISHER_ADDRESS`, `PUBLISHER_EMAIL` | Antes de indexar | Identidad real del titular. Vacíos bloquean indexación; email valida formato.                       |
| `PUBLISHER_SOCIAL_URLS`, `PUBLISHER_TWITTER_HANDLE`                                | No               | Perfiles HTTPS separados por comas y cuenta X con `@`. Vacíos omiten propiedades.                   |
| `DATA_SOURCE`                                                                      | No               | `supabase` o `embedded`. Por defecto: `supabase` si hay credenciales, si no `embedded`.             |
| `SUPABASE_URL`                                                                     | En producción    | URL del proyecto Supabase. Solo servidor.                                                           |
| `SUPABASE_ANON_KEY`                                                                | En producción    | Clave anon (RLS aplica). Solo servidor: no lleva prefijo `NEXT_PUBLIC_`.                            |
| `REVALIDATE_SECRET`                                                                | Recomendada      | ≥ 32 caracteres. Protege `POST /api/revalidate`.                                                    |
| `GOOGLE_SITE_VERIFICATION`                                                         | No               | Token del meta tag de Search Console (solo el valor de `content`). Opcional si se verifica por DNS. |
| `BING_SITE_VERIFICATION`                                                           | No               | Token `msvalidate.01` de Bing Webmaster Tools.                                                      |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`                                                    | No               | GA4 (`G-…`). Sin valor no se carga ningún script de analítica.                                      |

La _service role key_ **nunca** se configura en esta app. `.env*` está en `.gitignore` salvo
`.env.example`. En un despliegue de producción de Vercel sin Supabase la app se niega a arrancar.

## Supabase

```bash
npx supabase init                   # crea supabase/config.toml (no toca migrations ni seed.sql)
npx supabase link --project-ref <ref>
npx supabase db push                # aplica supabase/migrations
```

En local con Docker: `npx supabase start` y `npx supabase db reset` (aplica migraciones + seed).

- **Migraciones** (`supabase/migrations/`): esquema, RLS, API de lectura SQL y bootstrap
  reproducible de idiomas, tipos, características, categorías, geografía, traducciones y aliases.
  Los datos base existentes se conservan mediante `ON CONFLICT DO NOTHING`.
- **Seed** (`supabase/seed.sql`): solo **5 lugares DEMO ficticios** y 3 landings de ejemplo,
  todos con `is_demo = true`. Nunca se carga en producción. RLS y las funciones públicas los
  ocultan a `anon` y `authenticated`; la conexión propietaria de PGlite habilita su vista demo.
- **Importaciones** (`supabase/imports/`, generadas): **60 locales reales** de la Costa Daurada
  importados desde Excel con `npm run import:places`. Solo necesitan las migraciones; en
  Supabase, con `psql`. Guía completa en [`docs/IMPORTS.md`](docs/IMPORTS.md).
- Tras editar datos en Supabase, invalida la caché:
  `curl -X POST $SITE/api/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET"`.

Preparación y revisión antes de publicar: [`docs/PRODUCTION.md`](docs/PRODUCTION.md).
Informe de los 60 locales: [`docs/DATA-QUALITY.md`](docs/DATA-QUALITY.md).
No uses `db reset --linked` en producción: destruye datos y puede cargar ejemplos.

## Scripts

| Script                  | Qué hace                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo                                                                                                              |
| `npm run build`         | Build de producción                                                                                                                 |
| `npm start`             | Sirve el build                                                                                                                      |
| `npm run lint`          | ESLint sin warnings permitidos                                                                                                      |
| `npm run typecheck`     | Genera tipos de rutas (`next typegen`) y ejecuta `tsc --noEmit`                                                                     |
| `npm test`              | Vitest: routing, SEO, i18n, dominio e integración real de la BD (PGlite)                                                            |
| `npm run test:smoke`    | Tras `build`: arranca `next start`; rutas, redirects, cabeceras, SEO, enlaces y sitemap; total calculado por el script              |
| `npm run check:content` | Audita el snapshot de migraciones + imports sin seed; `-- --report` genera informe, `-- --strict` exige fichas publicadas completas |
| `npm run import:places` | Lee el Excel de `data/imports/…` y regenera el SQL y el informe (docs/IMPORTS.md)                                                   |
| `npm run format`        | Prettier                                                                                                                            |
| `npm run validate`      | lint + typecheck + test + build                                                                                                     |

## Estructura

```text
src/
  app/                     Rutas (finas): solo componen features + componentes
    [locale]/              Layout raíz localizado, home, 404, error
      [destination]/       Destino u hub regional, colecciones ([segment]) y fichas ([segment]/[placeSlug])
      directory/           "Comer y beber": directorio con búsqueda y filtros en la URL
      search|about|privacy|cookies|legal/
    robots.ts, sitemap.xml/, sitemaps/[file]/, api/revalidate/
  proxy.ts                 Prefijo de idioma + segmentos localizados (sin cookies → cacheable)
  components/              UI reutilizable: ui/ layout/ places/ destinations/ categories/ search/ seo/
  features/                Dominio: consultas (server-only) + lógica pura testeable
    destinations/ places/ taxonomy/ landing-pages/ collections/ search/
    ranking/ recommendations/ sitemap/
  lib/
    db/                    Contratos Zod, catálogo RPC, clientes Supabase y embebido
    i18n/                  Diccionarios de UI, formato, negociación de idioma
    routing/               Constructores de URL y resolución de rutas localizadas
    seo/                   Metadata, indexación, JSON-LD, sitemaps XML
    maps/ analytics/ utils/ env.ts
  config/                  Idiomas, segmentos de URL, marca, umbrales SEO
  content/pages/           Textos editoriales de páginas fijas (separados de la UI)
supabase/                  migrations/ + seed.sql + imports/ (SQL generado por el importador)
data/imports/<fuente>/     Excel original, traducciones de especialidades e informe de importación
test/                      Vitest
scripts/smoke-test.mjs     Smoke test de rutas
scripts/import-places.mjs  Importador de hojas de cálculo (scripts/lib: lector xlsx + reglas)
```

Se descartó una carpeta `services/`: la lógica de dominio vive en `features/<dominio>` junto a
sus consultas, y la infraestructura transversal en `lib/`. Una carpeta más solo repartiría lo
mismo en dos sitios.

## Internacionalización

Seis idiomas desde el inicio: `es` (por defecto), `ca`, `en`, `fr`, `de`, `it`.

- **UI**: diccionarios TypeScript en `src/lib/i18n/dictionaries/` (el español es la referencia
  y el tipo; si falta una clave en otro idioma, no compila). Se cargan solo en servidor.
- **Contenido** (descripciones, intros, SEO de BD): tablas `*_translations` en Postgres, con
  fallback al español cuando falta una traducción (salvo landing pages, que solo existen donde
  se escribieron).
- **URLs** localizadas: `/es/cambrils/restaurantes`, `/en/cambrils/restaurants`,
  `/es/cambrils/restaurantes/{lugar}`, `/de/cambrils/restaurants/{lugar}`, `/es/costa-daurada`,
  `/es/buscar`, `/fr/mentions-legales`.
- Detección: cookie `NEXT_LOCALE` (elección explícita) → `Accept-Language` → `es`.

## SEO

Estrategia y checklist completos en [`docs/SEO.md`](docs/SEO.md).

Metadata API por página (title, description, canonical, hreflang + `x-default`, Open Graph,
Twitter), `robots.txt`, sitemap index + sitemaps por destino con alternates, breadcrumbs,
JSON-LD (`WebSite`, `TouristDestination`, `Restaurant`/`LocalBusiness` según tipo,
`BreadcrumbList`, `ItemList`) generado solo con datos reales, y una política de indexación
centralizada (`src/lib/seo/indexing.ts`). Detalle en `docs/ARCHITECTURE.md`.

## Google Search Console

Guía completa y checklist en [`docs/SEO.md`](docs/SEO.md). Resumen:

1. **Verificar el dominio**: en Search Console, «Añadir propiedad» → **Dominio** →
   `tudominio.com` y añadir el registro TXT que indica Google en el DNS (recomendado: cubre
   http/https y www). Alternativa (propiedad de prefijo de URL): copiar solo el valor `content`
   del meta tag en `GOOGLE_SITE_VERIFICATION`, redesplegar y pulsar «Verificar».
2. **Añadir el sitemap**: Sitemaps → `https://tudominio.com/sitemap.xml` (índice; enlaza
   `core.xml` y un sitemap por destino).
3. **Inspeccionar URLs**: «Inspección de URLs» con la home, `/es/costa-daurada`, una localidad
   (`/es/salou`) y un listado (`/es/salou/restaurantes`) → «Solicitar indexación».
4. **Comprobar indexación**: Indexación → Páginas. «Excluida por la etiqueta noindex» es lo
   esperado en filtros, buscador, fichas sin aprobación editorial por idioma y listados con < 3 locales.
5. **Core Web Vitals**: Experiencia → Métricas web principales (datos reales de Chrome; tardan
   ~28 días en aparecer). Complementar con PageSpeed Insights.
6. **Rendimiento en búsqueda**: Rendimiento → filtrar por página (`/es/salou/`) y por país;
   comparar consultas con el mapa de intenciones de `docs/SEO.md`.

## Deployment (Vercel)

1. Importa el repositorio en Vercel (framework detectado automáticamente).
2. Configura `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `REVALIDATE_SECRET`
   y los cuatro campos `PUBLISHER_*` de identidad; solo en producción y cuando el contenido
   esté revisado, `ALLOW_INDEXING=true`. La indexación se
   bloquea igualmente en previews, en `*.vercel.app` y con un `NEXT_PUBLIC_SITE_URL` de localhost;
   las peticiones a un host distinto del canónico reciben `X-Robots-Tag: noindex`.
   Redirige en Vercel (Domains) `www` ↔ dominio raíz hacia el canónico; HTTPS es automático.
3. Aplica las migraciones al proyecto Supabase antes del primer despliegue.

## Convenciones

- Código, identificadores y comentarios en inglés; documentación de producto en español.
- Server Components por defecto. Componentes cliente solo cuando hay interacción real
  (`LanguageMenu`, `OutboundLink`, `error.tsx`).
- Toda lectura de datos pasa por `rpc()` y se valida con un contrato Zod.
- Filtros = parámetros de URL (formularios GET): compartibles y sin JS.
- Nada de ratings, reseñas ni datos inventados. Lo patrocinado nunca entra en el ranking.
- Commits pequeños; `npm run validate` debe pasar antes de integrar.

## Problemas conocidos

- **Next.js 16.3.6**: en el primer render (cache MISS) de una página ISR que redirige, la
  cabecera `Location` se emite dos veces con el mismo valor. Navegadores y Googlebot lo
  aceptan y las respuestas posteriores (HIT) la envían una sola vez. Revisar al actualizar Next.
