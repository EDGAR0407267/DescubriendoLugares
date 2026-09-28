# Informe de importación: locales-costa-daurada

Generado por `npm run import:places` el 2026-09-24 a partir de `data/imports/locales-costa-daurada/source.xlsx`.
No editar a mano: se regenera en cada importación.

## Resumen

| Concepto | Valor |
| --- | --- |
| Fila de cabecera | 7 |
| Filas de datos leídas | 60 |
| Locales importados | 60 |
| Filas rechazadas | 0 |
| Filas ignoradas (notas/títulos tras la cabecera) | 0 |
| Con dirección publicada | 33 |
| Con enlace de Google Maps | 60 |
| Con descripción traducida a todos los idiomas | 60 |
| Pendientes de revisión | 3 |

### Por localidad

| Destino (slug) | Locales |
| --- | --- |
| salou | 12 |
| tarragona | 12 |
| cambrils | 12 |
| miami-platja | 12 |
| hospitalet-de-l-infant | 12 |

### Por categoría

| Tipo (place_types.code) | Locales |
| --- | --- |
| cafe | 14 |
| restaurant | 21 |
| tapas_bar | 10 |
| drinks | 15 |

### Enlaces de Google Maps por tipo real de URL

| Tipo | Locales |
| --- | --- |
| search | 54 |
| place_id | 2 |
| coordinates | 2 |
| place | 1 |
| short_link | 1 |

Solo `place_id`, `coordinates`, `place` y `short_link` apuntan a una ficha o punto concreto;
`search` es una búsqueda por texto y la interfaz lo indica al visitante.

## Filas rechazadas

Ninguna.

## Pendiente de revisión

| Fila | Localidad | Local | Motivo | Observaciones del Excel |
| --- | --- | --- | --- | --- |
| 37 | Cambrils | Kema Cambrils | Marcado como "enlace publicado por la fuente", pero la URL es una búsqueda de Google Maps. | Dirección no contrastada; buscar por nombre y localidad. |
| 46 | Miami Platja | TRECE Brunch & Speciality Coffee | Las observaciones indican direcciones contradictorias: la dirección NO se publica hasta revisarla. | Otra ficha indica Av. Los Ángeles, 13. Confirmar acceso exacto en Maps. |
| 58 | L'Hospitalet de l'Infant | El Mestral | La fuente es la ficha de otro negocio (el nombre del local no aparece en la URL). | Dentro del camping El Templo del Sol; confirmar condiciones de acceso. |

## Categorías secundarias (de la columna "Especialidad / ambiente")

Regla: solo palabras explícitas de la especialidad (p. ej. "brunch", "cócteles", "restaurante").
Revísalas; se pueden quitar o añadir a mano en `place_secondary_types` y la reimportación lo respeta.

| Fila | Local | Principal | Secundarias | Especialidad |
| --- | --- | --- | --- | --- |
| 9 | Café del Far | cafe | drinks | Café y bar |
| 14 | Sisters Cafe | restaurant | brunch | Cocina internacional y catalana; brunch |
| 18 | Metropolitan | drinks | restaurant | Coctelería; también restaurante |
| 19 | Mur Mur | drinks | restaurant | Restaurante y cócteles |
| 29 | Cafè La Cantonada | drinks | cafe | Café-bar y espacio cultural |
| 37 | Kema Cambrils | restaurant | drinks | Brasas y cócteles |
| 40 | Twisted Lime | tapas_bar | drinks | Tapas y cócteles |
| 41 | Vila5 | tapas_bar | drinks | Tapas creativas y mojitos |
| 42 | La Vilateria | drinks | cafe | Vermut, aperitivos y café |
| 46 | TRECE Brunch & Speciality Coffee | cafe | brunch | Brunch y café de especialidad |
| 52 | Ginger Café | tapas_bar | drinks | Tapas mediterráneas y cócteles |
| 57 | Rosarito Café | cafe | restaurant, drinks | Café-restaurante y cócteles |

## Web oficial (fuente en el dominio propio del local)

| Fila | Local | Web |
| --- | --- | --- |
| 11 | Deliranto | https://deliranto.com/ |
| 18 | Metropolitan | https://metropolitansalou.com/en/cocteleria-en-salou/ |
| 24 | El Llagut | https://www.elllagut.com/ |
| 25 | El Pòsit del Serrallo | https://www.elposit.com/es/restaurantes/el-posit-del-serrallo |
| 30 | Highland | https://highlandtarragona.es/ |
| 31 | Red Lab | https://redlabtarragona.com/ |
| 32 | Ehkis | https://www.ehkis.com/es/ |
| 36 | Can Bosch | https://canbosch.com/es/ |
| 37 | Kema Cambrils | https://kemacambrils.com/ |
| 39 | Rincón de Diego | https://www.rincondediego.com/ |
| 40 | Twisted Lime | https://www.twistedlimecambrils.com/ |
| 43 | Savash Beach | https://savashbeach.com/ |
| 45 | Pastisseria La Glòria | https://www.pastisserialagloria.com/ |

## Fuentes genéricas (informativo)

La fuente no menciona el local de forma individual (listados, buscadores, documentos).
No se muestra al visitante; conviene sustituirla por una fuente específica cuando sea posible.

| Fila | Local | Fuente |
| --- | --- | --- |
| 8 | Café Central | https://www.visitsalou.eu/es/planifica-tu-viaje/prepara-tu-viaje/on-menjar/on-menjar-search-view?tipo-cocina=mediterranea |
| 9 | Café del Far | https://www.tripadvisor.com/Restaurants-g562814-c8-Salou_Costa_Dorada_Province_of_Tarragona_Catalonia.html |
| 12 | La Goleta | https://www.visitsalou.eu/es/planifica-tu-viaje/prepara-tu-viaje/on-menjar/on-menjar-search-view?tipo-cocina=mediterranea |
| 13 | La Morera de Pablo y Ester | https://www.visitsalou.eu/es/planifica-tu-viaje/prepara-tu-viaje/on-menjar/on-menjar-search-view?tipo-cocina=mediterranea |
| 15 | Malapecora | https://www.visitsalou.eu/es/planifica-tu-viaje/prepara-tu-viaje/on-menjar/on-menjar-search-view?tipo-cocina=mediterranea |
| 16 | Tabaré Gastrobar | https://www.visitsalou.eu/es/planifica-tu-viaje/prepara-tu-viaje/on-menjar/on-menjar-search-view?tipo-cocina=mediterranea |
| 19 | Mur Mur | https://blauboat.com/wp-content/uploads/2025/05/ESP_MENU_GRUPOS_2025.pdf |
| 20 | Jardi Cafe | https://destaco.es/cafeterias/tarragona/mejor-valorados |
| 21 | Mucho Latte | https://destaco.es/cafeterias/tarragona/mejor-valorados |
| 22 | Petit Café Tarragona | https://destaco.es/cafeterias/tarragona/mejor-valorados |
| 27 | 4 Latas Tarragona | https://www.diaridetarragona.com/gastronomia/263155/son-mejores-bares-tarragona-celebrar-dia-tapa.html |
| 28 | Bar Cortijo | https://www.diaridetarragona.com/gastronomia/263155/son-mejores-bares-tarragona-celebrar-dia-tapa.html |
| 33 | Ensucrats | https://www.tripadvisor.es/Restaurants-g580328-c8-Cambrils_Baix_Camp_Costa_Dorada_Province_of_Tarragona_Catalonia.html |
| 34 | Il Capriccio | https://www.tripadvisor.es/Restaurants-g580328-c8-Cambrils_Baix_Camp_Costa_Dorada_Province_of_Tarragona_Catalonia.html |
| 35 | Acuamar Casa Matas | https://www.tripadvisor.co/Restaurants-g580328-c28-Cambrils_Baix_Camp_Costa_Dorada_Province_of_Tarragona_Catalonia.html |
| 38 | Macarrilla Restaurant | https://www.tripadvisor.co/Restaurants-g580328-c28-Cambrils_Baix_Camp_Costa_Dorada_Province_of_Tarragona_Catalonia.html |
| 41 | Vila5 | https://cambrils-turisme.com/es/ruta-gastronomica-por-cambrils-un-casco-antiguo-exquisito/ |
| 42 | La Vilateria | https://cambrils-turisme.com/es/ruta-gastronomica-por-cambrils-un-casco-antiguo-exquisito/ |
| 47 | Cal Hued | https://www.tripadvisor.es/Restaurants-g672802-zfp58-Miami_Platja_Costa_Dorada_Province_of_Tarragona_Catalonia.html |
| 49 | El Niu del Petit Racó | https://www.toppingsandsalads.es/localidad/catalunya/tarragona/miami-platja-tarragona/ |
| 51 | Casa Xavi | https://www.tripadvisor.es/Restaurants-g672802-zfp6-Miami_Platja_Costa_Dorada_Province_of_Tarragona_Catalonia.html |
| 53 | Bar Los Arcos | https://www.tripadvisor.es/Restaurants-g672802-zfp6-Miami_Platja_Costa_Dorada_Province_of_Tarragona_Catalonia.html |
| 54 | Chiringuito Tierra Caliente | https://www.tripadvisor.es/Restaurants-g672802-zfp6-Miami_Platja_Costa_Dorada_Province_of_Tarragona_Catalonia.html |
| 55 | Mawui Beach | https://www.toppingsandsalads.es/localidad/catalunya/tarragona/miami-platja-tarragona/ |
| 60 | Restaurant Pizzeria La Barca | https://www.clubnautichospitaletvandellos.com/gastronomia/ |
| 61 | Restaurant Vane's | https://www.clubnautichospitaletvandellos.com/gastronomia/ |
| 64 | Cal Rullo | https://www.arhospitalet.cat/lang-es/pag/locations/ |
| 65 | Luna Music Club | https://www.clubnautichospitaletvandellos.com/gastronomia/ |
| 66 | Prost | https://www.clubnautichospitaletvandellos.com/gastronomia/ |
| 67 | Xiringuito del Pep | https://www.tripadvisor.es/Restaurants-g1009855-L_Hospitalet_de_l_Infant_Baix_Camp_Costa_Dorada_Province_of_Tarragona_Catalonia.html |

## Especialidades sin traducción completa

Todas las especialidades tienen traducción a los seis idiomas.
