-- Public visibility is enforced both by invoker SQL and RLS.
alter table public.landing_pages add column is_demo boolean not null default false;
-- Known example rows only; do not classify real editorial landings by their title.
update public.landing_pages set is_demo = true where id in (
  '60000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002',
  '60000000-0000-4000-8000-000000000003'
);

-- Preview is opt-in for the embedded owner connection only. Public roles cannot
-- enable it, even by setting this custom GUC. All functions remain invoker.
create or replace function public.content_visible(p_demo boolean)
returns boolean language sql stable set search_path = '' as $$
  select not p_demo or (current_user = 'postgres'
    and coalesce(current_setting('app.demo_preview', true), '') = 'on')
$$;

create or replace function public.place_visible(p_id uuid)
returns boolean language sql stable set search_path = public, extensions as $$
  select exists (
    select 1 from places p
    join destinations d on d.id = p.destination_id and d.is_active
    join place_types pt on pt.code = p.place_type and pt.is_active
    where p.id = p_id and p.status = 'published' and content_visible(p.is_demo)
  )
$$;

-- Approval is explicit (is_verified); length checks are a floor, not a substitute
-- for editorial review. Optional ratings, ranking and websites are not required.
create or replace function public.editorial_text_length(p_text text)
returns integer language sql immutable set search_path = '' as $$
  select length(btrim(regexp_replace(coalesce(p_text, ''), '[[:space:]]+', ' ', 'g')))
$$;

create or replace function public.place_locale_indexable(p_id uuid, p_locale text)
returns boolean language sql stable set search_path = public, extensions as $$
  select exists (
    select 1 from places p join place_translations t on t.place_id = p.id
    where p.id = p_id and t.locale = p_locale and place_visible(p.id)
      and not p.is_demo and p.is_verified and editorial_text_length(p.name) > 1
      and (editorial_text_length(p.address_line) > 0
        or (p.latitude is not null and p.longitude is not null))
      and editorial_text_length(p.featured_image_url) > 0
      and editorial_text_length(p.featured_image_credit) > 0
      and editorial_text_length(t.short_description) >= 40
      and editorial_text_length(t.full_description) >= 160
  )
$$;

create or replace function public.destination_locale_indexable(p_id uuid, p_locale text)
returns boolean language sql stable set search_path = public, extensions as $$
  select exists (
    select 1 from destinations d join destination_translations t on t.destination_id = d.id
    where d.id = p_id and d.is_active and t.locale = p_locale
      and editorial_text_length(t.description) >= 80
      and exists (select 1 from places p where p.destination_id = d.id
        and place_visible(p.id) and not p.is_demo)
  )
$$;

create or replace function public.landing_locale_indexable(p_id uuid, p_locale text)
returns boolean language sql stable set search_path = public, extensions as $$
  select exists (
    select 1 from landing_pages l join landing_page_translations t on t.landing_page_id = l.id
    where l.id = p_id and l.is_published and l.is_indexable and not l.is_demo
      and t.locale = p_locale and destination_locale_indexable(l.destination_id, p_locale)
      and editorial_text_length(t.intro) >= 80 and editorial_text_length(t.body) >= 160
      and least(l.max_items, (select count(*) from places p
        where p.destination_id = l.destination_id and place_visible(p.id) and not p.is_demo
          and (l.place_type is null or place_has_type(p.id, p.place_type, l.place_type))
          and (l.category_id is null or exists (select 1 from place_categories pc
            where pc.place_id = p.id and pc.category_id = l.category_id))
          and not exists (select 1 from jsonb_array_elements_text(coalesce(l.filters->'features', '[]')) f
            where not exists (select 1 from place_features pf where pf.place_id = p.id and pf.feature_code = f))
          and (jsonb_array_length(coalesce(l.filters->'priceLevels', '[]')) = 0
            or p.price_level in (select value::integer from jsonb_array_elements_text(l.filters->'priceLevels')))
      )) >= 3
  )
$$;

-- api_place_card
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
  where p.id = p_place_id and place_visible(p.id)
$$;

-- api_destination_card
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
    'placeCount', (select count(*) from places p where p.destination_id = d.id and place_visible(p.id))
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

-- api_get_destination
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
    'indexableSlugs', (select jsonb_object_agg(t.locale, t.slug) from destination_translations t
      where t.destination_id = d.id and destination_locale_indexable(d.id, t.locale)),
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

-- api_list_place_types
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
          where place_visible(p.id)
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

-- api_category_place_count
create or replace function public.api_category_place_count(p_category_id uuid, p_destination_id uuid)
returns integer
language sql
stable
set search_path = public, extensions
as $$
  select count(*)::integer
  from place_categories pc
  join places p on p.id = pc.place_id and place_visible(p.id)
  where pc.category_id = p_category_id
    and (p_destination_id is null or p.destination_id = p_destination_id)
$$;

-- api_get_category
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
    'indexableSlugs', (select jsonb_object_agg(t.locale, t.slug) from category_translations t
      where t.category_id = c.id and editorial_text_length(t.description) >= 80),
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

-- api_resolve_destination_segment
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
      join landing_pages l on l.id = t.landing_page_id and l.is_published and content_visible(l.is_demo)
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

-- api_get_landing_page
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
    'isIndexable', landing_locale_indexable(l.id, p_locale),
    'indexableSlugs', (select jsonb_object_agg(x.locale, x.slug) from landing_page_translations x
      where x.landing_page_id = l.id and landing_locale_indexable(l.id, x.locale)),
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
  where l.id = p_landing_page_id and l.is_published and content_visible(l.is_demo)
$$;

-- api_list_landing_pages
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
    and l.is_published and content_visible(l.is_demo)
    and (not p_featured_only or l.is_featured)
$$;

-- api_search_places
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
    where place_visible(p.id)
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

-- api_get_place
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
    'indexableLocales', coalesce((select jsonb_agg(x.locale order by x.locale) from place_translations x
      where x.place_id = p.id and place_locale_indexable(p.id, x.locale)), '[]'::jsonb),
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
    and place_visible(p.id)
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

-- api_nearby_places
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
    from places where id = p_place_id and place_visible(id) and latitude is not null
  ),
  candidates as (
    select p.id, haversine_km(s.lat, s.lng, p.latitude::float8, p.longitude::float8) as distance_km
    from places p, source s
    where place_visible(p.id)
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

-- api_sitemap_destinations
create or replace function public.api_sitemap_destinations()
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'slug', d.slug,
    'slugs', (select jsonb_object_agg(t.locale, t.slug) from destination_translations t where t.destination_id = d.id and destination_locale_indexable(d.id, t.locale)),
    'updatedAt', d.updated_at
  ) order by d.slug), '[]'::jsonb)
  from destinations d
  where d.is_active and exists (select 1 from destination_translations t
      where t.destination_id = d.id and destination_locale_indexable(d.id, t.locale))
$$;

-- api_sitemap_destination_entries
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
          where t.place_id = p.id and place_locale_indexable(p.id, t.locale)
        ),
        'updatedAt', p.updated_at
      ) order by p.slug)
      from places p
      where p.destination_id = p_destination_id and place_visible(p.id) and not p.is_demo
        and exists (
          select 1 from place_translations t where t.place_id = p.id and place_locale_indexable(p.id, t.locale)
        )
    ), '[]'::jsonb),
    'landingPages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slugs', (select jsonb_object_agg(t.locale, t.slug) from landing_page_translations t where t.landing_page_id = l.id and landing_locale_indexable(l.id, t.locale)),
        'updatedAt', l.updated_at
      ) order by l.key)
      from landing_pages l
      where not l.is_demo and l.destination_id = p_destination_id and l.is_published and content_visible(l.is_demo) and l.is_indexable
        and exists (select 1 from landing_page_translations t where t.landing_page_id = l.id and landing_locale_indexable(l.id, t.locale))
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slugs', (select jsonb_object_agg(t.locale, t.slug) from category_translations t where t.category_id = c.id and editorial_text_length(t.description) >= 80)
      ) order by c.slug)
      from categories c
      where c.is_active and (
        select count(*) from place_categories pc
        join places p on p.id = pc.place_id and place_visible(p.id) and not p.is_demo
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
        where p.destination_id = p_destination_id and place_visible(p.id) and not p.is_demo
          and place_has_type(p.id, p.place_type, pt.code)
      ) >= p_min_category_places
    ), '[]'::jsonb)
  )
$$;

-- api_get_region
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
      where x.region_id = r.id and editorial_text_length(x.description) >= 80
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

-- api_sitemap_regions
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
      where x.region_id = r.id and editorial_text_length(x.description) >= 80
    ), '[]'::jsonb),
    'updatedAt', greatest(r.updated_at, (select max(x.updated_at) from region_translations x where x.region_id = r.id))
  ) order by r.slug), '[]'::jsonb)
  from regions r
  where r.is_active and r.is_hub
    and exists (
      select 1 from places p join destinations d on d.id = p.destination_id and d.is_active
      where place_visible(p.id) and not p.is_demo and d.region_id in (select region_subtree(r.id))
    )
$$;

alter policy "Public read" on public.places using (status = 'published' and not is_demo
  and exists (select 1 from destinations d where d.id = destination_id and d.is_active)
  and exists (select 1 from place_types pt where pt.code = place_type and pt.is_active));
alter policy "Public read" on public.landing_pages using (is_published and not is_demo
  and exists (select 1 from destinations d where d.id = destination_id and d.is_active));
alter policy "Public read" on public.place_translations using (exists (select 1 from places p where p.id = place_id and p.status = 'published' and not p.is_demo));
alter policy "Public read" on public.place_categories using (exists (select 1 from places p where p.id = place_id and p.status = 'published' and not p.is_demo));
alter policy "Public read" on public.place_features using (exists (select 1 from places p where p.id = place_id and p.status = 'published' and not p.is_demo));
alter policy "Public read" on public.place_secondary_types using (exists (select 1 from places p where p.id = place_id and p.status = 'published' and not p.is_demo));
alter policy "Public read" on public.landing_page_translations using (exists (select 1 from landing_pages l where l.id = landing_page_id and l.is_published and not l.is_demo));
alter policy "Public read" on public.landing_page_places using (
  exists (select 1 from landing_pages l where l.id = landing_page_id and l.is_published and not l.is_demo)
  and exists (select 1 from places p where p.id = place_id and p.status = 'published' and not p.is_demo));
-- Aliases of drafts/demo rows must not leak their IDs or resolve publicly.
alter policy "Public read" on public.slug_aliases using (
  (kind = 'destination' and exists (select 1 from destinations d where d.id::text = target_key and d.is_active))
  or (kind = 'place_type' and exists (select 1 from place_types pt where pt.code = target_key and pt.is_active))
  or (kind = 'category' and exists (select 1 from categories c where c.id::text = target_key and c.is_active))
  or (kind = 'place' and exists (select 1 from places p where p.id::text = target_key and p.destination_id = scope_id))
  or (kind = 'landing_page' and exists (select 1 from landing_pages l where l.id::text = target_key and l.destination_id = scope_id))
);
-- Keep the invoker API: it requires table SELECT and stable IDs for joins and RPC
-- inputs. These IDs are identifiers, not secrets. Never expose import provenance.
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from public, anon, authenticated;
revoke all on public.place_promotions, public.place_import_records from public, anon, authenticated;
revoke execute on all functions in schema public from public;
revoke execute on function public.apply_place_import(text, jsonb) from anon, authenticated;
grant execute on function public.content_visible(boolean), public.place_visible(uuid),
  public.editorial_text_length(text),
  public.place_locale_indexable(uuid, text), public.destination_locale_indexable(uuid, text),
  public.landing_locale_indexable(uuid, text) to anon, authenticated;
