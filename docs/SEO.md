# SEO

Principio: el SEO sale de la arquitectura y de datos reales, no de texto de relleno. Ninguna
plantilla afirma algo que la base de datos no respalde (ni valoraciones, ni horarios, ni
«mejores» sin ranking real), y ninguna combinación de filtros crea páginas indexables.

## 1. Arquitectura de URLs

`IDIOMA → (HUB REGIONAL) → LOCALIDAD → CATEGORÍA → LOCAL`, generada desde la BD.

| Página                   | URL (es)                                                        | Plantilla                                      |
| ------------------------ | --------------------------------------------------------------- | ---------------------------------------------- |
| Home                     | `/es`                                                           | `src/app/[locale]/page.tsx`                    |
| Hub regional             | `/es/costa-daurada`                                             | `[destination]/page.tsx` → `RegionView`        |
| Localidad                | `/es/salou`                                                     | `[destination]/page.tsx`                       |
| Categoría + localidad    | `/es/salou/restaurantes`                                        | `[destination]/[segment]/page.tsx` (tipo)      |
| Guía editorial (landing) | `/es/cambrils/restaurantes-romanticos`                          | idem (`landing_pages`)                         |
| Categoría editorial      | `/es/cambrils/arroces`                                          | idem (`categories`)                            |
| Local                    | `/es/salou/cafeterias/cafe-central`                             | `[destination]/[segment]/[placeSlug]/page.tsx` |
| Directorio               | `/es/comer-y-beber`                                             | sin filtros indexable; con filtros `noindex`   |
| Editorial / E-E-A-T      | `/es/sobre-nosotros`, `/es/como-seleccionamos`, `/es/contacto`* | `static-page.tsx`                              |

\* `/contacto` solo existe si `siteConfig.publisher.email` está configurado.

Slugs por idioma en BD (`*_translations.slug`), segmentos fijos en `src/config/routes.ts`, URLs
siempre con `src/lib/routing/paths.ts`. Categorías normalizadas como `place_types`
(`restaurant`, `cafe`, `brunch`, `tapas_bar`, `drinks`, `beach_club`…) con relación N:M a los
locales (`place_secondary_types`): un local aparece en varios listados sin duplicarse; su URL
cuelga de su tipo principal.

| Tipo       | es             | ca            | en          | fr           | de          | it           |
| ---------- | -------------- | ------------- | ----------- | ------------ | ----------- | ------------ |
| restaurant | restaurantes   | restaurants   | restaurants | restaurants  | restaurants | ristoranti   |
| cafe       | cafeterias     | cafeteries    | cafes       | cafes        | cafes       | caffe        |
| brunch     | brunch         | brunch        | brunch      | brunch       | brunch      | brunch       |
| tapas_bar  | bares-de-tapas | bars-de-tapes | tapas-bars  | bars-a-tapas | tapas-bars  | bar-di-tapas |
| drinks     | bares          | bars          | bars        | bars         | bars        | bar          |

### Una URL por recurso

- **Mayúsculas** → 308 a minúsculas (`src/lib/routing/localized-pathname.ts`).
- **Barra final** → 308 a la URL sin barra (comportamiento por defecto de Next).
- **Sin idioma** (`/salou`) → 307 al idioma negociado (depende del visitante, no es permanente).
- **Slug de otro idioma** o **retirado** (`slug_aliases`) → 308 a la URL actual del idioma.
- **Fichas**: cualquier segmento de tipo distinto del principal, o las antiguas `/lugar/…`,
  → 308 a la canónica.
- **Filtros/orden/búsqueda** (`?price=`, `?feature=`, `?sort=`, `?q=`…) → `noindex, follow` y
  canonical a la URL limpia. La paginación limpia (`?page=2`) es indexable con canonical propio.
- **Hosts**: solo `NEXT_PUBLIC_SITE_URL` es canónico. Otros hosts (alias `*.vercel.app`, IP)
  reciben `X-Robots-Tag: noindex` y un robots.txt `Disallow: /`. `www`↔raíz y HTTP→HTTPS se
  configuran en el dominio (Vercel → Domains).
- **Renombrar un slug publicado**: cambiarlo en su tabla y añadir el antiguo a `slug_aliases`
  (`kind` = `destination` | `place_type` | `category` | `landing_page` | `place`; `scope_id` =
  destino para `place` y `landing_page`). Nunca se redirige a la home.
- **Local eliminado**: `status <> 'published'` → 404 real. Si hay un sustituto lógico, alias
  de tipo `place` hacia él.

## 2. Mapa de intenciones

Una página por clúster de intención; las variantes se cubren con la misma URL (no se crea una
landing por variación de keyword). Plantillas en `src/content/seo/{idioma}.ts`, datos de la BD.

| Página                     | Consultas objetivo (es)                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `/es/costa-daurada`        | costa dorada / daurada, dónde comer costa dorada, guía costa dorada, pueblos costa dorada |
| `/es/salou`                | dónde comer en salou, salou guía, sitios en salou, qué hacer en salou (cuando haya datos) |
| `/es/salou/restaurantes`   | restaurantes salou, mejores restaurantes salou, dónde comer / cenar en salou              |
| `/es/salou/cafeterias`     | cafeterías salou, dónde desayunar / tomar café en salou                                   |
| `/es/salou/brunch`         | brunch salou, dónde hacer brunch en salou                                                 |
| `/es/salou/bares-de-tapas` | tapas salou, bares de tapas salou, dónde tapear en salou                                  |
| `/es/salou/bares`          | bares salou, dónde tomar algo / una copa en salou                                         |
| Ficha                      | nombre del local (+ localidad), «nombre + tipo + localidad»                               |
| Landing editorial          | long tail con contenido propio: «restaurantes románticos cambrils», «frente al mar»…      |

«Mejores…»: los listados no se titulan «mejores» mientras no haya `ranking_score` real
(se mostraría una selección sin ordenar como ranking). Cuando exista, crear la landing
con contenido real; `best-restaurants` en `seed.sql` es solo un ejemplo despublicado,
marcado demo y oculto a los roles públicos.

Long tail (desayunar frente al mar, cenar en pareja…): **landing pages** en BD
(`landing_pages` + traducciones, texto editorial propio, filtros validados). Solo se publican
cuando hay locales y texto que respondan a esa intención.

## 3. Indexabilidad condicional

`resolveIndexing()` (`src/lib/seo/indexing.ts`) decide `index/noindex` con datos reales:

| Caso                                                                                      | Resultado         |
| ----------------------------------------------------------------------------------------- | ----------------- |
| `ALLOW_INDEXING≠true`, titular incompleto, datos demo, preview, host localhost/vercel.app | noindex, nofollow |
| Buscador, legales, filtros/orden/texto                                                    | noindex, follow   |
| Ficha demo o sin mínimos y aprobación editorial por idioma                                | noindex, follow   |
| Landing demo, sin texto propio suficiente o < 3 resultados reales                         | noindex, follow   |
| Contenido en idioma de fallback (sin traducción)                                          | noindex, follow   |
| Listado con < 3 locales (`MIN_PLACES_FOR_INDEXABLE_COLLECTION`)                           | noindex, follow   |
| Tipo sin locales en la localidad                                                          | **404**           |
| Localidad / hub sin locales                                                               | noindex, follow   |

Solo lo indexable entra en el sitemap y en hreflang. Mientras el sitio esté bloqueado, los
sitemaps HTTP están vacíos. Con los 60 locales actuales son candidatos home, hub, localidades,
listados de tipo con ≥ 3 locales, páginas editoriales y directorio; **ninguna ficha** cumple aún
los mínimos. Se exige revisión explícita (`is_verified`), imagen autorizada con crédito,
ubicación y textos propios por idioma. Una descripción larga por sí sola no basta.
Mínimos exactos e identidad del titular: [`PRODUCTION.md`](PRODUCTION.md).

## 4. Metadata

`buildMetadata()` (`src/lib/seo/metadata.ts`) para todas las páginas: title (la marca
`· DescubriendoLugares` se añade solo si el total cabe en 65 caracteres), description truncada
por palabra, canonical absoluto, hreflang + `x-default` (español), `robots` con
`max-image-preview:large` en páginas indexables, Open Graph (`og:locale` + alternates, imagen
propia o `/og-default.png`) y Twitter `summary_large_image`. Prioridad de textos: SEO editorial
de BD (`seo_title`, `seo_description`) → plantilla por intención con datos reales.

## 5. Datos estructurados

| Página    | JSON-LD                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Home      | `Organization` (logo `/logo.png`) + `WebSite` (publisher)                                                    |
| Hub       | `CollectionPage` → `about: TouristDestination` (`containsPlace` ciudades) + `ItemList`                       |
| Localidad | `TouristDestination` + `WebPage` (`about`, `mainEntity: ItemList`)                                           |
| Listado   | `CollectionPage` (`mainEntity: ItemList` de los locales) + `BreadcrumbList`                                  |
| Local     | `WebPage` publicado por la guía con `about` = `Restaurant`/`CafeOrCoffeeShop`/`BarOrPub`/`FoodEstablishment` |
| Editorial | `AboutPage`/`WebPage` + `Organization`                                                                       |

Todas llevan `BreadcrumbList` (mismo array que las migas visibles). Nodos enlazados por `@id`.
El negocio **nunca** lleva a la guía como `owner`/`publisher`: la guía publica la página que
lo describe. Sin `aggregateRating` de terceros, sin `openingHours`, `telephone`, `priceRange`
ni `geo` si no están en la BD; `hasMap` solo con enlaces que apuntan a una ficha o punto real
(no a búsquedas de texto). Lugares demo: sin nodo de negocio.

## 6. Enlazado interno

Home → hub → localidad → listado → local, con migas visibles en cada nivel, y además:

- **Hub**: cada localidad × tipo con anchor descriptivo («Cafeterías en Tarragona»).
- **Localidad**: chips de tipos, guías, categorías y «Otros destinos cercanos» (distancia real).
- **Listado**: chips de otros tipos de la localidad y «También en otros destinos» (mismo tipo
  en las localidades más cercanas del hub, máx. 4 → escala a cientos de destinos).
- **Ficha**: migas con el listado de su tipo, «Más {tipo} en {localidad}», similares, cercanos
  y «Explora {localidad}».
- **Footer**: hubs, directorio, localidades, páginas editoriales.

Todo son `<a href>` renderizados en servidor (sin JS). La paginación usa enlaces
`rel="prev/next"` rastreables.

## 7. Sitemap y robots

- `/sitemap.xml` (índice) → `/sitemaps/core.xml` (home, sobre nosotros, cómo seleccionamos,
  directorio, hubs, localidades) + `/sitemaps/destination-{slug}.xml` (listados con masa
  crítica, landings, categorías, fichas indexables). Cada URL con su clúster hreflang y
  `lastmod` real. Se regenera cada hora y con `POST /api/revalidate`.
- `robots.txt`: `Allow: /`, `Disallow: /api/`, `Sitemap:`; `Disallow: /` fuera de producción o
  fuera del host canónico. No bloquea CSS/JS/imágenes ni URLs con filtros (deben poder leer su
  `noindex`).

## 8. Rendimiento, imágenes y móvil

Server Components (3 componentes cliente), filtros sin JS, SSG/ISR, `next/image` con AVIF/WebP,
`sizes` por plantilla, `preload` solo en la imagen LCP (hero), lazy en el resto, dimensiones
fijadas por `aspect-ratio` (sin CLS), fuentes `next/font` auto-alojadas con `swap`, mapa OSM en
iframe perezoso. GA4 (si se configura) carga en `lazyOnload`. Alt: nombre del local o destino,
nunca listas de keywords; decorativas con `alt=""`. Sin foto autorizada no se muestra imagen.

## 9. E-E-A-T y confianza

«Sobre nosotros», «Cómo seleccionamos» (fuentes, qué no publicamos, independencia,
correcciones) y «Contacto» (al configurar el email). Cada ficha muestra «Datos actualizados el…»
(`updated_at` real) y las guías editoriales su fecha de actualización. Aviso de que un listado
sin ranking «no es un ranking».

## 10. Escalar

- **Nueva localidad**: filas en `destinations` + `destination_translations` (6 idiomas) y
  locales → página, listados, metadata, schema, sitemap, migas, hreflang, enlaces del hub y
  «destinos cercanos» sin tocar código.
- **Nuevo hub** (p. ej. Costa Brava): región con `is_hub = true` + `region_translations`
  (`description` por idioma; sin descripción ese idioma es `noindex`). Slug único frente a
  destinos (los destinos tienen precedencia en `/{idioma}/{slug}`).
- **Nuevo tipo** (hotel, actividades…): `place_types` + traducciones; copy específico opcional
  en `src/content/seo/*.ts` → `placeTypes[code]` (si no, plantilla genérica).
- **Guía editorial**: `landing_pages` (+ `landing_page_places` para fijar locales).
- **Monetización futura**: `place_promotions` separado del ranking; bloques patrocinados
  siempre etiquetados y fuera de los resultados orgánicos; `rel="sponsored"` en afiliación.

## 11. Search Console y analítica

Pasos en el README («Google Search Console»). Verificación por DNS (recomendada) o
`GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`. GA4 solo con
`NEXT_PUBLIC_GA_MEASUREMENT_ID`, Consent Mode denegado por defecto: antes de medir de verdad,
añadir un banner de consentimiento y actualizar la política de cookies.

## 12. QA automatizado

- `npm test`: indexación, metadata/hreflang, títulos, JSON-LD (propietario, ratings, `hasMap`),
  sitemaps, rutas y redirecciones, matcher del proxy, contratos de la BD (alias, hubs).
- `npm run test:smoke` (tras `build`): rutas y redirecciones + auditoría SEO de páginas
  representativas (title, description y H1 únicos, canonical absoluto y autorreferente,
  JSON-LD válido, `alt`, hreflang válido), todos los enlaces internos y todas las URLs de los
  sitemaps (200 directo, sin redirecciones).
