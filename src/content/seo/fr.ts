import type { SeoContent } from './types'

const fr: SeoContent = {
  home: {
    metaTitleRegion: '{region} : où manger à {destinations}',
    metaDescriptionRegion:
      'Guide indépendant pour manger et boire un verre à {destinations} ({region}), sans positions payantes.',
  },
  region: {
    metaTitle: '{region} : guide pour manger et boire un verre',
    metaDescription:
      '{region} : où manger et boire un verre à {destinations}. Restaurants, cafés, tapas et bars.',
    heading: 'Guide pour manger et boire un verre',
  },
  destination: {
    metaTitle: '{destination} : où manger et boire un verre',
    metaDescription:
      'Où manger et boire un verre à {destination} : {places} avec leur spécialité et leur emplacement. {description}',
    places: { one: '{count} adresse sélectionnée', other: '{count} adresses sélectionnées' },
    heading: 'Où manger et boire un verre',
  },
  place: {
    metaTitle: '{name} – {type} à {destination}',
    lead: '{name} : {type} à {destination}.',
    address: 'Adresse : {address}.',
    maps: 'Emplacement sur Google Maps et itinéraire.',
  },
  placeTypes: {
    restaurant: {
      metaTitle: 'Restaurants à {destination} : où manger',
      description:
        'Où manger à {destination} : {names}. Restaurants du guide avec leur spécialité, leur quartier et un lien Google Maps.',
      intro:
        'Où déjeuner ou dîner à {destination} : une sélection de restaurants avec la spécialité de chacun, le quartier ou l’adresse lorsqu’elle est confirmée et un lien pour s’y rendre.',
    },
    cafe: {
      metaTitle: 'Cafés à {destination} : où prendre le petit-déjeuner',
      description:
        'Où prendre le petit-déjeuner ou un café à {destination} : {names}. Cafés du guide avec leur spécialité et leur emplacement.',
      intro:
        'Pour le petit-déjeuner, un café ou le goûter à {destination} : une sélection de cafés avec ce que propose chacun et comment s’y rendre.',
    },
    brunch: {
      metaTitle: 'Brunch à {destination} : où bruncher',
      description:
        'Où bruncher à {destination} : {names}. Adresses du guide avec leur spécialité et leur emplacement.',
      intro:
        'Adresses de {destination} où bruncher, avec la spécialité de chacune et un lien pour s’y rendre.',
    },
    tapas_bar: {
      metaTitle: 'Tapas à {destination} : bars à tapas',
      description:
        'Où manger des tapas à {destination} : {names}. Bars à tapas du guide avec leur spécialité et leur emplacement.',
      intro:
        'Où manger des tapas à {destination} : une sélection de bars à tapas avec la spécialité de chacun et comment s’y rendre.',
    },
    drinks: {
      metaTitle: 'Bars à {destination} : où boire un verre',
      description:
        'Où boire un verre à {destination} : {names}. Bars du guide avec leur ambiance et leur emplacement.',
      intro:
        'Où boire un verre à {destination} : une sélection de bars avec l’ambiance ou la spécialité de chacun et comment s’y rendre.',
    },
  },
  defaultPlaceType: {
    metaTitle: '{type} à {destination}',
    description:
      '{type} à {destination} : {names}. Adresses du guide avec leur spécialité et leur emplacement.',
    intro:
      'La sélection du guide à {destination}, avec les informations de chaque adresse et comment s’y rendre.',
  },
}

export default fr
