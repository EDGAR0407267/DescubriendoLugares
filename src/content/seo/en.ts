import type { SeoContent } from './types'

const en: SeoContent = {
  home: {
    metaTitleRegion: '{region}: where to eat in {destinations}',
    metaDescriptionRegion:
      'An independent guide to eating and drinking in {destinations} ({region}), with no paid positions.',
  },
  region: {
    metaTitle: '{region}: a guide to eating and drinking',
    metaDescription:
      '{region}: where to eat and drink in {destinations}. Restaurants, cafés, tapas and bars.',
    heading: 'A guide to eating and drinking',
  },
  destination: {
    metaTitle: '{destination}: where to eat and drink',
    metaDescription:
      'Where to eat and drink in {destination}: {places} with their speciality and location. {description}',
    places: { one: '{count} selected place', other: '{count} selected places' },
    heading: 'Where to eat and drink',
  },
  place: {
    metaTitle: '{name} – {type} in {destination}',
    lead: '{name}: {type} in {destination}.',
    address: 'Address: {address}.',
    maps: 'Location on Google Maps and directions.',
  },
  placeTypes: {
    restaurant: {
      metaTitle: 'Restaurants in {destination}: where to eat',
      description:
        'Where to eat in {destination}: {names}. Restaurants from the guide with their speciality, area and a Google Maps link.',
      intro:
        'Where to have lunch or dinner in {destination}: selected restaurants with each one’s speciality, its area or address when confirmed, and a link with directions.',
    },
    cafe: {
      metaTitle: 'Cafés in {destination}: where to have breakfast and coffee',
      description:
        'Where to have breakfast or coffee in {destination}: {names}. Cafés from the guide with their speciality and location.',
      intro:
        'For breakfast, a coffee or an afternoon snack in {destination}: selected cafés with what each one offers and how to get there.',
    },
    brunch: {
      metaTitle: 'Brunch in {destination}: where to have brunch',
      description:
        'Where to have brunch in {destination}: {names}. Places from the guide with their speciality and location.',
      intro:
        'Places in {destination} to have brunch, with each one’s speciality and a link with directions.',
    },
    tapas_bar: {
      metaTitle: 'Tapas in {destination}: tapas bars',
      description:
        'Where to go for tapas in {destination}: {names}. Tapas bars from the guide with their speciality and location.',
      intro:
        'Where to go for tapas in {destination}: selected tapas bars with each one’s speciality and how to get there.',
    },
    drinks: {
      metaTitle: 'Bars in {destination}: where to go for a drink',
      description:
        'Where to go for a drink in {destination}: {names}. Bars from the guide with their atmosphere and location.',
      intro:
        'Where to go for a drink in {destination}: selected bars with each one’s atmosphere or speciality and how to get there.',
    },
  },
  defaultPlaceType: {
    metaTitle: '{type} in {destination}',
    description:
      '{type} in {destination}: {names}. Places from the guide with their speciality and location.',
    intro:
      'The guide’s selection in {destination}, with details of each place and how to get there.',
  },
}

export default en
