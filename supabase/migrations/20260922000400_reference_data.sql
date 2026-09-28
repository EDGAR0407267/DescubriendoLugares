-- Supported content locales. Adding a language: insert a row here (new
-- migration), then follow docs/ARCHITECTURE.md → "Adding a language".
insert into public.locales (code, native_name, is_default, sort_order) values
  ('es', 'Español', true, 1),
  ('ca', 'Català', false, 2),
  ('en', 'English', false, 3),
  ('fr', 'Français', false, 4),
  ('de', 'Deutsch', false, 5),
  ('it', 'Italiano', false, 6);
