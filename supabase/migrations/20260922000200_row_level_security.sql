-- =============================================================================
-- Row Level Security
--
-- The public site reads with the anon key. Only published / active content is
-- visible. Writes are reserved for the service role (future admin/CMS), which
-- bypasses RLS; no insert/update/delete policies are granted to anon.
-- =============================================================================

alter table public.locales enable row level security;
alter table public.countries enable row level security;
alter table public.country_translations enable row level security;
alter table public.regions enable row level security;
alter table public.region_translations enable row level security;
alter table public.destinations enable row level security;
alter table public.destination_translations enable row level security;
alter table public.place_types enable row level security;
alter table public.place_type_translations enable row level security;
alter table public.places enable row level security;
alter table public.place_translations enable row level security;
alter table public.categories enable row level security;
alter table public.category_translations enable row level security;
alter table public.place_categories enable row level security;
alter table public.features enable row level security;
alter table public.feature_translations enable row level security;
alter table public.place_features enable row level security;
alter table public.landing_pages enable row level security;
alter table public.landing_page_translations enable row level security;
alter table public.landing_page_places enable row level security;
alter table public.place_promotions enable row level security;

create policy "Public read" on public.locales for select to anon, authenticated using (is_active);
create policy "Public read" on public.countries for select to anon, authenticated using (is_active);
create policy "Public read" on public.country_translations for select to anon, authenticated using (true);
create policy "Public read" on public.regions for select to anon, authenticated using (is_active);
create policy "Public read" on public.region_translations for select to anon, authenticated using (true);
create policy "Public read" on public.destinations for select to anon, authenticated using (is_active);
create policy "Public read" on public.destination_translations for select to anon, authenticated
  using (exists (select 1 from public.destinations d where d.id = destination_id and d.is_active));
create policy "Public read" on public.place_types for select to anon, authenticated using (is_active);
create policy "Public read" on public.place_type_translations for select to anon, authenticated using (true);
create policy "Public read" on public.places for select to anon, authenticated using (status = 'published');
create policy "Public read" on public.place_translations for select to anon, authenticated
  using (exists (select 1 from public.places p where p.id = place_id and p.status = 'published'));
create policy "Public read" on public.categories for select to anon, authenticated using (is_active);
create policy "Public read" on public.category_translations for select to anon, authenticated using (true);
create policy "Public read" on public.place_categories for select to anon, authenticated using (true);
create policy "Public read" on public.features for select to anon, authenticated using (is_active);
create policy "Public read" on public.feature_translations for select to anon, authenticated using (true);
create policy "Public read" on public.place_features for select to anon, authenticated using (true);
create policy "Public read" on public.landing_pages for select to anon, authenticated using (is_published);
create policy "Public read" on public.landing_page_translations for select to anon, authenticated
  using (exists (select 1 from public.landing_pages l where l.id = landing_page_id and l.is_published));
create policy "Public read" on public.landing_page_places for select to anon, authenticated using (true);
-- place_promotions: intentionally no public policy yet.
