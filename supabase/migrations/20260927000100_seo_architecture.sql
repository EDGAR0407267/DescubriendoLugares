-- =============================================================================
-- SEO architecture
--
--   * slug_aliases: retired slugs of destinations, place types, categories,
--     landing pages and places. The read API resolves them like a slug from
--     another locale, so the app answers with a permanent redirect to the
--     current URL instead of a 404 (renames never break historic URLs).
--   * Place pages live under their primary type listing:
--     /{locale}/{destination}/{type-slug}/{place-slug}. Cards and details
--     expose the type slug(s) and sitemaps list them.
--   * Regional hubs (regions.is_hub): /{locale}/{region-slug}, e.g.
--     /es/costa-daurada, with editorial text in region_translations.
--   * Taxonomy: one type for bars. The unused `bar` type is removed and
--     `drinks` ("Bares y copas") takes the /bares listing URLs; its previous
--     slugs become aliases.
--   * Miami Platja: public Spanish slug `miami-platja` (the name is the same
--     in every locale); `miami-playa` becomes an alias.
-- Seed data touched here is also updated in seed.sql for fresh databases.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Slug aliases
-- -----------------------------------------------------------------------------
create table public.slug_aliases (
  kind       text not null check (kind in ('destination', 'place_type', 'category', 'landing_page', 'place')),
  -- Destination that scopes the slug (places and landing pages); null otherwise.
  scope_id   uuid references public.destinations (id) on delete cascade,
  slug       public.slug not null,
  -- Destination id, place type code, category id, landing page id or place id.
  target_key text not null,
  created_at timestamptz not null default now(),
  check ((kind in ('place', 'landing_page')) = (scope_id is not null))
);

create unique index slug_aliases_unique_idx
  on public.slug_aliases (kind, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

alter table public.slug_aliases enable row level security;
create policy "Public read" on public.slug_aliases for select to anon, authenticated using (true);
grant select on public.slug_aliases to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Regional hubs
-- -----------------------------------------------------------------------------
alter table public.regions add column is_hub boolean not null default false;

alter table public.region_translations
  add column description     text,
  add column seo_title       text check (char_length(seo_title) <= 70),
  add column seo_description text check (char_length(seo_description) <= 170),
  add column updated_at      timestamptz not null default now();

create trigger region_translations_updated_at before update on public.region_translations
  for each row execute function public.set_updated_at();

-- Closest hub region of a destination (its region or an ancestor), or null.
create or replace function public.destination_hub(p_destination_id uuid, p_locale text, p_fallback text)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  with recursive chain(id, parent_id, depth) as (
    select r.id, r.parent_id, 0
    from destinations d join regions r on r.id = d.region_id
    where d.id = p_destination_id
    union all
    select r.id, r.parent_id, c.depth + 1
    from regions r join chain c on r.id = c.parent_id
  )
  select jsonb_build_object('slug', r.slug, 'name', tr.name)
  from chain c
  join regions r on r.id = c.id and r.is_active and r.is_hub
  join lateral (
    select x.name from region_translations x
    where x.region_id = r.id and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) tr on true
  order by c.depth
  limit 1
$$;

-- Region and all its descendants.
create or replace function public.region_subtree(p_region_id uuid)
returns setof uuid
language sql
stable
set search_path = public, extensions
as $$
  with recursive subtree(id) as (
    select p_region_id
    union all
    select r.id from regions r join subtree s on r.parent_id = s.id
  )
  select id from subtree
$$;

create or replace function public.api_get_region(p_locale text, p_fallback text, p_slug text)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', r.id,
    'slug', r.slug,
    'name', tr.name,
    'description', tr.description,
    'seoTitle', tr.seo_title,
    'seoDescription', tr.seo_description,
    'contentLocale', tr.locale,
    'translatedLocales', coalesce((
      select jsonb_agg(x.locale order by x.locale) from region_translations x
      where x.region_id = r.id and x.description is not null
    ), '[]'::jsonb),
    'parentName', (
      select x.name from region_translations x
      where x.region_id = r.parent_id and x.locale in (p_locale, p_fallback)
      order by x.locale = p_locale desc limit 1
    ),
    'countryCode', c.iso_code,
    'countryName', (
      select x.name from country_translations x
      where x.country_id = c.id and x.locale in (p_locale, p_fallback)
      order by x.locale = p_locale desc limit 1
    ),
    'destinations', coalesce((
      select jsonb_agg(api_destination_card(d.id, p_locale, p_fallback) order by d.sort_order, d.slug)
      from destinations d
      where d.is_active and d.region_id in (select region_subtree(r.id))
    ), '[]'::jsonb),
    'updatedAt', greatest(r.updated_at, tr.updated_at)
  )
  from regions r
  join countries c on c.id = r.country_id
  join lateral (
    select x.* from region_translations x
    where x.region_id = r.id and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) tr on true
  where r.slug = p_slug and r.is_active and r.is_hub
  limit 1
$$;

-- Hubs with published, real places; `locales` = translations with editorial text.
create or replace function public.api_sitemap_regions()
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', r.slug,
    'locales', coalesce((
      select jsonb_agg(x.locale order by x.locale) from region_translations x
      where x.region_id = r.id and x.description is not null
    ), '[]'::jsonb),
    'updatedAt', greatest(r.updated_at, (select max(x.updated_at) from region_translations x where x.region_id = r.id))
  ) order by r.slug), '[]'::jsonb)
  from regions r
  where r.is_active and r.is_hub
    and exists (
      select 1 from places p join destinations d on d.id = p.destination_id and d.is_active
      where p.status = 'published' and not p.is_demo and d.region_id in (select region_subtree(r.id))
    )
$$;

-- -----------------------------------------------------------------------------
-- Destinations: resolve aliases (→ requestedSlugMatches = false) and expose the hub.
-- -----------------------------------------------------------------------------
create or replace function public.api_get_destination(p_locale text, p_fallback text, p_slug text)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  with target as (
    select d.*
    from destinations d
    where d.is_active
      and (
        d.slug = p_slug
        or exists (select 1 from destination_translations t where t.destination_id = d.id and t.slug = p_slug)
        or exists (
          select 1 from slug_aliases a
          where a.kind = 'destination' and a.slug = p_slug and a.target_key = d.id::text
        )
      )
    order by
      exists (
        select 1 from destination_translations t
        where t.destination_id = d.id and t.slug = p_slug and t.locale = p_locale
      ) desc,
      exists (select 1 from destination_translations t where t.destination_id = d.id and t.slug = p_slug) desc
    limit 1
  )
  select api_destination_card(d.id, p_locale, p_fallback) || jsonb_build_object(
    'description', tr.description,
    'seoTitle', tr.seo_title,
    'seoDescription', tr.seo_description,
    'contentLocale', tr.locale,
    'slugs', (select jsonb_object_agg(t.locale, t.slug) from destination_translations t where t.destination_id = d.id),
    'requestedSlugMatches', tr.slug = p_slug,
    'hub', destination_hub(d.id, p_locale, p_fallback),
    'updatedAt', greatest(d.updated_at, tr.updated_at)
  )
  from target d
  join lateral (
    select x.* from destination_translations x
    where x.destination_id = d.id and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) tr on true
$$;

-- -----------------------------------------------------------------------------
-- Segments: + aliases, flagged `canonical: false` so the app redirects.
-- -----------------------------------------------------------------------------
create or replace function public.api_resolve_destination_segment(
  p_locale text,
  p_destination_id uuid,
  p_segment text
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select match from (
    (
      select 1 as precedence, (t.locale = p_locale) as exact,
        jsonb_build_object('kind', 'place_type', 'key', pt.code, 'locale', t.locale, 'canonical', true) as match
      from place_type_translations t
      join place_types pt on pt.code = t.place_type_code and pt.is_active and pt.has_listing_page
      where t.slug = p_segment
    )
    union all
    (
      select 2, (t.locale = p_locale),
        jsonb_build_object('kind', 'landing_page', 'key', l.id, 'locale', t.locale, 'canonical', true)
      from landing_page_translations t
      join landing_pages l on l.id = t.landing_page_id and l.is_published
      where t.destination_id = p_destination_id and t.slug = p_segment
    )
    union all
    (
      select 3, (t.locale = p_locale),
        jsonb_build_object('kind', 'category', 'key', c.id, 'locale', t.locale, 'canonical', true)
      from category_translations t
      join categories c on c.id = t.category_id and c.is_active
      where t.slug = p_segment
    )
    union all
    (
      select 4, false,
        jsonb_build_object('kind', a.kind, 'key', a.target_key, 'locale', p_locale, 'canonical', false)
      from slug_aliases a
      where a.slug = p_segment
        and (
          a.kind in ('place_type', 'category')
          or (a.kind = 'landing_page' and a.scope_id = p_destination_id)
        )
    )
  ) candidates
  order by exact desc, precedence
  limit 1
$$;

-- -----------------------------------------------------------------------------
-- Place card: + placeTypeSlug (URL segment of the primary type in p_locale).
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
    'placeTypeSlug', ptt.slug,
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
    select x.name, x.slug from place_type_translations x
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
-- Place detail: + placeTypeSlugs (every locale) and alias slugs. The returned
-- `slug` is always the current one, so the app redirects alias requests.
-- -----------------------------------------------------------------------------
create or replace function public.api_get_place(
  p_locale text,
  p_fallback text,
  p_destination_id uuid,
  p_slug text
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select api_place_card(p.id, p_locale, p_fallback) || jsonb_build_object(
    'fullDescription', tr.full_description,
    'seoTitle', tr.seo_title,
    'seoDescription', tr.seo_description,
    'contentLocale', tr.locale,
    'translatedLocales', coalesce((
      select jsonb_agg(x.locale order by x.locale) from place_translations x where x.place_id = p.id
    ), '[]'::jsonb),
    'addressLine', p.address_line,
    'postalCode', p.postal_code,
    'phone', p.phone,
    'website', p.website,
    'instagram', p.instagram,
    'schemaType', pt.schema_type,
    'placeTypeSlugs', (
      select jsonb_object_agg(t.locale, t.slug) from place_type_translations t where t.place_type_code = p.place_type
    ),
    'destinationSlugs', (
      select jsonb_object_agg(t.locale, t.slug) from destination_translations t where t.destination_id = p.destination_id
    ),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'slug', ct.slug, 'name', ct.name, 'isPrimary', pc.is_primary)
        order by pc.is_primary desc, c.sort_order)
      from place_categories pc
      join categories c on c.id = pc.category_id and c.is_active
      join lateral (
        select x.slug, x.name from category_translations x
        where x.category_id = c.id and x.locale in (p_locale, p_fallback)
        order by x.locale = p_locale desc limit 1
      ) ct on true
      where pc.place_id = p.id
    ), '[]'::jsonb),
    'features', coalesce((
      select jsonb_agg(jsonb_build_object('code', f.code, 'name', ft.name, 'groupCode', f.group_code, 'icon', f.icon)
        order by f.sort_order, f.code)
      from place_features pf
      join features f on f.code = pf.feature_code and f.is_active
      join lateral (
        select x.name from feature_translations x
        where x.feature_code = f.code and x.locale in (p_locale, p_fallback)
        order by x.locale = p_locale desc limit 1
      ) ft on true
      where pf.place_id = p.id
    ), '[]'::jsonb),
    'updatedAt', greatest(p.updated_at, coalesce(tr.updated_at, p.updated_at))
  )
  from places p
  join place_types pt on pt.code = p.place_type
  left join lateral (
    select x.* from place_translations x
    where x.place_id = p.id and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) tr on true
  where p.destination_id = p_destination_id
    and p.status = 'published'
    and (
      p.slug = p_slug
      or exists (
        select 1 from slug_aliases a
        where a.kind = 'place' and a.scope_id = p_destination_id and a.slug = p_slug and a.target_key = p.id::text
      )
    )
  order by p.slug = p_slug desc
  limit 1
$$;

-- -----------------------------------------------------------------------------
-- Sitemap entries: places + typeSlugs (their URL segment per locale).
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
        'typeSlugs', (
          select jsonb_object_agg(t.locale, t.slug) from place_type_translations t where t.place_type_code = p.place_type
        ),
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
-- Search: previous behaviour + destination aliases in the searchable text.
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
        -- Retired destination slugs ("miami-playa") still find their places.
        (select string_agg(a.slug, ' ') from slug_aliases a
          where a.kind = 'destination' and a.target_key = p.destination_id::text),
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

grant execute on function public.destination_hub(uuid, text, text) to anon, authenticated;
grant execute on function public.region_subtree(uuid) to anon, authenticated;
grant execute on function public.api_get_region(text, text, text) to anon, authenticated;
grant execute on function public.api_sitemap_regions() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Taxonomy: `drinks` becomes the single bar type and owns the /bares URLs.
-- -----------------------------------------------------------------------------
delete from public.place_types pt
where pt.code = 'bar'
  and not exists (select 1 from public.places p where p.place_type = 'bar')
  and not exists (select 1 from public.place_secondary_types s where s.place_type_code = 'bar');

insert into public.slug_aliases (kind, slug, target_key)
select 'place_type', t.slug, 'drinks'
from public.place_type_translations t
where t.place_type_code = 'drinks'
  and t.slug not in ('bares', 'bars', 'bar')
on conflict do nothing;

update public.place_type_translations t set name = v.name, plural_name = v.plural_name, slug = v.slug
from (values
  ('es', 'Bar', 'Bares y copas', 'bares'),
  ('ca', 'Bar', 'Bars i copes', 'bars'),
  ('en', 'Bar', 'Bars & drinks', 'bars'),
  ('fr', 'Bar', 'Bars et verres', 'bars'),
  ('de', 'Bar', 'Bars & Drinks', 'bars'),
  ('it', 'Bar', 'Bar e drink', 'bar')
) as v(locale, name, plural_name, slug)
where t.place_type_code = 'drinks' and t.locale = v.locale
  and not exists (
    select 1 from public.place_type_translations o
    where o.locale = v.locale and o.slug = v.slug and o.place_type_code <> 'drinks'
  );

-- -----------------------------------------------------------------------------
-- Existing databases (seeded before this migration). Fresh databases get the
-- same values from seed.sql, which runs after the migrations.
-- -----------------------------------------------------------------------------
insert into public.slug_aliases (kind, slug, target_key)
select 'destination', 'miami-playa', d.id::text
from public.destinations d
where d.slug = 'miami-platja'
on conflict do nothing;

update public.destination_translations t set slug = 'miami-platja'
from public.destinations d
where d.id = t.destination_id and d.slug = 'miami-platja' and t.locale = 'es' and t.slug = 'miami-playa';

update public.regions set is_hub = true where slug = 'costa-daurada';

update public.region_translations t set description = v.description
from public.regions r, (values
  ('es', 'La Costa Dorada ocupa buena parte del litoral de la provincia de Tarragona, en Cataluña: playas de arena fina, pueblos marineros y la ciudad romana de Tarragona. Esta guía reúne restaurantes, cafeterías, bares de tapas y sitios para tomar algo en sus localidades, con la ubicación de cada local.'),
  ('ca', 'La Costa Daurada ocupa bona part del litoral de la província de Tarragona, a Catalunya: platges de sorra fina, pobles mariners i la ciutat romana de Tarragona. Aquesta guia reuneix restaurants, cafeteries, bars de tapes i llocs per prendre alguna cosa a les seves poblacions, amb la ubicació de cada local.'),
  ('en', 'The Costa Daurada covers much of the coastline of the province of Tarragona, in Catalonia: fine-sand beaches, fishing towns and the Roman city of Tarragona. This guide brings together restaurants, cafés, tapas bars and places for a drink in its towns, with the location of each one.'),
  ('fr', 'La Costa Daurada couvre une grande partie du littoral de la province de Tarragone, en Catalogne : plages de sable fin, villages de pêcheurs et la ville romaine de Tarragone. Ce guide réunit restaurants, cafés, bars à tapas et adresses où boire un verre dans ses localités, avec l''emplacement de chacune.'),
  ('de', 'Die Costa Daurada umfasst einen großen Teil der Küste der Provinz Tarragona in Katalonien: feine Sandstrände, Fischerorte und die Römerstadt Tarragona. Dieser Reiseführer versammelt Restaurants, Cafés, Tapas-Bars und Lokale für einen Drink in ihren Orten, jeweils mit Lage.'),
  ('it', 'La Costa Dorada occupa buona parte del litorale della provincia di Tarragona, in Catalogna: spiagge di sabbia fine, paesi di pescatori e la città romana di Tarragona. Questa guida raccoglie ristoranti, caffè, bar di tapas e locali dove bere qualcosa nelle sue località, con la posizione di ciascuno.')
) as v(locale, description)
where r.id = t.region_id and r.slug = 'costa-daurada' and t.locale = v.locale;
