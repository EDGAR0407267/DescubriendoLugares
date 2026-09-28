-- =============================================================================
-- Core schema: geography, places, taxonomy, landing pages and translations.
--
-- Conventions
--   * Every translatable entity has a `<entity>_translations` table keyed by
--     (<entity>_id, locale). See docs/ARCHITECTURE.md → "Multilingual content".
--   * Proper nouns (place names) live on the base table and are not translated.
--   * Slugs use the `slug` domain; uniqueness is enforced in the scope that the
--     URL structure requires (see comments on each constraint).
--   * Extensions live in the `extensions` schema (Supabase convention).
-- =============================================================================

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- unaccent() is STABLE; this wrapper is safe to mark IMMUTABLE because the
-- dictionary is fixed, which allows it in index expressions.
create or replace function public.immutable_unaccent(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, value)
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create domain public.slug as text
  check (value ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(value) <= 120);

create domain public.code as text
  check (value ~ '^[a-z][a-z0-9]*(_[a-z0-9]+)*$' and char_length(value) <= 64);

-- -----------------------------------------------------------------------------
-- Locales
-- -----------------------------------------------------------------------------
create table public.locales (
  code        text primary key check (code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  native_name text not null,
  is_default  boolean not null default false,
  is_active   boolean not null default true,
  sort_order  smallint not null default 0
);

create unique index locales_single_default_idx on public.locales (is_default) where is_default;

-- -----------------------------------------------------------------------------
-- Geography: country → region (optionally nested) → destination
-- -----------------------------------------------------------------------------
create table public.countries (
  id         uuid primary key default gen_random_uuid(),
  iso_code   char(2) not null unique check (iso_code ~ '^[A-Z]{2}$'),
  slug       public.slug not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.country_translations (
  country_id uuid not null references public.countries (id) on delete cascade,
  locale     text not null references public.locales (code) on update cascade,
  name       text not null check (char_length(name) between 1 and 120),
  primary key (country_id, locale)
);

create table public.regions (
  id         uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete restrict,
  parent_id  uuid references public.regions (id) on delete restrict,
  slug       public.slug not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, slug),
  -- Target of the composite FK that keeps destinations.country_id consistent.
  unique (id, country_id)
);

create index regions_parent_idx on public.regions (parent_id);

create table public.region_translations (
  region_id uuid not null references public.regions (id) on delete cascade,
  locale    text not null references public.locales (code) on update cascade,
  name      text not null check (char_length(name) between 1 and 120),
  primary key (region_id, locale)
);

create table public.destinations (
  id                uuid primary key default gen_random_uuid(),
  country_id        uuid not null,
  region_id         uuid not null,
  -- Canonical, locale-independent identifier (admin, legacy URLs, fallback).
  slug              public.slug not null unique,
  latitude          numeric(9, 6) not null check (latitude between -90 and 90),
  longitude         numeric(9, 6) not null check (longitude between -180 and 180),
  timezone          text not null default 'Europe/Madrid',
  hero_image_url    text check (hero_image_url ~ '^https://'),
  hero_image_credit text,
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  sort_order        smallint not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  foreign key (region_id, country_id) references public.regions (id, country_id) on delete restrict
);

create index destinations_region_idx on public.destinations (region_id);
create index destinations_country_idx on public.destinations (country_id);
create index destinations_featured_idx on public.destinations (is_featured, sort_order) where is_active;

create table public.destination_translations (
  destination_id  uuid not null references public.destinations (id) on delete cascade,
  locale          text not null references public.locales (code) on update cascade,
  -- Destination URLs are /{locale}/{slug}: unique per locale across the world.
  slug            public.slug not null,
  name            text not null check (char_length(name) between 1 and 120),
  description     text,
  seo_title       text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (destination_id, locale),
  unique (locale, slug)
);

-- -----------------------------------------------------------------------------
-- Place types (restaurant, bar, beach_club, hotel, attraction, …)
-- -----------------------------------------------------------------------------
create table public.place_types (
  code               public.code primary key,
  -- Schema.org type used for JSON-LD (Restaurant, BarOrPub, Hotel, …).
  schema_type        text not null default 'LocalBusiness' check (schema_type ~ '^[A-Z][A-Za-z]+$'),
  -- Whether /{locale}/{destination}/{plural-slug} listing pages exist.
  has_listing_page   boolean not null default true,
  is_active          boolean not null default true,
  sort_order         smallint not null default 0
);

create table public.place_type_translations (
  place_type_code text not null references public.place_types (code) on update cascade on delete cascade,
  locale          text not null references public.locales (code) on update cascade,
  name            text not null,
  plural_name     text not null,
  -- Listing segment, e.g. "restaurantes" in /es/cambrils/restaurantes.
  slug            public.slug not null,
  primary key (place_type_code, locale),
  unique (locale, slug)
);

-- -----------------------------------------------------------------------------
-- Places
-- -----------------------------------------------------------------------------
create table public.places (
  id                    uuid primary key default gen_random_uuid(),
  destination_id        uuid not null references public.destinations (id) on delete restrict,
  place_type            text not null references public.place_types (code) on update cascade,
  -- Place names are proper nouns, so the slug is not localized.
  slug                  public.slug not null,
  name                  text not null check (char_length(name) between 1 and 160),
  address_line          text,
  postal_code           text,
  latitude              numeric(9, 6) check (latitude between -90 and 90),
  longitude             numeric(9, 6) check (longitude between -180 and 180),
  phone                 text check (phone ~ '^\+?[0-9 ()-]{6,20}$'),
  website               text check (website ~ '^https?://'),
  instagram             text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  price_level           smallint check (price_level between 1 and 4),
  average_price         numeric(8, 2) check (average_price >= 0),
  currency              char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  -- Third-party aggregate rating. Must always be attributable to a source.
  rating                numeric(2, 1) check (rating between 0 and 5),
  review_count          integer check (review_count >= 0),
  rating_source         text,
  featured_image_url    text check (featured_image_url ~ '^https://'),
  featured_image_credit text,
  status                text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured           boolean not null default false,
  is_verified           boolean not null default false,
  -- Fictional seed data. Excluded from structured data and never indexable.
  is_demo               boolean not null default false,
  -- Editorial quality signal (0–100) used as one ranking input.
  editorial_score       smallint check (editorial_score between 0 and 100),
  -- Organic ranking, computed offline by calculateRankingScore(). Never
  -- influenced by promotions (see place_promotions).
  ranking_score         numeric(7, 4),
  ranking_updated_at    timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Place URLs are /{locale}/{destination}/{place-segment}/{slug}.
  unique (destination_id, slug),
  check ((latitude is null) = (longitude is null)),
  check (rating is null or rating_source is not null),
  check (review_count is null or rating is not null)
);

create index places_listing_idx
  on public.places (destination_id, place_type, ranking_score desc nulls last)
  where status = 'published';
create index places_price_idx on public.places (destination_id, price_level) where status = 'published';
create index places_geo_idx on public.places (latitude, longitude) where status = 'published';
create index places_name_search_idx
  on public.places using gin (public.immutable_unaccent(lower(name)) extensions.gin_trgm_ops);

create table public.place_translations (
  place_id          uuid not null references public.places (id) on delete cascade,
  locale            text not null references public.locales (code) on update cascade,
  short_description text check (char_length(short_description) <= 280),
  full_description  text,
  seo_title         text check (char_length(seo_title) <= 70),
  seo_description   text check (char_length(seo_description) <= 170),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (place_id, locale)
);

-- -----------------------------------------------------------------------------
-- Categories (editorial discovery groupings; many-to-many with places)
-- -----------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        public.slug not null unique,
  group_code  text not null check (group_code in ('cuisine', 'dish', 'style', 'budget', 'audience', 'setting')),
  icon        text,
  is_active   boolean not null default true,
  is_featured boolean not null default false,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.category_translations (
  category_id     uuid not null references public.categories (id) on delete cascade,
  locale          text not null references public.locales (code) on update cascade,
  -- Category pages share the /{locale}/{destination}/{segment} namespace.
  slug            public.slug not null,
  name            text not null,
  description     text,
  seo_title       text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  primary key (category_id, locale),
  unique (locale, slug)
);

create table public.place_categories (
  place_id    uuid not null references public.places (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  is_primary  boolean not null default false,
  primary key (place_id, category_id)
);

create index place_categories_category_idx on public.place_categories (category_id, place_id);
create unique index place_categories_single_primary_idx on public.place_categories (place_id) where is_primary;

-- -----------------------------------------------------------------------------
-- Features (factual attributes: terrace, sea_view, vegan_options, …)
-- -----------------------------------------------------------------------------
create table public.features (
  code          public.code primary key,
  group_code    text not null check (group_code in ('amenities', 'dietary', 'ambience', 'services', 'accessibility')),
  icon          text,
  is_filterable boolean not null default true,
  is_active     boolean not null default true,
  sort_order    smallint not null default 0
);

create table public.feature_translations (
  feature_code text not null references public.features (code) on update cascade on delete cascade,
  locale       text not null references public.locales (code) on update cascade,
  name         text not null,
  primary key (feature_code, locale)
);

create table public.place_features (
  place_id     uuid not null references public.places (id) on delete cascade,
  feature_code text not null references public.features (code) on update cascade on delete cascade,
  primary key (place_id, feature_code)
);

create index place_features_feature_idx on public.place_features (feature_code, place_id);

-- -----------------------------------------------------------------------------
-- Landing pages: data-driven SEO pages (destination + criteria + editorial)
-- -----------------------------------------------------------------------------
create table public.landing_pages (
  id             uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations (id) on delete cascade,
  -- Stable internal identifier, e.g. "best-restaurants".
  key            public.slug not null,
  place_type     text references public.place_types (code) on update cascade,
  category_id    uuid references public.categories (id) on delete restrict,
  -- Extra criteria validated by the app (src/features/landing-pages/schema.ts):
  -- { "features": string[], "priceLevels": number[] }
  filters        jsonb not null default '{}'::jsonb check (jsonb_typeof(filters) = 'object'),
  sort           text not null default 'ranking' check (sort in ('ranking', 'rating', 'price_asc', 'price_desc', 'name')),
  max_items      smallint not null default 24 check (max_items between 1 and 100),
  is_indexable   boolean not null default true,
  is_published   boolean not null default false,
  is_featured    boolean not null default false,
  sort_order     smallint not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (destination_id, key),
  unique (id, destination_id)
);

create table public.landing_page_translations (
  landing_page_id uuid not null,
  -- Denormalized to scope slug uniqueness; kept consistent by the composite FK.
  destination_id  uuid not null,
  locale          text not null references public.locales (code) on update cascade,
  slug            public.slug not null,
  title           text not null check (char_length(title) between 1 and 120),
  intro           text,
  -- Plain text; paragraphs separated by blank lines. Never rendered as HTML.
  body            text,
  seo_title       text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (landing_page_id, locale),
  unique (destination_id, locale, slug),
  foreign key (landing_page_id, destination_id)
    references public.landing_pages (id, destination_id) on update cascade on delete cascade
);

-- Editorially pinned places, shown first on a landing page.
create table public.landing_page_places (
  landing_page_id uuid not null references public.landing_pages (id) on delete cascade,
  place_id        uuid not null references public.places (id) on delete cascade,
  position        smallint not null check (position >= 0),
  primary key (landing_page_id, place_id)
);

-- -----------------------------------------------------------------------------
-- Promotions (future monetization). Deliberately separate from `places` so
-- that sponsored placement can never leak into organic ranking. Not exposed
-- publicly until a dedicated, clearly labelled placement is built.
-- -----------------------------------------------------------------------------
create table public.place_promotions (
  id             uuid primary key default gen_random_uuid(),
  place_id       uuid not null references public.places (id) on delete cascade,
  destination_id uuid not null references public.destinations (id) on delete cascade,
  placement      text not null check (placement in ('home_featured', 'destination_top', 'listing_inline')),
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  created_at     timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index place_promotions_active_idx on public.place_promotions (destination_id, placement, starts_at, ends_at);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
create trigger countries_updated_at before update on public.countries
  for each row execute function public.set_updated_at();
create trigger regions_updated_at before update on public.regions
  for each row execute function public.set_updated_at();
create trigger destinations_updated_at before update on public.destinations
  for each row execute function public.set_updated_at();
create trigger destination_translations_updated_at before update on public.destination_translations
  for each row execute function public.set_updated_at();
create trigger places_updated_at before update on public.places
  for each row execute function public.set_updated_at();
create trigger place_translations_updated_at before update on public.place_translations
  for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger landing_pages_updated_at before update on public.landing_pages
  for each row execute function public.set_updated_at();
create trigger landing_page_translations_updated_at before update on public.landing_page_translations
  for each row execute function public.set_updated_at();
