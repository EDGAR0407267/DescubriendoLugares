-- =============================================================================
-- Public read API (called through PostgREST RPC / supabase.rpc()).
--
-- Why SQL functions instead of ad-hoc table queries from the app:
--   * Translation fallback (requested locale → default locale) is resolved in
--     one round-trip, close to the data, using indexes.
--   * Filtering, ordering and pagination for 100k+ places stay in Postgres.
--   * The app only depends on a small, versioned JSON contract, validated with
--     Zod in src/lib/db/contracts.ts. Changing the contract = new migration.
--
-- All functions are SECURITY INVOKER, so Row Level Security still applies.
-- Every function returns camelCase jsonb consumed directly by TypeScript.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Place card (shared by listings, search, recommendations and nearby)
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
-- Destinations
-- -----------------------------------------------------------------------------
create or replace function public.api_destination_card(p_destination_id uuid, p_locale text, p_fallback text)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', d.id,
    'slug', dt.slug,
    'name', dt.name,
    'countryCode', c.iso_code,
    'countryName', ctr.name,
    'regionName', rtr.name,
    'latitude', d.latitude,
    'longitude', d.longitude,
    'imageUrl', d.hero_image_url,
    'imageCredit', d.hero_image_credit,
    'isFeatured', d.is_featured,
    'placeCount', (select count(*) from places p where p.destination_id = d.id and p.status = 'published')
  )
  from destinations d
  join countries c on c.id = d.country_id
  join lateral (
    select x.slug, x.name from destination_translations x
    where x.destination_id = d.id and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) dt on true
  left join lateral (
    select x.name from country_translations x
    where x.country_id = c.id and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) ctr on true
  left join lateral (
    select x.name from region_translations x
    where x.region_id = d.region_id and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) rtr on true
  where d.id = p_destination_id
$$;

create or replace function public.api_list_destinations(
  p_locale text,
  p_fallback text,
  p_featured_only boolean default false
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(
    jsonb_agg(api_destination_card(d.id, p_locale, p_fallback) order by d.sort_order, d.slug),
    '[]'::jsonb
  )
  from destinations d
  where d.is_active and (not p_featured_only or d.is_featured)
$$;

-- Resolves a destination by localized slug, any-locale slug or canonical slug.
-- `requestedSlugMatches` tells the app whether it must redirect to `slug`.
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
      )
    order by exists (
      select 1 from destination_translations t
      where t.destination_id = d.id and t.slug = p_slug and t.locale = p_locale
    ) desc
    limit 1
  )
  select api_destination_card(d.id, p_locale, p_fallback) || jsonb_build_object(
    'description', tr.description,
    'seoTitle', tr.seo_title,
    'seoDescription', tr.seo_description,
    'contentLocale', tr.locale,
    'slugs', (select jsonb_object_agg(t.locale, t.slug) from destination_translations t where t.destination_id = d.id),
    'requestedSlugMatches', tr.slug = p_slug,
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
-- Taxonomy
-- -----------------------------------------------------------------------------
-- With a destination, only types that have published places there.
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
          where p.place_type = pt.code and p.status = 'published'
            and (p_destination_id is null or p.destination_id = p_destination_id)
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

create or replace function public.api_list_features(p_locale text, p_fallback text)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'code', f.code,
    'groupCode', f.group_code,
    'icon', f.icon,
    'isFilterable', f.is_filterable,
    'name', tr.name
  ) order by f.sort_order, f.code), '[]'::jsonb)
  from features f
  join lateral (
    select x.name from feature_translations x
    where x.feature_code = f.code and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) tr on true
  where f.is_active
$$;

create or replace function public.api_category_place_count(p_category_id uuid, p_destination_id uuid)
returns integer
language sql
stable
set search_path = public, extensions
as $$
  select count(*)::integer
  from place_categories pc
  join places p on p.id = pc.place_id and p.status = 'published'
  where pc.category_id = p_category_id
    and (p_destination_id is null or p.destination_id = p_destination_id)
$$;

-- With a destination, only categories that have published places there.
create or replace function public.api_list_categories(
  p_locale text,
  p_fallback text,
  p_destination_id uuid default null
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(item order by sort_order, slug), '[]'::jsonb)
  from (
    select
      c.sort_order,
      c.slug,
      jsonb_build_object(
        'id', c.id,
        'slug', tr.slug,
        'name', tr.name,
        'groupCode', c.group_code,
        'icon', c.icon,
        'isFeatured', c.is_featured,
        'placeCount', api_category_place_count(c.id, p_destination_id)
      ) as item
    from categories c
    join lateral (
      select x.slug, x.name from category_translations x
      where x.category_id = c.id and x.locale in (p_locale, p_fallback)
      order by x.locale = p_locale desc limit 1
    ) tr on true
    where c.is_active
  ) rows
  where p_destination_id is null or (item ->> 'placeCount')::integer > 0
$$;

create or replace function public.api_get_category(
  p_locale text,
  p_fallback text,
  p_category_id uuid,
  p_destination_id uuid default null
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', c.id,
    'slug', tr.slug,
    'name', tr.name,
    'description', tr.description,
    'seoTitle', tr.seo_title,
    'seoDescription', tr.seo_description,
    'groupCode', c.group_code,
    'contentLocale', tr.locale,
    'slugs', (select jsonb_object_agg(t.locale, t.slug) from category_translations t where t.category_id = c.id),
    'placeCount', api_category_place_count(c.id, p_destination_id),
    'updatedAt', c.updated_at
  )
  from categories c
  join lateral (
    select x.* from category_translations x
    where x.category_id = c.id and x.locale in (p_locale, p_fallback)
    order by x.locale = p_locale desc limit 1
  ) tr on true
  where c.id = p_category_id and c.is_active
$$;

-- -----------------------------------------------------------------------------
-- Destination sub-path resolution: /{locale}/{destination}/{segment}
-- Precedence: place-type listing → landing page → category page.
-- `locale` is the locale the slug was found in; the app redirects to the
-- requested locale's slug when they differ.
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
        jsonb_build_object('kind', 'place_type', 'key', pt.code, 'locale', t.locale) as match
      from place_type_translations t
      join place_types pt on pt.code = t.place_type_code and pt.is_active and pt.has_listing_page
      where t.slug = p_segment
    )
    union all
    (
      select 2, (t.locale = p_locale),
        jsonb_build_object('kind', 'landing_page', 'key', l.id, 'locale', t.locale)
      from landing_page_translations t
      join landing_pages l on l.id = t.landing_page_id and l.is_published
      where t.destination_id = p_destination_id and t.slug = p_segment
    )
    union all
    (
      select 3, (t.locale = p_locale),
        jsonb_build_object('kind', 'category', 'key', c.id, 'locale', t.locale)
      from category_translations t
      join categories c on c.id = t.category_id and c.is_active
      where t.slug = p_segment
    )
  ) candidates
  order by exact desc, precedence
  limit 1
$$;

-- -----------------------------------------------------------------------------
-- Landing pages (no locale fallback: editorial pages exist only where written)
-- -----------------------------------------------------------------------------
create or replace function public.api_get_landing_page(p_locale text, p_landing_page_id uuid)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', l.id,
    'key', l.key,
    'destinationId', l.destination_id,
    'placeType', l.place_type,
    'categoryId', l.category_id,
    'filters', l.filters,
    'sort', l.sort,
    'maxItems', l.max_items,
    'isIndexable', l.is_indexable,
    'pinnedPlaceIds', coalesce((
      select jsonb_agg(lp.place_id order by lp.position)
      from landing_page_places lp where lp.landing_page_id = l.id
    ), '[]'::jsonb),
    'slug', t.slug,
    'title', t.title,
    'intro', t.intro,
    'body', t.body,
    'seoTitle', t.seo_title,
    'seoDescription', t.seo_description,
    'slugs', (select jsonb_object_agg(x.locale, x.slug) from landing_page_translations x where x.landing_page_id = l.id),
    'updatedAt', greatest(l.updated_at, t.updated_at)
  )
  from landing_pages l
  join landing_page_translations t on t.landing_page_id = l.id and t.locale = p_locale
  where l.id = p_landing_page_id and l.is_published
$$;

create or replace function public.api_list_landing_pages(
  p_locale text,
  p_destination_id uuid,
  p_featured_only boolean default false
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', l.id,
    'key', l.key,
    'slug', t.slug,
    'title', t.title,
    'intro', t.intro
  ) order by l.sort_order, l.key), '[]'::jsonb)
  from landing_pages l
  join landing_page_translations t on t.landing_page_id = l.id and t.locale = p_locale
  where l.destination_id = p_destination_id
    and l.is_published
    and (not p_featured_only or l.is_featured)
$$;

-- -----------------------------------------------------------------------------
-- Place search. Organic ordering only; promotions are never considered here.
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
  with filtered as (
    select p.id, p.name, p.rating, p.review_count, p.price_level, p.ranking_score
    from places p
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
        nullif(trim(p_query), '') is null
        or immutable_unaccent(lower(p.name)) like '%' || immutable_unaccent(lower(
          replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_')
        )) || '%'
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
        case when p_sort = 'name' then f.name end asc,
        f.ranking_score desc nulls last,
        f.rating desc nulls last,
        f.review_count desc nulls last,
        f.name,
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
-- Place detail and related places
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
  where p.destination_id = p_destination_id and p.slug = p_slug and p.status = 'published'
$$;

-- Great-circle distance in kilometres.
create or replace function public.haversine_km(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select 6371.0088 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

-- Bounding-box prefilter (uses places_geo_idx) followed by exact distance.
-- Migration path to PostGIS documented in docs/ARCHITECTURE.md.
create or replace function public.api_nearby_places(
  p_locale text,
  p_fallback text,
  p_place_id uuid,
  p_radius_km float8 default 3,
  p_limit integer default 4
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  with source as (
    select id, latitude::float8 as lat, longitude::float8 as lng
    from places where id = p_place_id and latitude is not null
  ),
  candidates as (
    select p.id, haversine_km(s.lat, s.lng, p.latitude::float8, p.longitude::float8) as distance_km
    from places p, source s
    where p.status = 'published'
      and p.id <> s.id
      and p.latitude between s.lat - p_radius_km / 111.0 and s.lat + p_radius_km / 111.0
      and p.longitude between s.lng - p_radius_km / (111.0 * greatest(cos(radians(s.lat)), 0.01))
                          and s.lng + p_radius_km / (111.0 * greatest(cos(radians(s.lat)), 0.01))
  )
  select coalesce(jsonb_agg(
    api_place_card(c.id, p_locale, p_fallback) || jsonb_build_object('distanceKm', round(c.distance_km::numeric, 2))
    order by c.distance_km
  ), '[]'::jsonb)
  from (
    select * from candidates where distance_km <= p_radius_km
    order by distance_km limit least(greatest(p_limit, 1), 24)
  ) c
$$;

-- -----------------------------------------------------------------------------
-- Sitemaps. Only indexable content: published, non-demo, translated locales.
-- -----------------------------------------------------------------------------
create or replace function public.api_sitemap_destinations()
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'slug', d.slug,
    'slugs', (select jsonb_object_agg(t.locale, t.slug) from destination_translations t where t.destination_id = d.id),
    'updatedAt', d.updated_at
  ) order by d.slug), '[]'::jsonb)
  from destinations d
  where d.is_active
$$;

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
        'locales', (select jsonb_agg(t.locale order by t.locale) from place_translations t where t.place_id = p.id),
        'updatedAt', p.updated_at
      ) order by p.slug)
      from places p
      where p.destination_id = p_destination_id and p.status = 'published' and not p.is_demo
        and exists (select 1 from place_translations t where t.place_id = p.id)
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
      ) order by pt.sort_order)
      from place_types pt
      where pt.is_active and pt.has_listing_page and exists (
        select 1 from places p
        where p.destination_id = p_destination_id and p.place_type = pt.code
          and p.status = 'published' and not p.is_demo
      )
    ), '[]'::jsonb)
  )
$$;

-- -----------------------------------------------------------------------------
-- Grants: the read API is the only surface the public site needs.
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
revoke select on public.place_promotions from anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
