-- Development-only fictional places and sample landings. Never load in production.
-- Reference data is installed by migrations.
-- 4. DEMO places — fictional, not real businesses. No ratings on purpose.
--    Translations exist only for es/ca/en: fr/de/it fall back to Spanish and
--    are served as noindex (see src/lib/seo/indexing.ts).
-- -----------------------------------------------------------------------------
insert into public.places
  (id, destination_id, place_type, slug, name, address_line, postal_code, latitude, longitude,
   website, price_level, average_price, featured_image_url, featured_image_credit,
   status, is_featured, is_verified, is_demo)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'restaurant',
   'demo-arroceria-del-puerto', 'Demo Arrocería del Puerto', 'Passeig Marítim (demo)', '43850', 41.066000, 1.061000,
   null, 3, 40.00, 'https://images.unsplash.com/photo-1534080564583-6be75777b70a', 'Unsplash',
   'published', true, false, true),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'restaurant',
   'demo-trattoria-mare', 'Demo Trattoria Mare', 'Carrer Major (demo)', '43850', 41.070000, 1.056000,
   null, 2, 22.00, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', 'Unsplash',
   'published', true, false, true),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'beach_club',
   'demo-xiringuito-de-la-platja', 'Demo Xiringuito de la Platja', 'Platja (demo)', '43850', 41.064000, 1.066000,
   null, 1, 15.00, 'https://images.unsplash.com/photo-1559339352-11d035aa65de', 'Unsplash',
   'published', false, false, true),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 'cafe',
   'demo-cafe-del-passeig', 'Demo Cafè del Passeig', 'Passeig (demo)', '43840', 41.074000, 1.133000,
   null, 1, 12.00, 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7', 'Unsplash',
   'published', true, false, true),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000003', 'restaurant',
   'demo-taller-gastronomic', 'Demo Taller Gastronòmic', 'Part Alta (demo)', '43003', 41.117000, 1.254000,
   null, 4, 85.00, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', 'Unsplash',
   'published', true, false, true);

insert into public.place_translations (place_id, locale, short_description, full_description) values
  ('40000000-0000-4000-8000-000000000001', 'es',
   'Ficha de demostración: arroces y cocina de mar junto al puerto.',
   'Este lugar es ficticio y sirve únicamente para comprobar el diseño y la estructura de las fichas.

Representa un restaurante mediterráneo especializado en arroces, con terraza y vistas al mar.'),
  ('40000000-0000-4000-8000-000000000001', 'ca',
   'Fitxa de demostració: arrossos i cuina de mar al costat del port.',
   'Aquest lloc és fictici i serveix només per comprovar el disseny i l''estructura de les fitxes.

Representa un restaurant mediterrani especialitzat en arrossos, amb terrassa i vistes al mar.'),
  ('40000000-0000-4000-8000-000000000001', 'en',
   'Demo listing: rice dishes and seafood by the harbour.',
   'This place is fictional and exists only to test the layout and structure of place pages.

It represents a Mediterranean restaurant specialising in rice dishes, with a terrace and sea views.'),
  ('40000000-0000-4000-8000-000000000002', 'es',
   'Ficha de demostración: cocina italiana informal para familias.',
   'Este lugar es ficticio y sirve únicamente para pruebas visuales y técnicas.

Representa una trattoria informal con terraza y opciones vegetarianas.'),
  ('40000000-0000-4000-8000-000000000002', 'ca',
   'Fitxa de demostració: cuina italiana informal per a famílies.',
   'Aquest lloc és fictici i serveix només per a proves visuals i tècniques.

Representa una trattoria informal amb terrassa i opcions vegetarianes.'),
  ('40000000-0000-4000-8000-000000000002', 'en',
   'Demo listing: casual Italian cooking for families.',
   'This place is fictional and exists only for visual and technical testing.

It represents a casual trattoria with a terrace and vegetarian options.'),
  ('40000000-0000-4000-8000-000000000003', 'es',
   'Ficha de demostración: chiringuito a pie de playa.',
   'Este lugar es ficticio y sirve únicamente para pruebas visuales y técnicas.'),
  ('40000000-0000-4000-8000-000000000003', 'ca',
   'Fitxa de demostració: xiringuito a peu de platja.',
   'Aquest lloc és fictici i serveix només per a proves visuals i tècniques.'),
  ('40000000-0000-4000-8000-000000000003', 'en',
   'Demo listing: a beachfront beach bar.',
   'This place is fictional and exists only for visual and technical testing.'),
  ('40000000-0000-4000-8000-000000000004', 'es',
   'Ficha de demostración: brunch y café en el paseo.',
   'Este lugar es ficticio y sirve únicamente para pruebas visuales y técnicas.'),
  ('40000000-0000-4000-8000-000000000004', 'ca',
   'Fitxa de demostració: brunch i cafè al passeig.',
   'Aquest lloc és fictici i serveix només per a proves visuals i tècniques.'),
  ('40000000-0000-4000-8000-000000000004', 'en',
   'Demo listing: brunch and coffee on the promenade.',
   'This place is fictional and exists only for visual and technical testing.'),
  ('40000000-0000-4000-8000-000000000005', 'es',
   'Ficha de demostración: menú degustación en la parte alta.',
   'Este lugar es ficticio y sirve únicamente para pruebas visuales y técnicas.

Representa un restaurante de alta cocina con menú degustación y reserva previa.'),
  ('40000000-0000-4000-8000-000000000005', 'ca',
   'Fitxa de demostració: menú degustació a la part alta.',
   'Aquest lloc és fictici i serveix només per a proves visuals i tècniques.

Representa un restaurant d''alta cuina amb menú degustació i reserva prèvia.'),
  ('40000000-0000-4000-8000-000000000005', 'en',
   'Demo listing: a tasting menu in the old town.',
   'This place is fictional and exists only for visual and technical testing.

It represents a fine-dining restaurant with a tasting menu and advance booking.');

insert into public.place_categories (place_id, category_id, is_primary) values
  ('40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002', true),
  ('40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', false),
  ('40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000005', false),
  ('40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000014', false),
  ('40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000012', false),
  ('40000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000003', true),
  ('40000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000013', false),
  ('40000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000015', false),
  ('40000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000009', true),
  ('40000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000006', false),
  ('40000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000014', false),
  ('40000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000011', false),
  ('40000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000008', true),
  ('40000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000011', false),
  ('40000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000015', false),
  ('40000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000010', true),
  ('40000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000001', false),
  ('40000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000012', false);

-- A place can belong to several types (primary: places.place_type).
insert into public.place_secondary_types (place_id, place_type_code) values
  ('40000000-0000-4000-8000-000000000004', 'brunch');

insert into public.place_features (place_id, feature_code) values
  ('40000000-0000-4000-8000-000000000001', 'terrace'),
  ('40000000-0000-4000-8000-000000000001', 'sea_view'),
  ('40000000-0000-4000-8000-000000000001', 'romantic'),
  ('40000000-0000-4000-8000-000000000001', 'reservations'),
  ('40000000-0000-4000-8000-000000000001', 'groups'),
  ('40000000-0000-4000-8000-000000000001', 'gluten_free'),
  ('40000000-0000-4000-8000-000000000002', 'terrace'),
  ('40000000-0000-4000-8000-000000000002', 'family_friendly'),
  ('40000000-0000-4000-8000-000000000002', 'vegetarian_options'),
  ('40000000-0000-4000-8000-000000000002', 'takeaway'),
  ('40000000-0000-4000-8000-000000000003', 'beachfront'),
  ('40000000-0000-4000-8000-000000000003', 'sea_view'),
  ('40000000-0000-4000-8000-000000000003', 'family_friendly'),
  ('40000000-0000-4000-8000-000000000003', 'vegan_options'),
  ('40000000-0000-4000-8000-000000000004', 'terrace'),
  ('40000000-0000-4000-8000-000000000004', 'sea_view'),
  ('40000000-0000-4000-8000-000000000004', 'vegan_options'),
  ('40000000-0000-4000-8000-000000000004', 'takeaway'),
  ('40000000-0000-4000-8000-000000000005', 'romantic'),
  ('40000000-0000-4000-8000-000000000005', 'reservations'),
  ('40000000-0000-4000-8000-000000000005', 'vegetarian_options'),
  ('40000000-0000-4000-8000-000000000005', 'gluten_free');

-- -----------------------------------------------------------------------------
-- 5. Landing pages (Cambrils). "best-restaurants" is translated into every
--    locale; the other two only into es/ca/en, so they do not exist elsewhere.
--    "best-restaurants" is kept UNPUBLISHED: its filter (every restaurant)
--    also matches the real imported places (supabase/imports), which have no
--    ranking signals yet, so publishing it would present an unranked selection
--    as "the best". Publish it once ranking_score is computed from real data.
-- -----------------------------------------------------------------------------
insert into public.landing_pages
  (id, destination_id, key, place_type, category_id, filters, sort, is_indexable, is_published, is_featured, sort_order, is_demo)
values
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'best-restaurants',
   'restaurant', null, '{}', 'ranking', true, false, true, 1, true),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'romantic-restaurants',
   'restaurant', '50000000-0000-4000-8000-000000000012', '{}', 'ranking', true, true, true, 2, true),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'seafront-restaurants',
   null, null, '{"features": ["sea_view"]}', 'ranking', true, true, true, 3, true);

insert into public.landing_page_translations
  (landing_page_id, destination_id, locale, slug, title, intro, body, seo_title, seo_description)
values
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'es',
   'mejores-restaurantes', 'Mejores restaurantes en Cambrils',
   'Una selección ordenada por nuestro ranking orgánico: sin posiciones pagadas.',
   'El orden de esta lista se calcula a partir de señales objetivas. Los contenidos patrocinados, cuando existan, se mostrarán siempre separados y señalizados.',
   'Mejores restaurantes en Cambrils', 'Los mejores restaurantes de Cambrils según nuestro ranking independiente.'),
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'ca',
   'millors-restaurants', 'Millors restaurants a Cambrils',
   'Una selecció ordenada pel nostre rànquing orgànic: sense posicions pagades.',
   'L''ordre d''aquesta llista es calcula a partir de senyals objectius. Els continguts patrocinats, quan n''hi hagi, es mostraran sempre separats i senyalitzats.',
   'Millors restaurants a Cambrils', 'Els millors restaurants de Cambrils segons el nostre rànquing independent.'),
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'en',
   'best-restaurants', 'Best restaurants in Cambrils',
   'A selection ordered by our organic ranking: no paid positions.',
   'The order of this list is calculated from objective signals. Sponsored content, when available, will always be shown separately and clearly labelled.',
   'Best restaurants in Cambrils', 'The best restaurants in Cambrils according to our independent ranking.'),
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'fr',
   'meilleurs-restaurants', 'Meilleurs restaurants à Cambrils',
   'Une sélection classée selon notre classement organique : aucune position payante.',
   null, null, null),
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'de',
   'beste-restaurants', 'Die besten Restaurants in Cambrils',
   'Eine Auswahl nach unserem organischen Ranking: keine bezahlten Platzierungen.',
   null, null, null),
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'it',
   'migliori-ristoranti', 'Migliori ristoranti a Cambrils',
   'Una selezione ordinata secondo il nostro ranking organico: nessuna posizione a pagamento.',
   null, null, null),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'es',
   'restaurantes-romanticos', 'Restaurantes románticos en Cambrils',
   'Lugares para una cena en pareja: ambiente tranquilo y buena mesa.', null,
   'Restaurantes románticos en Cambrils', 'Restaurantes románticos en Cambrils para una cena en pareja.'),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'ca',
   'restaurants-romantics', 'Restaurants romàntics a Cambrils',
   'Llocs per a un sopar en parella: ambient tranquil i bona taula.', null, null, null),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'en',
   'romantic-restaurants', 'Romantic restaurants in Cambrils',
   'Places for a dinner for two: a calm atmosphere and good food.', null, null, null),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'es',
   'restaurantes-frente-al-mar', 'Restaurantes frente al mar en Cambrils',
   'Comer con vistas al Mediterráneo.', null,
   'Restaurantes frente al mar en Cambrils', 'Restaurantes y chiringuitos con vistas al mar en Cambrils.'),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'ca',
   'restaurants-davant-del-mar', 'Restaurants davant del mar a Cambrils',
   'Menjar amb vistes al Mediterrani.', null, null, null),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'en',
   'seafront-restaurants', 'Seafront restaurants in Cambrils',
   'Eating with views of the Mediterranean.', null, null, null);
