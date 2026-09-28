import type { SeoContent } from './types'

const de: SeoContent = {
  home: {
    metaTitleRegion: '{region}: Essen gehen in {destinations}',
    metaDescriptionRegion:
      'Unabhängiger Reiseführer zum Essen und Trinken in {destinations} ({region}), ohne bezahlte Platzierungen.',
  },
  region: {
    metaTitle: '{region}: Reiseführer zum Essen und Trinken',
    metaDescription:
      '{region}: Essen und Trinken in {destinations}. Restaurants, Cafés, Tapas und Bars.',
    heading: 'Reiseführer zum Essen und Trinken',
  },
  destination: {
    metaTitle: '{destination}: Essen und Trinken',
    metaDescription:
      'Essen und Trinken in {destination}: {places} mit Spezialität und Lage. {description}',
    places: { one: '{count} ausgewähltes Lokal', other: '{count} ausgewählte Lokale' },
    heading: 'Essen und Trinken',
  },
  place: {
    metaTitle: '{name} – {type} in {destination}',
    lead: '{name}: {type} in {destination}.',
    address: 'Adresse: {address}.',
    maps: 'Lage auf Google Maps und Anfahrt.',
  },
  placeTypes: {
    restaurant: {
      metaTitle: 'Restaurants in {destination}: Wo man gut isst',
      description:
        'Essen gehen in {destination}: {names}. Restaurants aus dem Reiseführer mit Spezialität, Lage und Google-Maps-Link.',
      intro:
        'Mittag- oder Abendessen in {destination}: ausgewählte Restaurants mit ihrer Spezialität, der Gegend oder Adresse, wenn sie bestätigt ist, und einem Link zur Anfahrt.',
    },
    cafe: {
      metaTitle: 'Cafés in {destination}: Frühstück und Kaffee',
      description:
        'Frühstücken oder Kaffee trinken in {destination}: {names}. Cafés aus dem Reiseführer mit Spezialität und Lage.',
      intro:
        'Zum Frühstück, auf einen Kaffee oder am Nachmittag in {destination}: ausgewählte Cafés mit ihrem Angebot und der Anfahrt.',
    },
    brunch: {
      metaTitle: 'Brunch in {destination}: Wo man brunchen kann',
      description:
        'Brunchen in {destination}: {names}. Lokale aus dem Reiseführer mit Spezialität und Lage.',
      intro:
        'Lokale in {destination} zum Brunchen, jeweils mit Spezialität und einem Link zur Anfahrt.',
    },
    tapas_bar: {
      metaTitle: 'Tapas in {destination}: Tapas-Bars',
      description:
        'Tapas essen in {destination}: {names}. Tapas-Bars aus dem Reiseführer mit Spezialität und Lage.',
      intro:
        'Tapas essen in {destination}: ausgewählte Tapas-Bars mit ihrer Spezialität und der Anfahrt.',
    },
    drinks: {
      metaTitle: 'Bars in {destination}: Wo man etwas trinken kann',
      description:
        'Auf einen Drink in {destination}: {names}. Bars aus dem Reiseführer mit Atmosphäre und Lage.',
      intro:
        'Auf einen Drink in {destination}: ausgewählte Bars mit ihrer Atmosphäre oder Spezialität und der Anfahrt.',
    },
  },
  defaultPlaceType: {
    metaTitle: '{type} in {destination}',
    description:
      '{type} in {destination}: {names}. Orte aus dem Reiseführer mit Spezialität und Lage.',
    intro:
      'Die Auswahl des Reiseführers in {destination}, mit Informationen zu jedem Ort und der Anfahrt.',
  },
}

export default de
