import type { SeoContent } from './types'

const it: SeoContent = {
  home: {
    metaTitleRegion: '{region}: dove mangiare a {destinations}',
    metaDescriptionRegion:
      'Guida indipendente per mangiare e bere qualcosa a {destinations} ({region}), senza posizioni a pagamento.',
  },
  region: {
    metaTitle: '{region}: guida per mangiare e bere',
    metaDescription:
      '{region}: dove mangiare e bere qualcosa a {destinations}. Ristoranti, caffè, tapas e bar.',
    heading: 'Guida per mangiare e bere',
  },
  destination: {
    metaTitle: '{destination}: dove mangiare e bere',
    metaDescription:
      'Dove mangiare e bere qualcosa a {destination}: {places} con specialità e posizione. {description}',
    places: { one: '{count} locale selezionato', other: '{count} locali selezionati' },
    heading: 'Dove mangiare e bere',
  },
  place: {
    metaTitle: '{name} – {type} a {destination}',
    lead: '{name}: {type} a {destination}.',
    address: 'Indirizzo: {address}.',
    maps: 'Posizione su Google Maps e indicazioni.',
  },
  placeTypes: {
    restaurant: {
      metaTitle: 'Ristoranti a {destination}: dove mangiare',
      description:
        'Dove mangiare a {destination}: {names}. Ristoranti della guida con specialità, zona e link a Google Maps.',
      intro:
        'Dove pranzare o cenare a {destination}: ristoranti selezionati con la specialità di ciascuno, la zona o l’indirizzo quando è confermato e il link per arrivarci.',
    },
    cafe: {
      metaTitle: 'Caffè a {destination}: dove fare colazione',
      description:
        'Dove fare colazione o bere un caffè a {destination}: {names}. Caffè della guida con specialità e posizione.',
      intro:
        'Per la colazione, un caffè o una merenda a {destination}: caffè selezionati con l’offerta di ciascuno e come arrivarci.',
    },
    brunch: {
      metaTitle: 'Brunch a {destination}: dove fare brunch',
      description:
        'Dove fare brunch a {destination}: {names}. Locali della guida con specialità e posizione.',
      intro:
        'Locali di {destination} dove fare brunch, con la specialità di ciascuno e il link per arrivarci.',
    },
    tapas_bar: {
      metaTitle: 'Tapas a {destination}: bar di tapas',
      description:
        'Dove mangiare tapas a {destination}: {names}. Bar di tapas della guida con specialità e posizione.',
      intro:
        'Dove mangiare tapas a {destination}: bar di tapas selezionati con la specialità di ciascuno e come arrivarci.',
    },
    drinks: {
      metaTitle: 'Bar a {destination}: dove bere qualcosa',
      description:
        'Dove bere qualcosa a {destination}: {names}. Bar della guida con atmosfera e posizione.',
      intro:
        'Dove bere qualcosa a {destination}: bar selezionati con l’atmosfera o la specialità di ciascuno e come arrivarci.',
    },
  },
  defaultPlaceType: {
    metaTitle: '{type} a {destination}',
    description: '{type} a {destination}: {names}. Luoghi della guida con specialità e posizione.',
    intro:
      'La selezione della guida a {destination}, con le informazioni di ogni luogo e come arrivarci.',
  },
}

export default it
