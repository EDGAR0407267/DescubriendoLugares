# Calidad del snapshot de producción

Generado con `npm run check:content -- --report`. Audita migraciones + importaciones; no carga el seed ni consulta una base remota.

Lugares reales: **60**. Fichas con algún idioma apto para indexar: **0**. Fichas candidatas en sitemap: **0**.

| Campo pendiente | Lugares |
| --- | ---: |
| image | 60 |
| image_credit | 60 |
| coordinates | 60 |
| rating | 60 |
| full_description | 60 |
| categories | 60 |
| features | 60 |
| ranking_score | 60 |
| website | 47 |
| address | 27 |
| editorial_review | 60 |

Las carencias de rating, ranking, web, categorías, features y coordenadas se informan, pero no son todas obligatorias para SEO. La ubicación puede acreditarse con dirección o coordenadas. Ver `docs/PRODUCTION.md` para los mínimos.

| Destino | Local | Pendientes | Alertas de fuente |
| --- | --- | --- | --- |
| cambrils | Acuamar Casa Matas | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| cambrils | Can Bosch | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, editorial_review |  |
| cambrils | Ehkis | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, editorial_review |  |
| cambrils | Ensucrats | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| cambrils | Il Capriccio | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| cambrils | Kema Cambrils | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, address, editorial_review | link_type_is_search, address_unverified |
| cambrils | La Vilateria | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_generic |
| cambrils | Macarrilla Restaurant | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| cambrils | Rincón de Diego | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, editorial_review |  |
| cambrils | Savash Beach | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, editorial_review |  |
| cambrils | Twisted Lime | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, editorial_review |  |
| cambrils | Vila5 | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_generic |
| hospitalet-de-l-infant | Bar Mediterrani | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| hospitalet-de-l-infant | Bar Safari | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| hospitalet-de-l-infant | Cal Rullo | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_generic |
| hospitalet-de-l-infant | El Mestral | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_names_other_business |
| hospitalet-de-l-infant | La Boulangerie | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| hospitalet-de-l-infant | Luna Music Club | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_generic |
| hospitalet-de-l-infant | Prost | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_generic |
| hospitalet-de-l-infant | Restaurant Nàutic | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| hospitalet-de-l-infant | Restaurant Pizzeria La Barca | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_generic |
| hospitalet-de-l-infant | Restaurant Vane's | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_generic |
| hospitalet-de-l-infant | Rosarito Café | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| hospitalet-de-l-infant | Xiringuito del Pep | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| miami-platja | Bar Los Arcos | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| miami-platja | Cafetería Le Français | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| miami-platja | Cal Hued | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| miami-platja | Casa Xavi | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| miami-platja | Chiringuito Tierra Caliente | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| miami-platja | Eclipse | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| miami-platja | El Niu del Petit Racó | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| miami-platja | Ginger Café | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| miami-platja | Limonero Playa Cristal | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| miami-platja | Mawui Beach | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| miami-platja | Pastisseria La Glòria | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, editorial_review |  |
| miami-platja | TRECE Brunch & Speciality Coffee | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | address_conflict |
| salou | Café Central | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| salou | Café del Far | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| salou | Deliranto | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, address, editorial_review | address_unverified |
| salou | Koko Beach Club | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | address_unverified |
| salou | La Goleta | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_generic |
| salou | La Ibense Salou - Paseo | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| salou | La Morera de Pablo y Ester | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| salou | Malapecora | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| salou | Metropolitan | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, address, editorial_review | address_unverified |
| salou | Mur Mur | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| salou | Sisters Cafe | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| salou | Tabaré Gastrobar | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| tarragona | 4 Latas Tarragona | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_generic |
| tarragona | AQ | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | address_unverified |
| tarragona | Bar Cortijo | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review | source_generic |
| tarragona | Cafè La Cantonada | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | address_unverified |
| tarragona | El Llagut | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, editorial_review |  |
| tarragona | El Pòsit del Serrallo | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, editorial_review |  |
| tarragona | El Terrat | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, editorial_review |  |
| tarragona | Highland | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, editorial_review |  |
| tarragona | Jardi Cafe | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| tarragona | Mucho Latte | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| tarragona | Petit Café Tarragona | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, website, address, editorial_review | source_generic, address_unverified |
| tarragona | Red Lab | image, image_credit, coordinates, rating, full_description, categories, features, ranking_score, editorial_review |  |
