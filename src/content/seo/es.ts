import type { SeoContent } from './types'

const es: SeoContent = {
  home: {
    metaTitleRegion: '{region}: dónde comer en {destinations}',
    metaDescriptionRegion:
      'Guía independiente para comer y tomar algo en {destinations} ({region}), sin posiciones pagadas.',
  },
  region: {
    metaTitle: '{region}: guía para comer y tomar algo',
    metaDescription:
      '{region}: dónde comer y tomar algo en {destinations}. Restaurantes, cafeterías, tapas y bares.',
    heading: 'Guía para comer y tomar algo',
  },
  destination: {
    metaTitle: '{destination}: dónde comer y tomar algo',
    metaDescription:
      'Dónde comer y tomar algo en {destination}: {places} con su especialidad y ubicación. {description}',
    places: { one: '{count} local seleccionado', other: '{count} locales seleccionados' },
    heading: 'Dónde comer y tomar algo',
  },
  place: {
    metaTitle: '{name} – {type} en {destination}',
    lead: '{name}: {type} en {destination}.',
    address: 'Dirección: {address}.',
    maps: 'Ubicación en Google Maps y cómo llegar.',
  },
  placeTypes: {
    restaurant: {
      metaTitle: 'Restaurantes en {destination}: dónde comer y cenar',
      description:
        'Dónde comer en {destination}: {names}. Restaurantes de la guía con su especialidad, zona y enlace a Google Maps.',
      intro:
        'Dónde comer o cenar en {destination}: restaurantes seleccionados con la especialidad de cada uno, su zona o dirección cuando está confirmada y el enlace para llegar.',
    },
    cafe: {
      metaTitle: 'Cafeterías en {destination}: dónde desayunar y tomar café',
      description:
        'Dónde desayunar o tomar café en {destination}: {names}. Cafeterías de la guía con su especialidad y ubicación.',
      intro:
        'Para desayunar, tomar un café o merendar en {destination}: cafeterías seleccionadas con lo que ofrece cada una y cómo llegar.',
    },
    brunch: {
      metaTitle: 'Brunch en {destination}: dónde hacer brunch',
      description:
        'Dónde hacer brunch en {destination}: {names}. Locales de la guía con su especialidad y ubicación.',
      intro:
        'Locales de {destination} donde hacer brunch, con la especialidad de cada uno y el enlace para llegar.',
    },
    tapas_bar: {
      metaTitle: 'Tapas en {destination}: bares de tapas',
      description:
        'Dónde tapear en {destination}: {names}. Bares de tapas de la guía con su especialidad y ubicación.',
      intro:
        'Dónde ir de tapas en {destination}: bares de tapas seleccionados con la especialidad de cada uno y cómo llegar.',
    },
    drinks: {
      metaTitle: 'Bares en {destination}: dónde tomar algo o una copa',
      description:
        'Dónde tomar algo o una copa en {destination}: {names}. Bares de la guía con su ambiente y ubicación.',
      intro:
        'Dónde tomar algo o una copa en {destination}: bares seleccionados con el ambiente o la especialidad de cada uno y cómo llegar.',
    },
  },
  defaultPlaceType: {
    metaTitle: '{type} en {destination}',
    description:
      '{type} en {destination}: {names}. Lugares de la guía con su especialidad y ubicación.',
    intro: 'Selección de la guía en {destination}, con la información de cada lugar y cómo llegar.',
  },
}

export default es
