# Importación de locales desde hojas de cálculo

Los locales reales (cafeterías, restaurantes, bares de tapas y sitios para beber algo) se cargan
desde una hoja de cálculo curada. La hoja se procesa **una vez, en el ordenador de quien importa**:
el navegador del visitante nunca descarga ni analiza el Excel.

```text
data/imports/<fuente>/source.xlsx ─┐
data/imports/<fuente>/translations.json ─┤  npm run import:places
                                         ▼
           scripts/import-places.mjs (lee celdas + destinos de los hipervínculos)
                                         │
      ┌──────────────────────────────────┼─────────────────────────────────────┐
      ▼                                                                        ▼
supabase/imports/<fuente>.sql                                 data/imports/<fuente>/report.md
select apply_place_import('<fuente>', '[…]'::jsonb)          filas leídas, rechazadas, revisión
      │
      ├─ BD embebida (dev/CI/tests): se aplica tras migrations + seed.sql
      └─ Supabase: psql -f (ver abajo)
```

Fuente actual: `locales-costa-daurada` (60 locales en Salou, Tarragona, Cambrils, Miami Platja y
L'Hospitalet de l'Infant).

## Actualizar con una nueva versión del Excel

1. Copia el Excel nuevo sobre `data/imports/locales-costa-daurada/source.xlsx`
   (o usa `npm run import:places -- --input ruta/al/archivo.xlsx`).
2. `npm run import:places`. Muestra el resumen y reescribe:
   - `supabase/imports/locales-costa-daurada.sql`
   - `data/imports/locales-costa-daurada/report.md`
3. Lee el informe: filas rechazadas, **pendiente de revisión** y especialidades sin traducción.
   Las especialidades nuevas se añaden a `translations.json` (texto español → `ca`, `en`, `fr`,
   `de`, `it`) y se vuelve a ejecutar el paso 2. Sin traducción, ese idioma usa el fallback al
   español (la ficha se sirve `noindex`).
4. `npm run validate`, y tras el build `npm run test:smoke`. Los tests de
   `test/places-import.test.ts` fijan los recuentos de esta hoja: si la hoja cambia a propósito,
   actualiza esos números.
5. Aplica el SQL en Supabase (una vez aplicadas las migraciones con `npx supabase db push`):

   ```bash
   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -1 -f supabase/imports/locales-costa-daurada.sql
   curl -X POST "$SITE/api/revalidate" -H "Authorization: Bearer $REVALIDATE_SECRET"
   ```

   `SUPABASE_DB_URL` es la cadena de conexión de Postgres del proyecto (Project Settings →
   Database), con un rol propietario. Nunca se configura en la app. Para que
   `npx supabase db reset` también cargue las importaciones, añade en `supabase/config.toml`:
   `[db.seed] sql_paths = ['./seed.sql', './imports/*.sql']`.

`--check` valida la hoja y muestra el resumen sin escribir archivos.

## Qué se importa y dónde queda

| Columna del Excel          | Destino                                                           | ¿Público?                 |
| -------------------------- | ----------------------------------------------------------------- | ------------------------- |
| Localidad                  | `places.destination_id` (alias: Miami Playa/Platja, L’Hospitalet) | Sí                        |
| Local                      | `places.name` (no se traduce) y `places.slug`                     | Sí                        |
| Categoría                  | `places.place_type`: `cafe`, `restaurant`, `tapas_bar`, `drinks`  | Sí                        |
| Especialidad / ambiente    | `place_translations.short_description` (6 idiomas)                | Sí                        |
| Dirección / zona           | `places.address_line`, salvo si hay contradicción (ver abajo)     | Sí                        |
| Google Maps (hipervínculo) | `places.maps_url` + `maps_url_kind`                               | Sí ("Ver en Google Maps") |
| Tipo de enlace             | `place_import_records.maps_link_type` (texto literal)             | No                        |
| Fuente (hipervínculo)      | `place_import_records.source_url`                                 | No                        |
| Observaciones              | `place_import_records.notes`                                      | No                        |
| Fila completa              | `place_import_records.raw` (celdas + URL de cada hipervínculo)    | No                        |

`place_import_records` tiene RLS sin políticas públicas: ni la web ni la clave anon pueden leerla.

**No se genera nada que no esté en la hoja**: ni coordenadas (aunque un enlace las contenga), ni
horarios, teléfonos, precios, valoraciones, reseñas o imágenes.

### Tipo real de cada enlace de Maps

`maps_url_kind` se deduce de la propia URL (no de la etiqueta del Excel):

| Tipo          | Significado                                            | Interfaz                                 |
| ------------- | ------------------------------------------------------ | ---------------------------------------- |
| `search`      | Búsqueda de texto (nombre + localidad o dirección)     | "Ver en Google Maps" + aviso de búsqueda |
| `place_id`    | Búsqueda anclada a un identificador de lugar           | "Ver en Google Maps"                     |
| `coordinates` | Coordenadas publicadas por la fuente                   | "Ver en Google Maps"                     |
| `place`       | Enlace `/maps/place/…`                                 | "Ver en Google Maps"                     |
| `short_link`  | Enlace corto `maps.app.goo.gl` publicado por la fuente | "Ver en Google Maps"                     |

Solo se aceptan URLs `https` en hosts de Google Maps; el resto se descarta y se marca para revisión.
Los enlaces se abren en pestaña nueva con `rel="noopener noreferrer"`.

## Categorías

Categorías públicas: **Restaurantes** (`restaurant`), **Cafeterías** (`cafe`), **Tapas**
(`tapas_bar`), **Brunch** (`brunch`) y **Bares y copas** (`drinks`, URL `/es/{destino}/bares`). Son tipos de lugar
(`place_types`): el tipo principal (`places.place_type`) sale de la columna "Categoría" del Excel
y decide la URL de la ficha, el tipo Schema.org y la etiqueta principal. Un local puede tener
además **tipos secundarios** (`place_secondary_types`), que cuentan igual en filtros, listados
por ciudad, contadores y búsqueda.

Los secundarios solo se asignan con palabras **explícitas** de "Especialidad / ambiente"
(`SECONDARY_TYPE_RULES` en `scripts/lib/places-import.mjs`): `restaurante` → Restaurantes,
`café`/`cafetería` → Cafeterías, `tapa(s)` → Tapas, `brunch` → Brunch, `bar`/`pub`/`copas`/
`cóctel(es)`/`coctelería`/`mojito(s)`/`vermut`/`cerveza(s)`/`cervecería` → Bares y copas. El
informe lista cada asignación. Se pueden añadir o quitar a mano y la reimportación lo respeta.

## Web oficial

La URL de la fuente se guarda también como `places.website` ("Visitar web") solo si está en el
**dominio propio del local**: al quitar del dominio las palabras del nombre y de la localidad
no queda casi nada (`deliranto.com` sí; `clubnautichospitaletvandellos.com` para "Restaurant
Nàutic", webs de turismo o de reseñas, no). Fusión a tres bandas como el resto de campos.

## Reglas de validación y revisión

- **Cabecera**: se busca la fila con las columnas Localidad, Local y Categoría; los títulos y notas
  de encima se ignoran. Filas vacías se saltan; filas con un único texto tras la cabecera se
  listan como ignoradas.
- **Rechazo**: sin nombre, sin localidad, localidad o categoría desconocidas, o **duplicado**
  (misma localidad y nombre normalizado: sin mayúsculas, acentos ni signos). Todo rechazo sale
  en el informe con su fila y motivo.
- **Dirección contradictoria**: si las observaciones indican otra dirección (p. ej. "Otra ficha
  indica…"), la dirección **no se publica** y queda marcada `address_conflict`.
- **Revisión** (`review_flags`): `link_type_is_search` (etiquetado como enlace de la fuente pero
  es una búsqueda), `source_names_other_business` (la fuente es la ficha de otro negocio),
  enlaces inseguros o no válidos. `source_generic` es informativo: la fuente es un listado.

## Reimportar sin perder contenido manual

`apply_place_import()` (migración `20260924000100_places_import.sql`) hace una fusión a tres
bandas por cada fila, identificada por `source` + `source_key` (`destino|nombre normalizado`):

- **Nuevo** → se crea el lugar (`published`, id estable derivado de la clave, slug único).
  Si ya existía un lugar con el mismo nombre normalizado en el destino, se reutiliza.
- **Existente** → cada campo (`name`, `place_type`, `address_line`, `maps_url`, descripciones por
  idioma) se actualiza **solo si su valor actual sigue siendo el que escribió la importación
  anterior**. Lo editado a mano se conserva. `slug`, `status`, imágenes, descripción larga,
  SEO, categorías, características y ranking nunca se tocan.
- **Desaparecido de la hoja** → se marca `missing_since`; no se borra ni se despublica.
- **Borrado a mano** → la fila se omite en las siguientes importaciones.

Devuelve un resumen: `inserted`, `updated`, `linkedExisting`, `skippedDeleted`,
`missingFromSource`.

## Publicación y SEO

- Los locales importados aparecen en su destino, en los listados por tipo
  (`/es/salou/bares-de-tapas`) y en el directorio **Comer y beber** (`/es/comer-y-beber`).
- Las fichas existen (`/es/salou/cafeterias/cafe-central`) pero, mientras no tengan descripción
  los mínimos y aprobación editorial por idioma, son `noindex, follow`, no entran en el sitemap
  y no llevan marcado `LocalBusiness`. Una descripción larga por sí sola no aprueba SEO:
  ver [`PRODUCTION.md`](PRODUCTION.md) para imagen, ubicación, textos y `is_verified`.
- Sin fotografía autorizada no se muestra imagen: la tarjeta usa un icono neutro de categoría.
- Los listados sin `ranking_score` no se presentan como ranking ("Sin orden de preferencia"); el
  directorio ordena alfabéticamente. La landing de ejemplo "Mejores restaurantes en Cambrils"
  está despublicada en `seed.sql` por el mismo motivo.

Las importaciones de producción solo requieren migraciones: la taxonomía y geografía ya
forman parte del bootstrap. `seed.sql` contiene únicamente ejemplos y nunca se carga allí.
Los comandos locales de reset/`[db.seed]` descritos arriba son para desarrollo.
