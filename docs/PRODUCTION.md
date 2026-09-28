# Preparación de producción

## Arranque y datos base

`npm install`, copiar `.env.example` a `.env.local` si se necesitan variables, y `npm run dev`.
Sin Supabase se usa PGlite: migraciones → seed demo → imports. Es un entorno de prueba
sin indexación. Las demos están marcadas; no representan negocios reales.

Una base de producción nueva se inicializa **solo con las migraciones**. La migración
`production_bootstrap` incorpora las referencias existentes: seis idiomas, taxonomía,
España/Cataluña/Costa Daurada, cinco localidades, traducciones y aliases. Mantiene IDs
estables y respeta filas preexistentes. No sobrescribe contenido editorial manual.

1. Vincular el proyecto correcto con `npx supabase link --project-ref <ref>`.
2. Aplicar migraciones con `npx supabase db push`. Revisar previamente en una base de pruebas.
3. Regenerar y revisar importación con `npm run import:places -- --check`, siguiendo `IMPORTS.md`.
4. Aplicar el SQL revisado con conexión propietaria (fuera del runtime de la app):

   ```bash
   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -1 -f supabase/imports/locales-costa-daurada.sql
   ```

5. Invalidar el tag `content` mediante `POST /api/revalidate` con el secreto configurado.

No ejecutar `seed.sql`, `db reset --linked` ni un reset destructivo en producción.
En una base previamente sembrada, la nueva migración identifica los tres ejemplos de
landing por sus IDs conocidos. RLS y SQL ocultan los demos, incluso si siguen publicados.
Si un propietario sustituyó deliberadamente uno de esos ejemplos por contenido real,
debe revisarlo y cambiar `is_demo` explícitamente; no se deduce autenticidad por el título.

## Publicar un lugar y aprobar SEO

`status = 'published'` permite mostrar un local real en el directorio. No significa que su
ficha sea apta para indexarse. No se convierte la incompletitud en un error que bloquee
el directorio: se mantiene `noindex, follow` hasta completar y revisar.

Para que un idioma de una ficha sea candidato a indexación, SQL exige:

- Local publicado, `is_demo = false`, destino y tipo activos, nombre no vacío.
- `is_verified = true`, marcado **solo tras revisión editorial**, nunca por la importación.
- Dirección contrastada no vacía **o** latitud y longitud confirmadas.
- Imagen autorizada y crédito/licencia documentado en `featured_image_credit`.
- Descripción corta propia de al menos 40 caracteres y larga de al menos 160, tras recortar espacios,
  en la fila del idioma solicitado. Son mínimos técnicos; no garantizan calidad por sí solos.

No son requisitos universales: ratings, ranking, web, categorías, features o coordenadas si
hay dirección. Solo se rellenan con evidencia. El rating exige fuente; nunca se inventan
reseñas. El JSON-LD de negocio se omite en versiones pendientes o fallback. La importación
conserva las ediciones manuales y no aprueba fichas automáticamente.

Destinos/hubs necesitan texto propio de al menos 80 caracteres y lugares reales publicados.
Las colecciones necesitan al menos 3 lugares reales, traducción de su identidad y un destino
apto en ese idioma. Las categorías necesitan además descripción propia de 80 caracteres.
Una landing necesita estar publicada, ser real, `is_indexable = true`, intro de 80 caracteres,
cuerpo de 160, destino apto y al menos 3 resultados reales bajo **sus filtros**, con `max_items >= 3`.
Un texto o una colección demo no cuentan. Las traducciones parciales no entran en hreflang
ni sitemap. Las traducciones pendientes siguen disponibles en el selector cuando procede.

Antes de dar un título como «mejores» a una landing, el propietario debe justificar la
selección y calcular/revisar el ranking con señales reales. El mínimo de texto no valida ese juicio.

## Identidad del propietario

Configurar `PUBLISHER_LEGAL_NAME`, `PUBLISHER_TAX_ID`, `PUBLISHER_ADDRESS` y `PUBLISHER_EMAIL`
con los datos reales revisados del titular. No se proporcionan valores ficticios. Los cuatro
campos son el control de lanzamiento del proyecto; el propietario debe confirmar qué identidad
y obligaciones corresponden a su actividad. El código valida presencia/formato, no autenticidad.

Perfiles opcionales: `PUBLISHER_SOCIAL_URLS` (HTTPS, separados por comas) y
`PUBLISHER_TWITTER_HANDLE` (`@cuenta`). Aparecen en Organization; datos ausentes se omiten.
El contacto solo existe con email configurado. El aviso legal incompleto se identifica como pendiente.
Revisar aviso legal, privacidad, cookies y declaraciones editoriales en **los seis idiomas** antes
de publicar. Si se activa GA4, los textos actuales de cookies necesitan actualización y el
propietario debe resolver el consentimiento; el identificador vacío no carga analítica.

Reconstruir tras cambiar identidad o variables SEO: las páginas estáticas capturan esos valores.
Mantener `ALLOW_INDEXING=false` hasta terminar la revisión. Indexación requiere también Supabase,
origen público y ausencia de preview; la app usa la clave anon, nunca service role.

## Controles reproducibles

```bash
npm run check:content
npm run check:content -- --report
npm run validate
npm run test:smoke
```

`check:content` audita el snapshot **versionado** de migraciones + imports en PGlite, sin seed.
Comprueba exposición demo, referencias/colisiones de aliases y candidatos de fichas en sitemap;
informa carencias por local. `--strict` falla si hay fichas publicadas aún incompletas: usarlo
cuando se decida exigir que todo el catálogo esté enriquecido, no durante importaciones iniciales.
`docs/DATA-QUALITY.md` recoge el snapshot actual. Para auditar ediciones remotas, ejecutar
`docs/queries/content-quality.sql` con conexión propietaria y revisar el resultado; el script
local no lee ni modifica Supabase remoto.

El smoke usa el build embebido con fixtures demo y el origen local (siempre bloqueado).
El número de comprobaciones se calcula al ejecutarlo; no es una promesa fija de rutas.
Comprueba canonical, tags, idiomas, redirects, cabeceras, enlaces y que el sitemap no liste
páginas noindex. No lo apuntes a producción esperando los mismos fixtures.

Antes de habilitar indexación en el dominio definitivo, inspeccionar robots, canonical y
hreflang en home, destino, colección, ficha aprobada, ficha pendiente, landing y búsqueda.
Revisar cada `<loc>` del sitemap: 200 directo, canonical propio, robots index y solo idiomas
aprobados. Con indexación bloqueada los sitemaps HTTP están vacíos. Repetir a través del
dominio canónico: otro host recibe `X-Robots-Tag: noindex`. Revisar también JSON-LD y ausencia
de ratings de terceros en `aggregateRating`.

Probar las migraciones en Supabase de staging con roles anon/authenticated y ejecutar sus
advisors antes de aplicar al proyecto definitivo. Las pruebas locales verifican Postgres/RLS,
pero no sustituyen la comprobación de permisos/default privileges y Data API del proyecto real.
Hacer copia de seguridad antes del despliegue y reconstruir/invalidate cachés tras publicarlo.
