-- =============================================================================
-- Several categories per place + public category set.
--
--   * place_secondary_types: a place keeps ONE primary type (places.place_type:
--     URL listing, Schema.org type, card label) and may belong to other types,
--     e.g. a café that serves brunch. Filters, listings, counts and search
--     match the primary or any secondary type. Imports fill it only from
--     explicit words in the spreadsheet (see docs/IMPORTS.md).
--   * Public category set: Restaurantes, Cafeterías, Tapas, Brunch,
--     Copas y bares. New type `brunch`; `tapas_bar` and `drinks` get the
--     requested labels. Slugs are unchanged, so no URL breaks.
--   * "Miami Platja" is the public name in every locale. The Spanish slug
--     `miami-playa` is kept (existing URLs) and, because search also reads
--     destination slugs, "Miami Playa" keeps matching.
--   * apply_place_import(): also merges `website` and `extraTypes` with the
--     same three-way rule (manual edits win).
-- =============================================================================

create table public.place_secondary_types (
  place_id        uuid not null references public.places (id) on delete cascade,
  place_type_code text not null references public.place_types (code) on update cascade on delete cascade,
  primary key (place_id, place_type_code)
);

create index place_secondary_types_type_idx on public.place_secondary_types (place_type_code, place_id);

alter table public.place_secondary_types enable row level security;
create policy "Public read" on public.place_secondary_types for select to anon, authenticated using (true);
grant select on public.place_secondary_types to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Category set and order: Restaurantes, Cafeterías, Tapas, Brunch, Copas y bares
-- -----------------------------------------------------------------------------
insert into public.place_types (code, schema_type, has_listing_page, is_active, sort_order) values
  ('brunch', 'FoodEstablishment', true, true, 5)
on conflict (code) do nothing;

insert into public.place_type_translations (place_type_code, locale, name, plural_name, slug) values
  ('brunch', 'es', 'Brunch', 'Brunch', 'brunch'),
  ('brunch', 'ca', 'Brunch', 'Brunch', 'brunch'),
  ('brunch', 'en', 'Brunch', 'Brunch', 'brunch'),
  ('brunch', 'fr', 'Brunch', 'Brunch', 'brunch'),
  ('brunch', 'de', 'Brunch', 'Brunch', 'brunch'),
  ('brunch', 'it', 'Brunch', 'Brunch', 'brunch')
on conflict (place_type_code, locale) do nothing;

update public.place_types set sort_order = 4 where code = 'tapas_bar';
update public.place_types set sort_order = 6 where code = 'drinks';
-- Also set in seed.sql for fresh databases (the seed runs after migrations).
update public.place_types set sort_order = 9 where code = 'beach_club';

update public.place_type_translations t set plural_name = v.plural_name
from (values
  ('es', 'Tapas'), ('ca', 'Tapes'), ('en', 'Tapas'), ('fr', 'Tapas'), ('de', 'Tapas'), ('it', 'Tapas')
) as v(locale, plural_name)
where t.place_type_code = 'tapas_bar' and t.locale = v.locale;

update public.place_type_translations t set name = v.name, plural_name = v.name
from (values
  ('es', 'Copas y bares'), ('ca', 'Copes i bars'), ('en', 'Drinks & bars'),
  ('fr', 'Verres et bars'), ('de', 'Drinks & Bars'), ('it', 'Drink e bar')
) as v(locale, name)
where t.place_type_code = 'drinks' and t.locale = v.locale;

-- Public name "Miami Platja" (slug unchanged). Also set in seed.sql.
update public.destination_translations t set name = 'Miami Platja'
from public.destinations d
where d.id = t.destination_id and d.slug = 'miami-platja' and t.locale = 'es';

-- -----------------------------------------------------------------------------
-- Place card: + secondaryTypes [{ code, name }]
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
    'secondaryTypes', coalesce((
      select jsonb_agg(jsonb_build_object('code', pt.code, 'name', tt.name) order by pt.sort_order, pt.code)
      from place_secondary_types s
      join place_types pt on pt.code = s.place_type_code and pt.is_active
      join lateral (
        select x.name from place_type_translations x
        where x.place_type_code = pt.code and x.locale in (p_locale, p_fallback)
        order by x.locale = p_locale desc limit 1
      ) tt on true
      where s.place_id = p.id and s.place_type_code <> p.place_type
    ), '[]'::jsonb),
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

-- True when the place is of `p_type` as primary or secondary type.
create or replace function public.place_has_type(p_place_id uuid, p_primary text, p_type text)
returns boolean
language sql
stable
set search_path = public, extensions
as $$
  select p_primary = p_type or exists (
    select 1 from place_secondary_types s where s.place_id = p_place_id and s.place_type_code = p_type
  )
$$;

grant execute on function public.place_has_type(uuid, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Type counts include secondary types.
-- -----------------------------------------------------------------------------
create or replace function public.api_list_place_types(
  p_locale text,
  p_fallback text,
  p_destination_id uuid default null
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(item order by sort_order, code), '[]'::jsonb)
  from (
    select
      pt.sort_order,
      pt.code,
      jsonb_build_object(
        'code', pt.code,
        'schemaType', pt.schema_type,
        'hasListingPage', pt.has_listing_page,
        'name', tr.name,
        'pluralName', tr.plural_name,
        'slug', tr.slug,
        'slugs', (select jsonb_object_agg(t.locale, t.slug) from place_type_translations t where t.place_type_code = pt.code),
        'placeCount', (
          select count(*) from places p
          where p.status = 'published'
            and (p_destination_id is null or p.destination_id = p_destination_id)
            and place_has_type(p.id, p.place_type, pt.code)
        )
      ) as item
    from place_types pt
    join lateral (
      select x.* from place_type_translations x
      where x.place_type_code = pt.code and x.locale in (p_locale, p_fallback)
      order by x.locale = p_locale desc limit 1
    ) tr on true
    where pt.is_active
  ) rows
  where p_destination_id is null or (item ->> 'placeCount')::integer > 0
$$;

-- -----------------------------------------------------------------------------
-- Search: type filter matches secondary types; the haystack also includes
-- secondary type names and destination slugs (so legacy spellings such as
-- "Miami Playa", kept in the Spanish slug, still match).
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
        (select string_agg(x.name || ' ' || x.slug, ' ') from destination_translations x
          where x.destination_id = p.destination_id),
        (select string_agg(x.name || ' ' || x.plural_name, ' ') from place_type_translations x
          where x.locale in (p_locale, p_fallback)
            and (x.place_type_code = p.place_type or exists (
              select 1 from place_secondary_types s
              where s.place_id = p.id and s.place_type_code = x.place_type_code
            )))
      )) as content
      where terms.active
    ) haystack on true
    where p.status = 'published'
      and (p_destination_id is null or p.destination_id = p_destination_id)
      and (p_place_type is null or place_has_type(p.id, p.place_type, p_place_type))
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
-- Sitemaps: type listings count secondary types too.
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
        where p.destination_id = p_destination_id and p.status = 'published' and not p.is_demo
          and place_has_type(p.id, p.place_type, pt.code)
      ) >= p_min_category_places
    ), '[]'::jsonb)
  )
$$;

-- -----------------------------------------------------------------------------
-- apply_place_import(): previous behaviour + `website` and `extraTypes`.
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
      'website', v_row -> 'website',
      'mapsUrl', v_row -> 'mapsUrl',
      'mapsUrlKind', v_row -> 'mapsUrlKind',
      'extraTypes', coalesce(v_row -> 'extraTypes', '[]'::jsonb),
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

      insert into places (
        id, destination_id, place_type, slug, name, address_line, website, maps_url, maps_url_kind, status
      )
      values (
        case when exists (select 1 from places p where p.id = (v_row ->> 'id')::uuid)
          then gen_random_uuid() else (v_row ->> 'id')::uuid end,
        v_destination_id,
        v_row ->> 'placeType',
        v_slug,
        v_row ->> 'name',
        v_row ->> 'addressLine',
        v_row ->> 'website',
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
        website = n.website,
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
          case when c.website is not distinct from v_previous ->> 'website'
            then v_row ->> 'website' else c.website end as website,
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
        and (p.name, p.place_type, p.address_line, p.website, p.maps_url, p.maps_url_kind)
            is distinct from (n.name, n.place_type, n.address_line, n.website, n.maps_url, n.maps_url_kind);
      get diagnostics v_count = row_count;
      v_updated := v_updated + v_count;
    end if;

    -- Secondary types: add what the import newly proposes, remove what it
    -- proposed before and no longer does; manual additions/removals persist.
    insert into place_secondary_types (place_id, place_type_code)
    select v_place_id, t.code
    from jsonb_array_elements_text(v_applied -> 'extraTypes') as t(code)
    join place_types pt on pt.code = t.code
    where t.code <> (select p.place_type from places p where p.id = v_place_id)
      and not (coalesce(v_previous -> 'extraTypes', '[]'::jsonb) ? t.code)
    on conflict do nothing;

    delete from place_secondary_types s
    where s.place_id = v_place_id
      and coalesce(v_previous -> 'extraTypes', '[]'::jsonb) ? s.place_type_code
      and not ((v_applied -> 'extraTypes') ? s.place_type_code);

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

revoke execute on function public.apply_place_import(text, jsonb) from public, anon, authenticated;
