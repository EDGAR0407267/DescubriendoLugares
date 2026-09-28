-- Production reference data, independent of the development seed.
-- Existing editorial changes win; stable keys are kept for imports.
-- 1. Place types
-- -----------------------------------------------------------------------------
insert into public.place_types (code, schema_type, has_listing_page, is_active, sort_order) values
  ('restaurant', 'Restaurant', true, true, 1),
  ('cafe', 'CafeOrCoffeeShop', true, true, 3),
  ('beach_club', 'LocalBusiness', true, true, 9),
  ('hotel', 'Hotel', true, false, 10),
  ('attraction', 'TouristAttraction', true, false, 11),
  ('beach', 'Beach', true, false, 12)
on conflict do nothing;

insert into public.place_type_translations (place_type_code, locale, name, plural_name, slug) values
  ('restaurant', 'es', 'Restaurante', 'Restaurantes', 'restaurantes'),
  ('restaurant', 'ca', 'Restaurant', 'Restaurants', 'restaurants'),
  ('restaurant', 'en', 'Restaurant', 'Restaurants', 'restaurants'),
  ('restaurant', 'fr', 'Restaurant', 'Restaurants', 'restaurants'),
  ('restaurant', 'de', 'Restaurant', 'Restaurants', 'restaurants'),
  ('restaurant', 'it', 'Ristorante', 'Ristoranti', 'ristoranti'),
  ('cafe', 'es', 'Cafetería', 'Cafeterías', 'cafeterias'),
  ('cafe', 'ca', 'Cafeteria', 'Cafeteries', 'cafeteries'),
  ('cafe', 'en', 'Café', 'Cafés', 'cafes'),
  ('cafe', 'fr', 'Café', 'Cafés', 'cafes'),
  ('cafe', 'de', 'Café', 'Cafés', 'cafes'),
  ('cafe', 'it', 'Caffè', 'Caffè', 'caffe'),
  ('beach_club', 'es', 'Beach club', 'Beach clubs', 'beach-clubs'),
  ('beach_club', 'ca', 'Beach club', 'Beach clubs', 'beach-clubs'),
  ('beach_club', 'en', 'Beach club', 'Beach clubs', 'beach-clubs'),
  ('beach_club', 'fr', 'Beach club', 'Beach clubs', 'beach-clubs'),
  ('beach_club', 'de', 'Beachclub', 'Beachclubs', 'beachclubs'),
  ('beach_club', 'it', 'Beach club', 'Beach club', 'beach-club'),
  ('hotel', 'es', 'Hotel', 'Hoteles', 'hoteles'),
  ('hotel', 'ca', 'Hotel', 'Hotels', 'hotels'),
  ('hotel', 'en', 'Hotel', 'Hotels', 'hotels'),
  ('hotel', 'fr', 'Hôtel', 'Hôtels', 'hotels'),
  ('hotel', 'de', 'Hotel', 'Hotels', 'hotels'),
  ('hotel', 'it', 'Hotel', 'Hotel', 'hotel'),
  ('attraction', 'es', 'Atracción', 'Qué ver', 'que-ver'),
  ('attraction', 'ca', 'Atracció', 'Què veure', 'que-veure'),
  ('attraction', 'en', 'Attraction', 'Things to see', 'things-to-see'),
  ('attraction', 'fr', 'Attraction', 'À voir', 'a-voir'),
  ('attraction', 'de', 'Sehenswürdigkeit', 'Sehenswürdigkeiten', 'sehenswuerdigkeiten'),
  ('attraction', 'it', 'Attrazione', 'Cosa vedere', 'cosa-vedere'),
  ('beach', 'es', 'Playa', 'Playas', 'playas'),
  ('beach', 'ca', 'Platja', 'Platges', 'platges'),
  ('beach', 'en', 'Beach', 'Beaches', 'beaches'),
  ('beach', 'fr', 'Plage', 'Plages', 'plages'),
  ('beach', 'de', 'Strand', 'Strände', 'straende'),
  ('beach', 'it', 'Spiaggia', 'Spiagge', 'spiagge')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 2. Features and categories
-- -----------------------------------------------------------------------------
insert into public.features (code, group_code, icon, sort_order) values
  ('terrace', 'amenities', 'umbrella', 1),
  ('sea_view', 'ambience', 'waves', 2),
  ('beachfront', 'ambience', 'sun', 3),
  ('romantic', 'ambience', 'heart', 4),
  ('family_friendly', 'services', 'baby', 5),
  ('groups', 'services', 'users', 6),
  ('reservations', 'services', 'calendar-check', 7),
  ('takeaway', 'services', 'shopping-bag', 8),
  ('vegetarian_options', 'dietary', 'salad', 9),
  ('vegan_options', 'dietary', 'leaf', 10),
  ('gluten_free', 'dietary', 'wheat-off', 11),
  ('parking', 'amenities', 'car', 12)
on conflict do nothing;

insert into public.feature_translations (feature_code, locale, name) values
  ('terrace', 'es', 'Terraza'), ('terrace', 'ca', 'Terrassa'), ('terrace', 'en', 'Terrace'),
  ('terrace', 'fr', 'Terrasse'), ('terrace', 'de', 'Terrasse'), ('terrace', 'it', 'Terrazza'),
  ('sea_view', 'es', 'Vistas al mar'), ('sea_view', 'ca', 'Vistes al mar'), ('sea_view', 'en', 'Sea view'),
  ('sea_view', 'fr', 'Vue sur la mer'), ('sea_view', 'de', 'Meerblick'), ('sea_view', 'it', 'Vista mare'),
  ('beachfront', 'es', 'A pie de playa'), ('beachfront', 'ca', 'A peu de platja'), ('beachfront', 'en', 'Beachfront'),
  ('beachfront', 'fr', 'Les pieds dans le sable'), ('beachfront', 'de', 'Direkt am Strand'), ('beachfront', 'it', 'Sulla spiaggia'),
  ('romantic', 'es', 'Romántico'), ('romantic', 'ca', 'Romàntic'), ('romantic', 'en', 'Romantic'),
  ('romantic', 'fr', 'Romantique'), ('romantic', 'de', 'Romantisch'), ('romantic', 'it', 'Romantico'),
  ('family_friendly', 'es', 'Ideal para familias'), ('family_friendly', 'ca', 'Ideal per a famílies'), ('family_friendly', 'en', 'Family-friendly'),
  ('family_friendly', 'fr', 'Adapté aux familles'), ('family_friendly', 'de', 'Familienfreundlich'), ('family_friendly', 'it', 'Adatto alle famiglie'),
  ('groups', 'es', 'Grupos'), ('groups', 'ca', 'Grups'), ('groups', 'en', 'Groups'),
  ('groups', 'fr', 'Groupes'), ('groups', 'de', 'Gruppen'), ('groups', 'it', 'Gruppi'),
  ('reservations', 'es', 'Acepta reservas'), ('reservations', 'ca', 'Accepta reserves'), ('reservations', 'en', 'Takes reservations'),
  ('reservations', 'fr', 'Réservations'), ('reservations', 'de', 'Reservierung möglich'), ('reservations', 'it', 'Prenotazioni'),
  ('takeaway', 'es', 'Para llevar'), ('takeaway', 'ca', 'Per emportar'), ('takeaway', 'en', 'Takeaway'),
  ('takeaway', 'fr', 'À emporter'), ('takeaway', 'de', 'Zum Mitnehmen'), ('takeaway', 'it', 'Da asporto'),
  ('vegetarian_options', 'es', 'Opciones vegetarianas'), ('vegetarian_options', 'ca', 'Opcions vegetarianes'), ('vegetarian_options', 'en', 'Vegetarian options'),
  ('vegetarian_options', 'fr', 'Options végétariennes'), ('vegetarian_options', 'de', 'Vegetarische Optionen'), ('vegetarian_options', 'it', 'Opzioni vegetariane'),
  ('vegan_options', 'es', 'Opciones veganas'), ('vegan_options', 'ca', 'Opcions veganes'), ('vegan_options', 'en', 'Vegan options'),
  ('vegan_options', 'fr', 'Options véganes'), ('vegan_options', 'de', 'Vegane Optionen'), ('vegan_options', 'it', 'Opzioni vegane'),
  ('gluten_free', 'es', 'Sin gluten'), ('gluten_free', 'ca', 'Sense gluten'), ('gluten_free', 'en', 'Gluten-free'),
  ('gluten_free', 'fr', 'Sans gluten'), ('gluten_free', 'de', 'Glutenfrei'), ('gluten_free', 'it', 'Senza glutine'),
  ('parking', 'es', 'Aparcamiento'), ('parking', 'ca', 'Aparcament'), ('parking', 'en', 'Parking'),
  ('parking', 'fr', 'Parking'), ('parking', 'de', 'Parkplatz'), ('parking', 'it', 'Parcheggio')
on conflict do nothing;

insert into public.categories (id, slug, group_code, icon, is_featured, sort_order) values
  ('50000000-0000-4000-8000-000000000001', 'mediterranean', 'cuisine', 'fish', true, 1),
  ('50000000-0000-4000-8000-000000000002', 'rice-dishes', 'dish', 'cooking-pot', true, 2),
  ('50000000-0000-4000-8000-000000000003', 'italian', 'cuisine', 'pizza', false, 3),
  ('50000000-0000-4000-8000-000000000004', 'japanese', 'cuisine', 'fish-symbol', false, 4),
  ('50000000-0000-4000-8000-000000000005', 'seafood', 'dish', 'shell', true, 5),
  ('50000000-0000-4000-8000-000000000006', 'tapas', 'style', 'utensils', true, 6),
  ('50000000-0000-4000-8000-000000000007', 'burgers', 'dish', 'beef', false, 7),
  ('50000000-0000-4000-8000-000000000008', 'brunch', 'style', 'coffee', false, 8),
  ('50000000-0000-4000-8000-000000000009', 'beach-bars', 'setting', 'palmtree', true, 9),
  ('50000000-0000-4000-8000-000000000010', 'fine-dining', 'style', 'chef-hat', true, 10),
  ('50000000-0000-4000-8000-000000000011', 'budget', 'budget', 'piggy-bank', false, 11),
  ('50000000-0000-4000-8000-000000000012', 'romantic', 'audience', 'heart', true, 12),
  ('50000000-0000-4000-8000-000000000013', 'family', 'audience', 'baby', false, 13),
  ('50000000-0000-4000-8000-000000000014', 'seafront', 'setting', 'waves', true, 14),
  ('50000000-0000-4000-8000-000000000015', 'terrace', 'setting', 'umbrella', false, 15)
on conflict do nothing;

insert into public.category_translations (category_id, locale, slug, name) values
  ('50000000-0000-4000-8000-000000000001', 'es', 'mediterranea', 'Mediterránea'),
  ('50000000-0000-4000-8000-000000000001', 'ca', 'mediterrania', 'Mediterrània'),
  ('50000000-0000-4000-8000-000000000001', 'en', 'mediterranean', 'Mediterranean'),
  ('50000000-0000-4000-8000-000000000001', 'fr', 'mediterraneenne', 'Méditerranéenne'),
  ('50000000-0000-4000-8000-000000000001', 'de', 'mediterran', 'Mediterran'),
  ('50000000-0000-4000-8000-000000000001', 'it', 'mediterranea', 'Mediterranea'),
  ('50000000-0000-4000-8000-000000000002', 'es', 'arroces', 'Arroces'),
  ('50000000-0000-4000-8000-000000000002', 'ca', 'arrossos', 'Arrossos'),
  ('50000000-0000-4000-8000-000000000002', 'en', 'rice-dishes', 'Rice dishes'),
  ('50000000-0000-4000-8000-000000000002', 'fr', 'riz-et-paellas', 'Riz et paellas'),
  ('50000000-0000-4000-8000-000000000002', 'de', 'reisgerichte', 'Reisgerichte'),
  ('50000000-0000-4000-8000-000000000002', 'it', 'riso-e-paella', 'Riso e paella'),
  ('50000000-0000-4000-8000-000000000003', 'es', 'italiana', 'Italiana'),
  ('50000000-0000-4000-8000-000000000003', 'ca', 'italiana', 'Italiana'),
  ('50000000-0000-4000-8000-000000000003', 'en', 'italian', 'Italian'),
  ('50000000-0000-4000-8000-000000000003', 'fr', 'italienne', 'Italienne'),
  ('50000000-0000-4000-8000-000000000003', 'de', 'italienisch', 'Italienisch'),
  ('50000000-0000-4000-8000-000000000003', 'it', 'italiana', 'Italiana'),
  ('50000000-0000-4000-8000-000000000004', 'es', 'japonesa', 'Japonesa'),
  ('50000000-0000-4000-8000-000000000004', 'ca', 'japonesa', 'Japonesa'),
  ('50000000-0000-4000-8000-000000000004', 'en', 'japanese', 'Japanese'),
  ('50000000-0000-4000-8000-000000000004', 'fr', 'japonaise', 'Japonaise'),
  ('50000000-0000-4000-8000-000000000004', 'de', 'japanisch', 'Japanisch'),
  ('50000000-0000-4000-8000-000000000004', 'it', 'giapponese', 'Giapponese'),
  ('50000000-0000-4000-8000-000000000005', 'es', 'marisco', 'Marisco'),
  ('50000000-0000-4000-8000-000000000005', 'ca', 'marisc', 'Marisc'),
  ('50000000-0000-4000-8000-000000000005', 'en', 'seafood', 'Seafood'),
  ('50000000-0000-4000-8000-000000000005', 'fr', 'fruits-de-mer', 'Fruits de mer'),
  ('50000000-0000-4000-8000-000000000005', 'de', 'meeresfruechte', 'Meeresfrüchte'),
  ('50000000-0000-4000-8000-000000000005', 'it', 'frutti-di-mare', 'Frutti di mare'),
  ('50000000-0000-4000-8000-000000000006', 'es', 'tapas', 'Tapas'),
  ('50000000-0000-4000-8000-000000000006', 'ca', 'tapes', 'Tapes'),
  ('50000000-0000-4000-8000-000000000006', 'en', 'tapas', 'Tapas'),
  ('50000000-0000-4000-8000-000000000006', 'fr', 'tapas', 'Tapas'),
  ('50000000-0000-4000-8000-000000000006', 'de', 'tapas', 'Tapas'),
  ('50000000-0000-4000-8000-000000000006', 'it', 'tapas', 'Tapas'),
  ('50000000-0000-4000-8000-000000000007', 'es', 'hamburguesas', 'Hamburguesas'),
  ('50000000-0000-4000-8000-000000000007', 'ca', 'hamburgueses', 'Hamburgueses'),
  ('50000000-0000-4000-8000-000000000007', 'en', 'burgers', 'Burgers'),
  ('50000000-0000-4000-8000-000000000007', 'fr', 'burgers', 'Burgers'),
  ('50000000-0000-4000-8000-000000000007', 'de', 'burger', 'Burger'),
  ('50000000-0000-4000-8000-000000000007', 'it', 'hamburger', 'Hamburger'),
  ('50000000-0000-4000-8000-000000000008', 'es', 'brunch', 'Brunch'),
  ('50000000-0000-4000-8000-000000000008', 'ca', 'brunch', 'Brunch'),
  ('50000000-0000-4000-8000-000000000008', 'en', 'brunch', 'Brunch'),
  ('50000000-0000-4000-8000-000000000008', 'fr', 'brunch', 'Brunch'),
  ('50000000-0000-4000-8000-000000000008', 'de', 'brunch', 'Brunch'),
  ('50000000-0000-4000-8000-000000000008', 'it', 'brunch', 'Brunch'),
  ('50000000-0000-4000-8000-000000000009', 'es', 'chiringuitos', 'Chiringuitos'),
  ('50000000-0000-4000-8000-000000000009', 'ca', 'xiringuitos', 'Xiringuitos'),
  ('50000000-0000-4000-8000-000000000009', 'en', 'beach-bars', 'Beach bars'),
  ('50000000-0000-4000-8000-000000000009', 'fr', 'paillotes', 'Paillotes'),
  ('50000000-0000-4000-8000-000000000009', 'de', 'strandbars', 'Strandbars'),
  ('50000000-0000-4000-8000-000000000009', 'it', 'chioschi-in-spiaggia', 'Chioschi in spiaggia'),
  ('50000000-0000-4000-8000-000000000010', 'es', 'alta-cocina', 'Alta cocina'),
  ('50000000-0000-4000-8000-000000000010', 'ca', 'alta-cuina', 'Alta cuina'),
  ('50000000-0000-4000-8000-000000000010', 'en', 'fine-dining', 'Fine dining'),
  ('50000000-0000-4000-8000-000000000010', 'fr', 'gastronomique', 'Gastronomique'),
  ('50000000-0000-4000-8000-000000000010', 'de', 'gehobene-kueche', 'Gehobene Küche'),
  ('50000000-0000-4000-8000-000000000010', 'it', 'alta-cucina', 'Alta cucina'),
  ('50000000-0000-4000-8000-000000000011', 'es', 'economicos', 'Económicos'),
  ('50000000-0000-4000-8000-000000000011', 'ca', 'economics', 'Econòmics'),
  ('50000000-0000-4000-8000-000000000011', 'en', 'budget-friendly', 'Budget-friendly'),
  ('50000000-0000-4000-8000-000000000011', 'fr', 'petits-prix', 'Petits prix'),
  ('50000000-0000-4000-8000-000000000011', 'de', 'guenstig', 'Günstig'),
  ('50000000-0000-4000-8000-000000000011', 'it', 'economici', 'Economici'),
  ('50000000-0000-4000-8000-000000000012', 'es', 'romanticos', 'Románticos'),
  ('50000000-0000-4000-8000-000000000012', 'ca', 'romantics', 'Romàntics'),
  ('50000000-0000-4000-8000-000000000012', 'en', 'romantic', 'Romantic'),
  ('50000000-0000-4000-8000-000000000012', 'fr', 'romantiques', 'Romantiques'),
  ('50000000-0000-4000-8000-000000000012', 'de', 'romantisch', 'Romantisch'),
  ('50000000-0000-4000-8000-000000000012', 'it', 'romantici', 'Romantici'),
  ('50000000-0000-4000-8000-000000000013', 'es', 'familias', 'Familias'),
  ('50000000-0000-4000-8000-000000000013', 'ca', 'families', 'Famílies'),
  ('50000000-0000-4000-8000-000000000013', 'en', 'family-friendly', 'Family-friendly'),
  ('50000000-0000-4000-8000-000000000013', 'fr', 'en-famille', 'En famille'),
  ('50000000-0000-4000-8000-000000000013', 'de', 'familienfreundlich', 'Familienfreundlich'),
  ('50000000-0000-4000-8000-000000000013', 'it', 'per-famiglie', 'Per famiglie'),
  ('50000000-0000-4000-8000-000000000014', 'es', 'frente-al-mar', 'Frente al mar'),
  ('50000000-0000-4000-8000-000000000014', 'ca', 'davant-del-mar', 'Davant del mar'),
  ('50000000-0000-4000-8000-000000000014', 'en', 'seafront', 'Seafront'),
  ('50000000-0000-4000-8000-000000000014', 'fr', 'face-a-la-mer', 'Face à la mer'),
  ('50000000-0000-4000-8000-000000000014', 'de', 'am-meer', 'Am Meer'),
  ('50000000-0000-4000-8000-000000000014', 'it', 'fronte-mare', 'Fronte mare'),
  ('50000000-0000-4000-8000-000000000015', 'es', 'terraza', 'Terraza'),
  ('50000000-0000-4000-8000-000000000015', 'ca', 'terrassa', 'Terrassa'),
  ('50000000-0000-4000-8000-000000000015', 'en', 'terrace', 'Terrace'),
  ('50000000-0000-4000-8000-000000000015', 'fr', 'terrasse', 'Terrasse'),
  ('50000000-0000-4000-8000-000000000015', 'de', 'terrasse', 'Terrasse'),
  ('50000000-0000-4000-8000-000000000015', 'it', 'terrazza', 'Terrazza')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 3. Geography: Spain → Catalonia → Costa Daurada → destinations
-- -----------------------------------------------------------------------------
insert into public.countries (id, iso_code, slug) values
  ('10000000-0000-4000-8000-000000000001', 'ES', 'spain')
on conflict do nothing;

insert into public.country_translations (country_id, locale, name) values
  ('10000000-0000-4000-8000-000000000001', 'es', 'España'),
  ('10000000-0000-4000-8000-000000000001', 'ca', 'Espanya'),
  ('10000000-0000-4000-8000-000000000001', 'en', 'Spain'),
  ('10000000-0000-4000-8000-000000000001', 'fr', 'Espagne'),
  ('10000000-0000-4000-8000-000000000001', 'de', 'Spanien'),
  ('10000000-0000-4000-8000-000000000001', 'it', 'Spagna')
on conflict do nothing;

insert into public.regions (id, country_id, parent_id, slug) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 'catalonia'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'costa-daurada')
on conflict do nothing;

-- Costa Daurada has a regional hub page (/es/costa-daurada); its editorial
-- text is filled in below, after the translations.
update public.regions set is_hub = true where slug = 'costa-daurada';

insert into public.region_translations (region_id, locale, name) values
  ('20000000-0000-4000-8000-000000000001', 'es', 'Cataluña'),
  ('20000000-0000-4000-8000-000000000001', 'ca', 'Catalunya'),
  ('20000000-0000-4000-8000-000000000001', 'en', 'Catalonia'),
  ('20000000-0000-4000-8000-000000000001', 'fr', 'Catalogne'),
  ('20000000-0000-4000-8000-000000000001', 'de', 'Katalonien'),
  ('20000000-0000-4000-8000-000000000001', 'it', 'Catalogna'),
  ('20000000-0000-4000-8000-000000000002', 'es', 'Costa Dorada'),
  ('20000000-0000-4000-8000-000000000002', 'ca', 'Costa Daurada'),
  ('20000000-0000-4000-8000-000000000002', 'en', 'Costa Daurada'),
  ('20000000-0000-4000-8000-000000000002', 'fr', 'Costa Daurada'),
  ('20000000-0000-4000-8000-000000000002', 'de', 'Costa Daurada'),
  ('20000000-0000-4000-8000-000000000002', 'it', 'Costa Dorada')
on conflict do nothing;

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

insert into public.destinations
  (id, country_id, region_id, slug, latitude, longitude, hero_image_url, hero_image_credit, is_featured, sort_order)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',
   'cambrils', 41.066700, 1.059700,
   'https://images.unsplash.com/photo-1662312559381-d6e62e709c58', 'Unsplash', true, 1),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',
   'salou', 41.076400, 1.141600,
   'https://images.unsplash.com/photo-1598306101262-4de4e1c2d4c8', 'Unsplash', true, 2),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',
   'tarragona', 41.118900, 1.244500,
   'https://images.unsplash.com/photo-1639650708447-8dc68c363563', 'Unsplash', true, 3),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',
   'miami-platja', 41.001000, 0.986000,
   'https://images.unsplash.com/photo-1723237321095-18d65a1f1673', 'Unsplash', true, 4),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',
   'hospitalet-de-l-infant', 40.993000, 0.923000,
   'https://images.unsplash.com/photo-1695591997726-ffef5a58d74b', 'Unsplash', false, 5)
on conflict do nothing;

insert into public.destination_translations
  (destination_id, locale, slug, name, description, seo_title, seo_description)
values
  -- Cambrils
  ('30000000-0000-4000-8000-000000000001', 'es', 'cambrils', 'Cambrils',
   'Villa marinera de la Costa Dorada con puerto pesquero activo, paseo marítimo y una larga tradición de cocina de mar y arroces.',
   'Dónde comer en Cambrils: restaurantes y guía gastronómica',
   'Descubre dónde comer en Cambrils: restaurantes junto al puerto, arroces, marisco y cocina mediterránea.'),
  ('30000000-0000-4000-8000-000000000001', 'ca', 'cambrils', 'Cambrils',
   'Vila marinera de la Costa Daurada amb port pesquer actiu, passeig marítim i una llarga tradició de cuina de mar i arrossos.',
   'On menjar a Cambrils: restaurants i guia gastronòmica',
   'Descobreix on menjar a Cambrils: restaurants al costat del port, arrossos, marisc i cuina mediterrània.'),
  ('30000000-0000-4000-8000-000000000001', 'en', 'cambrils', 'Cambrils',
   'A seaside town on the Costa Daurada with a working fishing harbour, a long promenade and a strong tradition of seafood and rice dishes.',
   'Where to eat in Cambrils: restaurants and food guide',
   'Find where to eat in Cambrils: harbour-side restaurants, rice dishes, seafood and Mediterranean cooking.'),
  ('30000000-0000-4000-8000-000000000001', 'fr', 'cambrils', 'Cambrils',
   'Ville côtière de la Costa Daurada avec un port de pêche actif, une longue promenade et une solide tradition de cuisine de la mer et de riz.',
   null, null),
  ('30000000-0000-4000-8000-000000000001', 'de', 'cambrils', 'Cambrils',
   'Küstenort an der Costa Daurada mit aktivem Fischereihafen, langer Promenade und einer ausgeprägten Tradition von Fisch- und Reisgerichten.',
   null, null),
  ('30000000-0000-4000-8000-000000000001', 'it', 'cambrils', 'Cambrils',
   'Località marinara della Costa Dorada con un porto peschereccio attivo, un lungo lungomare e una forte tradizione di cucina di mare e riso.',
   null, null),
  -- Salou
  ('30000000-0000-4000-8000-000000000002', 'es', 'salou', 'Salou',
   'Uno de los destinos de playa más conocidos de la Costa Dorada, con calas junto al Cap de Salou y una amplia oferta de ocio.',
   null, null),
  ('30000000-0000-4000-8000-000000000002', 'ca', 'salou', 'Salou',
   'Una de les destinacions de platja més conegudes de la Costa Daurada, amb cales al voltant del Cap de Salou i una àmplia oferta d''oci.',
   null, null),
  ('30000000-0000-4000-8000-000000000002', 'en', 'salou', 'Salou',
   'One of the best-known beach destinations on the Costa Daurada, with coves around Cap de Salou and plenty of leisure options.',
   null, null),
  ('30000000-0000-4000-8000-000000000002', 'fr', 'salou', 'Salou',
   'L''une des destinations balnéaires les plus connues de la Costa Daurada, avec des criques autour du Cap de Salou et de nombreux loisirs.',
   null, null),
  ('30000000-0000-4000-8000-000000000002', 'de', 'salou', 'Salou',
   'Einer der bekanntesten Badeorte der Costa Daurada, mit Buchten rund um das Cap de Salou und vielfältigen Freizeitangeboten.',
   null, null),
  ('30000000-0000-4000-8000-000000000002', 'it', 'salou', 'Salou',
   'Una delle mete balneari più note della Costa Dorada, con calette intorno a Cap de Salou e un''ampia offerta di svago.',
   null, null),
  -- Tarragona
  ('30000000-0000-4000-8000-000000000003', 'es', 'tarragona', 'Tarragona',
   'La antigua Tarraco romana, cuyo conjunto arqueológico es Patrimonio Mundial de la UNESCO, combina casco antiguo, mercado y playas urbanas.',
   null, null),
  ('30000000-0000-4000-8000-000000000003', 'ca', 'tarragona', 'Tarragona',
   'L''antiga Tàrraco romana, amb un conjunt arqueològic declarat Patrimoni Mundial per la UNESCO, combina nucli antic, mercat i platges urbanes.',
   null, null),
  ('30000000-0000-4000-8000-000000000003', 'en', 'tarragona', 'Tarragona',
   'The former Roman city of Tarraco, whose archaeological ensemble is a UNESCO World Heritage Site, with an old town, a central market and city beaches.',
   null, null),
  ('30000000-0000-4000-8000-000000000003', 'fr', 'tarragona', 'Tarragone',
   'L''ancienne Tarraco romaine, dont l''ensemble archéologique est inscrit au patrimoine mondial de l''UNESCO, avec sa vieille ville, son marché et ses plages.',
   null, null),
  ('30000000-0000-4000-8000-000000000003', 'de', 'tarragona', 'Tarragona',
   'Das römische Tarraco, dessen archäologisches Ensemble zum UNESCO-Welterbe gehört, mit Altstadt, Markthalle und Stadtstränden.',
   null, null),
  ('30000000-0000-4000-8000-000000000003', 'it', 'tarragona', 'Tarragona',
   'L''antica Tarraco romana, il cui complesso archeologico è Patrimonio dell''Umanità UNESCO, con centro storico, mercato e spiagge urbane.',
   null, null),
  -- Miami Platja: same public name and slug in every locale. The former Spanish
  -- slug "miami-playa" is kept as an alias (see slug_aliases below).
  ('30000000-0000-4000-8000-000000000004', 'es', 'miami-platja', 'Miami Platja',
   'Núcleo costero de Mont-roig del Camp conocido por sus calas de arena rojiza y un ambiente tranquilo.',
   null, null),
  ('30000000-0000-4000-8000-000000000004', 'ca', 'miami-platja', 'Miami Platja',
   'Nucli costaner de Mont-roig del Camp conegut per les seves cales de sorra vermellosa i un ambient tranquil.',
   null, null),
  ('30000000-0000-4000-8000-000000000004', 'en', 'miami-platja', 'Miami Platja',
   'A coastal area of Mont-roig del Camp known for its reddish-sand coves and relaxed atmosphere.',
   null, null),
  ('30000000-0000-4000-8000-000000000004', 'fr', 'miami-platja', 'Miami Platja',
   'Quartier côtier de Mont-roig del Camp connu pour ses criques de sable rougeâtre et son ambiance paisible.',
   null, null),
  ('30000000-0000-4000-8000-000000000004', 'de', 'miami-platja', 'Miami Platja',
   'Küstenort der Gemeinde Mont-roig del Camp, bekannt für seine Buchten mit rötlichem Sand und die ruhige Atmosphäre.',
   null, null),
  ('30000000-0000-4000-8000-000000000004', 'it', 'miami-platja', 'Miami Platja',
   'Zona costiera di Mont-roig del Camp nota per le sue calette di sabbia rossastra e l''atmosfera tranquilla.',
   null, null),
  -- L'Hospitalet de l'Infant
  ('30000000-0000-4000-8000-000000000005', 'es', 'hospitalet-de-l-infant', 'L''Hospitalet de l''Infant',
   'Localidad del municipio de Vandellòs i l''Hospitalet con playas amplias, puerto deportivo y el antiguo hospital medieval que le da nombre.',
   null, null),
  ('30000000-0000-4000-8000-000000000005', 'ca', 'hospitalet-de-l-infant', 'L''Hospitalet de l''Infant',
   'Població del municipi de Vandellòs i l''Hospitalet amb platges àmplies, port esportiu i l''antic hospital medieval que li dona nom.',
   null, null),
  ('30000000-0000-4000-8000-000000000005', 'en', 'hospitalet-de-l-infant', 'L''Hospitalet de l''Infant',
   'A town in the municipality of Vandellòs i l''Hospitalet with wide beaches, a marina and the medieval hospital it is named after.',
   null, null),
  ('30000000-0000-4000-8000-000000000005', 'fr', 'hospitalet-de-l-infant', 'L''Hospitalet de l''Infant',
   'Localité de la commune de Vandellòs i l''Hospitalet, avec de larges plages, un port de plaisance et l''ancien hôpital médiéval qui lui donne son nom.',
   null, null),
  ('30000000-0000-4000-8000-000000000005', 'de', 'hospitalet-de-l-infant', 'L''Hospitalet de l''Infant',
   'Ort in der Gemeinde Vandellòs i l''Hospitalet mit weiten Stränden, Jachthafen und dem mittelalterlichen Hospital, das ihm den Namen gab.',
   null, null),
  ('30000000-0000-4000-8000-000000000005', 'it', 'hospitalet-de-l-infant', 'L''Hospitalet de l''Infant',
   'Località del comune di Vandellòs i l''Hospitalet con ampie spiagge, porto turistico e l''antico ospedale medievale da cui prende il nome.',
   null, null)
on conflict do nothing;

-- Retired slugs answer with a permanent redirect (see slug_aliases).
insert into public.slug_aliases (kind, slug, target_key) values
  ('destination', 'miami-playa', '30000000-0000-4000-8000-000000000004')
on conflict do nothing;

-- -----------------------------------------------------------------------------
