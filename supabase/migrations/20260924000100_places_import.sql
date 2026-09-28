-- =============================================================================
-- Curated places imports (spreadsheets) and directory search.
--
--   * places.maps_url / maps_url_kind: public "View on Google Maps" link and
--     what it really points to. A `search` link is a text search, not a
--     verified listing, and the UI says so.
--   * place types `tapas_bar` and `drinks` (the spreadsheet categories
--     "Bares de tapas" and "Para beber algo"). Defined here, not in seed.sql,
--     because imports depend on them in every environment.
--   * place_import_records: provenance of imported places (verbatim row,
--     link type, source URL, observations, review flags). Internal only.
--   * apply_place_import(): idempotent three-way merge used by the generated
--     files in supabase/imports/. Only fields still holding the value written
--     by the previous import are updated, so manual edits survive re-imports.
--   * api_place_card / api_search_places / api_sitemap_destination_entries:
--     new card fields, multi-word accent-insensitive search over name,
--     locality (every locale), specialty, address and type, and sitemaps that
--     skip thin place pages.
-- See docs/IMPORTS.md.
-- =============================================================================

alter table public.places
  add column maps_url      text check (maps_url ~ '^https://'),
  add column maps_url_kind text check (maps_url_kind in ('search', 'place_id', 'coordinates', 'place', 'short_link')),
  add constraint places_maps_url_pair check ((maps_url is null) = (maps_url_kind is null));

-- -----------------------------------------------------------------------------
-- Place types for the imported categories
-- -----------------------------------------------------------------------------
insert into public.place_types (code, schema_type, has_listing_page, is_active, sort_order) values
  ('tapas_bar', 'BarOrPub', true, true, 2),
  ('drinks', 'BarOrPub', true, true, 3)
on conflict (code) do nothing;

insert into public.place_type_translations (place_type_code, locale, name, plural_name, slug) values
  ('tapas_bar', 'es', 'Bar de tapas', 'Bares de tapas', 'bares-de-tapas'),
  ('tapas_bar', 'ca', 'Bar de tapes', 'Bars de tapes', 'bars-de-tapes'),
  ('tapas_bar', 'en', 'Tapas bar', 'Tapas bars', 'tapas-bars'),
  ('tapas_bar', 'fr', 'Bar à tapas', 'Bars à tapas', 'bars-a-tapas'),
  ('tapas_bar', 'de', 'Tapas-Bar', 'Tapas-Bars', 'tapas-bars'),
  ('tapas_bar', 'it', 'Bar di tapas', 'Bar di tapas', 'bar-di-tapas'),
  ('drinks', 'es', 'Para beber algo', 'Para beber algo', 'para-beber-algo'),
  ('drinks', 'ca', 'Per prendre alguna cosa', 'Per prendre alguna cosa', 'per-prendre-alguna-cosa'),
  ('drinks', 'en', 'Drinks', 'Places for a drink', 'drinks'),
  ('drinks', 'fr', 'Boire un verre', 'Où boire un verre', 'boire-un-verre'),
  ('drinks', 'de', 'Auf einen Drink', 'Auf einen Drink', 'auf-einen-drink'),
  ('drinks', 'it', 'Per bere qualcosa', 'Per bere qualcosa', 'bere-qualcosa')
on conflict (place_type_code, locale) do nothing;

-- -----------------------------------------------------------------------------
-- Import provenance (internal: no public policy)
-- -----------------------------------------------------------------------------
create table public.place_import_records (
  -- Import id, e.g. "locales-costa-daurada" (one per spreadsheet lineage).
  source            text not null check (source ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- "<destination slug>|<normalized name>": the dedupe key.
  source_key        text not null,
  -- Null when the place was deleted by hand: re-imports then skip the row.
  place_id          uuid references public.places (id) on delete set null,
  row_number        integer,
  -- Spreadsheet label of the Maps link ("Búsqueda por nombre y localidad"…).
  maps_link_type    text,
  maps_url          text,
  source_url        text,
  -- "Observaciones": editorial/technical notes, never shown to visitors.
  notes             text,
  review_flags      text[] not null default '{}',
  -- Verbatim row as read from the spreadsheet (cells + hyperlink targets).
  raw               jsonb not null,
  -- Values written by the last import (baseline of the three-way merge).
  applied           jsonb not null,
  first_imported_at timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  -- Set when a later import no longer contains the row (never deleted).
  missing_since     timestamptz,
  primary key (source, source_key)
);

create index place_import_records_place_idx on public.place_import_records (place_id);

alter table public.place_import_records enable row level security;
revoke all on public.place_import_records from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Text normalization shared by search and import matching:
-- lowercase, accent-free, any punctuation (’ ' - , ·) collapsed to one space.
-- -----------------------------------------------------------------------------
create or replace function public.search_normalize(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(public.immutable_unaccent(lower(coalesce(value, ''))), '[^a-z0-9]+', ' ', 'g'))
$$;

grant execute on function public.search_normalize(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- apply_place_import(source, rows): see header. `rows` is the JSON array
-- generated by scripts/import-places.mjs. Returns a summary.
-- -----------------------------------------------------------------------------
create or replace function public.apply_place_import(p_source text, p_rows jsonb)
returns jsonb
language plpgsql
set search_path = public, extensions
as $$
declare
  v_row            jsonb;
  v_destination_id uuid;
  v_record_exists  boolean;
  v_place_id       uuid;
  v_previous       jsonb;
  v_applied        jsonb;
  v_slug           text;
  v_suffix         integer;
  v_locale         text;
  v_text           text;
  v_count          integer;
  v_keys           text[] := '{}';
  v_inserted       integer := 0;
  v_updated        integer := 0;
  v_linked         integer := 0;
  v_skipped        integer := 0;
begin
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'apply_place_import: rows must be a JSON array';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows) loop
    select d.id into v_destination_id from destinations d where d.slug = v_row ->> 'destinationSlug';
    if v_destination_id is null then
      raise exception 'apply_place_import: unknown destination "%" for "%"',
        v_row ->> 'destinationSlug', v_row ->> 'key';
    end if;
    v_keys := array_append(v_keys, v_row ->> 'key');

    v_applied := jsonb_build_object(
      'name', v_row -> 'name',
      'placeType', v_row -> 'placeType',
      'addressLine', v_row -> 'addressLine',
      'mapsUrl', v_row -> 'mapsUrl',
      'mapsUrlKind', v_row -> 'mapsUrlKind',
      'descriptions', coalesce(v_row -> 'descriptions', '{}'::jsonb)
    );

    v_record_exists := false;
    v_place_id := null;
    v_previous := '{}'::jsonb;
    select true, r.place_id, r.applied into v_record_exists, v_place_id, v_previous
    from place_import_records r
    where r.source = p_source and r.source_key = v_row ->> 'key';
    v_record_exists := coalesce(v_record_exists, false);
    v_previous := coalesce(v_previous, '{}'::jsonb);

    if v_record_exists and v_place_id is null then
      -- The place was deleted by hand: respect that decision.
      update place_import_records r set last_seen_at = now(), missing_since = null
      where r.source = p_source and r.source_key = v_row ->> 'key';
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if v_place_id is null then
      -- Never duplicate a place that already exists in the destination under
      -- the same normalized name (created by hand or by another import).
      select p.id into v_place_id
      from places p
      where p.destination_id = v_destination_id
        and search_normalize(p.name) = search_normalize(v_row ->> 'name')
      order by p.created_at
      limit 1;
      if v_place_id is not null then
        v_linked := v_linked + 1;
      end if;
    end if;

    if v_place_id is null then
      v_slug := v_row ->> 'slug';
      v_suffix := 1;
      while exists (select 1 from places p where p.destination_id = v_destination_id and p.slug = v_slug) loop
        v_suffix := v_suffix + 1;
        v_slug := (v_row ->> 'slug') || '-' || v_suffix;
      end loop;

      insert into places (id, destination_id, place_type, slug, name, address_line, maps_url, maps_url_kind, status)
      values (
        case when exists (select 1 from places p where p.id = (v_row ->> 'id')::uuid)
          then gen_random_uuid() else (v_row ->> 'id')::uuid end,
        v_destination_id,
        v_row ->> 'placeType',
        v_slug,
        v_row ->> 'name',
        v_row ->> 'addressLine',
        v_row ->> 'mapsUrl',
        v_row ->> 'mapsUrlKind',
        'published'
      )
      returning id into v_place_id;
      v_inserted := v_inserted + 1;
    else
      -- Three-way merge: a field is updated only while it still holds the
      -- value the previous import wrote. Slug and status are never touched.
      update places p set
        name = n.name,
        place_type = n.place_type,
        address_line = n.address_line,
        maps_url = n.maps_url,
        maps_url_kind = n.maps_url_kind
      from (
        select
          case when c.name is not distinct from v_previous ->> 'name'
            then v_row ->> 'name' else c.name end as name,
          case when c.place_type is not distinct from v_previous ->> 'placeType'
            then v_row ->> 'placeType' else c.place_type end as place_type,
          case when c.address_line is not distinct from v_previous ->> 'addressLine'
            then v_row ->> 'addressLine' else c.address_line end as address_line,
          case when (c.maps_url, c.maps_url_kind) is not distinct from
                    (v_previous ->> 'mapsUrl', v_previous ->> 'mapsUrlKind')
            then v_row ->> 'mapsUrl' else c.maps_url end as maps_url,
          case when (c.maps_url, c.maps_url_kind) is not distinct from
                    (v_previous ->> 'mapsUrl', v_previous ->> 'mapsUrlKind')
            then v_row ->> 'mapsUrlKind' else c.maps_url_kind end as maps_url_kind
        from places c
        where c.id = v_place_id
      ) n
      where p.id = v_place_id
        and (p.name, p.place_type, p.address_line, p.maps_url, p.maps_url_kind)
            is distinct from (n.name, n.place_type, n.address_line, n.maps_url, n.maps_url_kind);
      get diagnostics v_count = row_count;
      v_updated := v_updated + v_count;
    end if;

    for v_locale, v_text in
      select e.key, e.value from jsonb_each_text(v_applied -> 'descriptions') e
      where exists (select 1 from locales l where l.code = e.key)
    loop
      insert into place_translations as t (place_id, locale, short_description)
      values (v_place_id, v_locale, v_text)
      on conflict (place_id, locale) do update
        set short_description = excluded.short_description
        where (t.short_description is null
               or t.short_description is not distinct from v_previous -> 'descriptions' ->> v_locale)
          and t.short_description is distinct from excluded.short_description;
    end loop;

    insert into place_import_records as r (
      source, source_key, place_id, row_number, maps_link_type, maps_url, source_url, notes,
      review_flags, raw, applied
    )
    values (
      p_source,
      v_row ->> 'key',
      v_place_id,
      (v_row -> 'record' ->> 'rowNumber')::integer,
      v_row -> 'record' ->> 'mapsLinkType',
      v_row -> 'record' ->> 'mapsUrlRaw',
      v_row -> 'record' ->> 'sourceUrl',
      v_row -> 'record' ->> 'notes',
      coalesce(array(select jsonb_array_elements_text(v_row -> 'record' -> 'reviewFlags')), '{}'),
      coalesce(v_row -> 'record', '{}'::jsonb),
      v_applied
    )
    on conflict (source, source_key) do update set
      place_id = excluded.place_id,
      row_number = excluded.row_number,
      maps_link_type = excluded.maps_link_type,
      maps_url = excluded.maps_url,
      source_url = excluded.source_url,
      notes = excluded.notes,
      review_flags = excluded.review_flags,
      raw = excluded.raw,
      applied = excluded.applied,
      last_seen_at = now(),
      missing_since = null;
  end loop;

  -- Rows that disappeared from the spreadsheet are flagged, never deleted or
  -- unpublished automatically.
  update place_import_records r
  set missing_since = coalesce(r.missing_since, now())
  where r.source = p_source and r.source_key <> all (v_keys);
  get diagnostics v_count = row_count;

  return jsonb_build_object(
    'rows', jsonb_array_length(p_rows),
    'inserted', v_inserted,
    'updated', v_updated,
    'linkedExisting', v_linked,
    'skippedDeleted', v_skipped,
    'missingFromSource', v_count
  );
end;
$$;

-- Writes are for the service role / database owner only.
revoke execute on function public.apply_place_import(text, jsonb) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Place card: + addressLine, mapsUrl, mapsUrlKind, isRanked
-- -----------------------------------------------------------------------------
create or replace function public.api_place_card(p_place_id uuid, p_locale text, p_fallback text)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'name', p.name,
    'placeType', p.place_type,
    'placeTypeName', ptt.name,
    'destination', jsonb_build_object('id', d.id, 'slug', dt.slug, 'name', dt.name),
    'shortDescription', tr.short_description,
    'addressLine', p.address_line,
    'mapsUrl', p.maps_url,
    'mapsUrlKind', p.maps_url_kind,
    'priceLevel', p.price_level,
    'averagePrice', p.average_price,
    'currency', p.currency,
    'rating', p.rating,
    'reviewCount', p.review_count,
    'ratingSource', p.rating_source,
    'imageUrl', p.featured_image_url,
    'imageCredit', p.featured_image_credit,
    'isFeatured', p.is_featured,
    'isVerified', p.is_verified,
    'isDemo', p.is_demo,
    'isRanked', p.ranking_score is not null,
    'latitude', p.latitude,
    'longitude', p.longitude,
    'primaryCategory', (
      select jsonb_build_object('id', c.id, 'slug', ct.slug, 'name', ct.name)
      from place_categories pc
      join categories c on c.id = pc.category_id and c.is_active
      join lateral (
        select x.slug, x.name from category_translations x
        where x.category_id = c.id and x.locale in (p_locale, p_fallback)
        order by x.locale = p_locale desc limit 1
      ) ct on true
      where pc.place_id = p.id and pc.is_primary
    ),
    'featureCodes', coalesce((
      select jsonb_agg(pf.feature_code order by f.sort_order, f.code)
      from place_features pf
      join features f on f.code = pf.feature_code and f.is_active
      where pf.place_id = p.id
    ), '[]'::jsonb)
  )
  from places p
  join destinations d on d.id = p.destination_id
  join lateral (
    select x.slug, x.name from destination_translations x
    where x.destination_id = d.id and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) dt on true
  left join lateral (
    select x.name from place_type_translations x
    where x.place_type_code = p.place_type and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) ptt on true
  left join lateral (
    select x.short_description from place_translations x
    where x.place_id = p.id and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) tr on true
  where p.id = p_place_id
$$;

-- -----------------------------------------------------------------------------
-- Search: every word of the query must appear (as a substring, accent- and
-- case-insensitive) in the place's name, address, short description
-- (requested + fallback locale), type name, or the destination name in ANY
-- locale — so "Miami Playa" and "Miami Platja" both match. A query made only
-- of punctuation matches nothing (wildcards are never interpreted).
-- -----------------------------------------------------------------------------
create or replace function public.api_search_places(
  p_locale text,
  p_fallback text,
  p_destination_id uuid default null,
  p_place_type text default null,
  p_category_id uuid default null,
  p_features text[] default null,
  p_price_levels integer[] default null,
  p_query text default null,
  p_sort text default 'ranking',
  p_limit integer default 24,
  p_offset integer default 0,
  p_pinned_ids uuid[] default null,
  p_exclude_ids uuid[] default null,
  p_featured_only boolean default false
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  with terms as (
    select
      nullif(btrim(coalesce(p_query, '')), '') is not null as active,
      array_remove(string_to_array(search_normalize(left(p_query, 200)), ' '), '') as tokens
  ),
  filtered as (
    select p.id, p.name, p.rating, p.review_count, p.price_level, p.ranking_score
    from places p
    cross join terms
    left join lateral (
      select search_normalize(concat_ws(' ',
        p.name,
        p.address_line,
        (select string_agg(x.short_description, ' ') from place_translations x
          where x.place_id = p.id and x.locale in (p_locale, p_fallback)),
        (select string_agg(x.name, ' ') from destination_translations x
          where x.destination_id = p.destination_id),
        (select string_agg(x.name || ' ' || x.plural_name, ' ') from place_type_translations x
          where x.place_type_code = p.place_type and x.locale in (p_locale, p_fallback))
      )) as content
      where terms.active
    ) haystack on true
    where p.status = 'published'
      and (p_destination_id is null or p.destination_id = p_destination_id)
      and (p_place_type is null or p.place_type = p_place_type)
      and (p_category_id is null or exists (
        select 1 from place_categories pc where pc.place_id = p.id and pc.category_id = p_category_id
      ))
      and (coalesce(cardinality(p_features), 0) = 0 or (
        select count(*) from place_features pf
        where pf.place_id = p.id and pf.feature_code = any (p_features)
      ) = cardinality(p_features))
      and (coalesce(cardinality(p_price_levels), 0) = 0 or p.price_level = any (p_price_levels))
      and (
        not terms.active
        or (
          coalesce(cardinality(terms.tokens), 0) > 0
          and not exists (
            select 1 from unnest(terms.tokens) as token
            where position(token in haystack.content) = 0
          )
        )
      )
      and (p_exclude_ids is null or p.id <> all (p_exclude_ids))
      and (not p_featured_only or p.is_featured)
  ),
  ranked as (
    select f.id, count(*) over () as total_count, row_number() over (
      order by
        array_position(p_pinned_ids, f.id) nulls last,
        case when p_sort = 'rating' then f.rating end desc nulls last,
        case when p_sort = 'price_asc' then f.price_level end asc nulls last,
        case when p_sort = 'price_desc' then f.price_level end desc nulls last,
        case when p_sort = 'name' then search_normalize(f.name) end asc,
        f.ranking_score desc nulls last,
        f.rating desc nulls last,
        f.review_count desc nulls last,
        search_normalize(f.name),
        f.id
    ) as position
    from filtered f
  ),
  page as (
    select r.id, r.position from ranked r
    where r.position > greatest(p_offset, 0)
    order by r.position
    limit least(greatest(p_limit, 1), 100)
  )
  select jsonb_build_object(
    'total', coalesce((select r.total_count from ranked r limit 1), 0),
    'items', coalesce((
      select jsonb_agg(api_place_card(pg.id, p_locale, p_fallback) order by pg.position) from page pg
    ), '[]'::jsonb)
  )
$$;

-- -----------------------------------------------------------------------------
-- Sitemaps: place pages only when they have editorial content (a full
-- description) in that locale, and place-type listings only above the thin
-- collection threshold (same rule as src/lib/seo/indexing.ts).
-- -----------------------------------------------------------------------------
create or replace function public.api_sitemap_destination_entries(
  p_destination_id uuid,
  p_min_category_places integer default 3
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'places', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', p.slug,
        'locales', (
          select jsonb_agg(t.locale order by t.locale) from place_translations t
          where t.place_id = p.id and t.full_description is not null
        ),
        'updatedAt', p.updated_at
      ) order by p.slug)
      from places p
      where p.destination_id = p_destination_id and p.status = 'published' and not p.is_demo
        and exists (
          select 1 from place_translations t where t.place_id = p.id and t.full_description is not null
        )
    ), '[]'::jsonb),
    'landingPages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slugs', (select jsonb_object_agg(t.locale, t.slug) from landing_page_translations t where t.landing_page_id = l.id),
        'updatedAt', l.updated_at
      ) order by l.key)
      from landing_pages l
      where l.destination_id = p_destination_id and l.is_published and l.is_indexable
        and exists (select 1 from landing_page_translations t where t.landing_page_id = l.id)
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slugs', (select jsonb_object_agg(t.locale, t.slug) from category_translations t where t.category_id = c.id)
      ) order by c.slug)
      from categories c
      where c.is_active and (
        select count(*) from place_categories pc
        join places p on p.id = pc.place_id and p.status = 'published' and not p.is_demo
        where pc.category_id = c.id and p.destination_id = p_destination_id
      ) >= p_min_category_places
    ), '[]'::jsonb),
    'placeTypes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slugs', (select jsonb_object_agg(t.locale, t.slug) from place_type_translations t where t.place_type_code = pt.code)
      ) order by pt.sort_order, pt.code)
      from place_types pt
      where pt.is_active and pt.has_listing_page and (
        select count(*) from places p
        where p.destination_id = p_destination_id and p.place_type = pt.code
          and p.status = 'published' and not p.is_demo
      ) >= p_min_category_places
    ), '[]'::jsonb)
  )
$$;
