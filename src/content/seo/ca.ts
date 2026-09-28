import type { SeoContent } from './types'

const ca: SeoContent = {
  home: {
    metaTitleRegion: '{region}: on menjar a {destinations}',
    metaDescriptionRegion:
      'Guia independent per menjar i prendre alguna cosa a {destinations} ({region}), sense posicions pagades.',
  },
  region: {
    metaTitle: '{region}: guia per menjar i prendre alguna cosa',
    metaDescription:
      '{region}: on menjar i prendre alguna cosa a {destinations}. Restaurants, cafeteries, tapes i bars.',
    heading: 'Guia per menjar i prendre alguna cosa',
  },
  destination: {
    metaTitle: '{destination}: on menjar i prendre alguna cosa',
    metaDescription:
      'On menjar i prendre alguna cosa a {destination}: {places} amb la seva especialitat i ubicació. {description}',
    places: { one: '{count} local seleccionat', other: '{count} locals seleccionats' },
    heading: 'On menjar i prendre alguna cosa',
  },
  place: {
    metaTitle: '{name} – {type} a {destination}',
    lead: '{name}: {type} a {destination}.',
    address: 'Adreça: {address}.',
    maps: 'Ubicació a Google Maps i com arribar-hi.',
  },
  placeTypes: {
    restaurant: {
      metaTitle: 'Restaurants a {destination}: on menjar i sopar',
      description:
        'On menjar a {destination}: {names}. Restaurants de la guia amb la seva especialitat, zona i enllaç a Google Maps.',
      intro:
        'On dinar o sopar a {destination}: restaurants seleccionats amb l’especialitat de cadascun, la zona o l’adreça quan està confirmada i l’enllaç per arribar-hi.',
    },
    cafe: {
      metaTitle: 'Cafeteries a {destination}: on esmorzar i prendre cafè',
      description:
        'On esmorzar o prendre un cafè a {destination}: {names}. Cafeteries de la guia amb la seva especialitat i ubicació.',
      intro:
        'Per esmorzar, prendre un cafè o berenar a {destination}: cafeteries seleccionades amb el que ofereix cadascuna i com arribar-hi.',
    },
    brunch: {
      metaTitle: 'Brunch a {destination}: on fer brunch',
      description:
        'On fer brunch a {destination}: {names}. Locals de la guia amb la seva especialitat i ubicació.',
      intro:
        'Locals de {destination} on fer brunch, amb l’especialitat de cadascun i l’enllaç per arribar-hi.',
    },
    tapas_bar: {
      metaTitle: 'Tapes a {destination}: bars de tapes',
      description:
        'On fer tapes a {destination}: {names}. Bars de tapes de la guia amb la seva especialitat i ubicació.',
      intro:
        'On anar de tapes a {destination}: bars de tapes seleccionats amb l’especialitat de cadascun i com arribar-hi.',
    },
    drinks: {
      metaTitle: 'Bars a {destination}: on prendre alguna cosa o una copa',
      description:
        'On prendre alguna cosa o una copa a {destination}: {names}. Bars de la guia amb el seu ambient i ubicació.',
      intro:
        'On prendre alguna cosa o una copa a {destination}: bars seleccionats amb l’ambient o l’especialitat de cadascun i com arribar-hi.',
    },
  },
  defaultPlaceType: {
    metaTitle: '{type} a {destination}',
    description:
      '{type} a {destination}: {names}. Llocs de la guia amb la seva especialitat i ubicació.',
    intro: 'Selecció de la guia a {destination}, amb la informació de cada lloc i com arribar-hi.',
  },
}

export default ca
