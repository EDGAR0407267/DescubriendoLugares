import type { StaticPagesContent } from './types'

const fr: StaticPagesContent = {
  about: {
    title: 'À propos',
    description: 'Un guide indépendant pour savoir où manger et que faire dans chaque destination.',
    sections: [
      {
        heading: 'Ce que nous faisons',
        paragraphs: [
          'Nous sélectionnons des restaurants, paillotes et lieux qui valent le détour, destination par destination, pour que choisir soit simple et fiable.',
        ],
      },
      {
        heading: 'Indépendance',
        paragraphs: [
          'Les positions de nos classements ne sont jamais vendues. L’ordre est calculé selon des critères objectifs et documentés.',
          'Si nous affichons un jour du contenu sponsorisé, il sera toujours séparé du classement et clairement signalé.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Politique de confidentialité',
    description: 'Comment les données personnelles sont traitées sur ce site.',
    sections: [
      {
        heading: 'Données traitées',
        paragraphs: [
          'Ce site ne propose ni compte utilisateur ni formulaire : nous ne collectons pas directement de données personnelles.',
          'Notre hébergeur peut enregistrer des données techniques d’accès (comme l’adresse IP) à des fins de sécurité et de fonctionnement.',
        ],
      },
      {
        heading: 'Vos droits',
        paragraphs: [
          'Vous pouvez exercer vos droits d’accès, de rectification, d’effacement, d’opposition, de limitation et de portabilité auprès du responsable indiqué dans les mentions légales, ou saisir l’autorité espagnole de protection des données (AEPD).',
        ],
      },
    ],
  },
  cookies: {
    title: 'Politique de cookies',
    description: 'Quels cookies ce site utilise et pourquoi.',
    sections: [
      {
        heading: 'Cookies utilisés',
        paragraphs: [
          'Nous n’utilisons qu’un cookie technique, NEXT_LOCALE, qui mémorise la langue choisie pendant un an. Il est strictement nécessaire et ne requiert pas de consentement.',
          'Nous n’utilisons aucun cookie d’analyse ou de publicité. Si cela change, nous vous demanderons votre consentement au préalable.',
        ],
      },
    ],
  },
  legal: {
    title: 'Mentions légales',
    description: 'Informations sur l’éditeur et les conditions d’utilisation de ce site.',
    sections: [
      {
        heading: 'Conditions d’utilisation',
        paragraphs: [
          'Les informations publiées sont données à titre indicatif. Vérifiez horaires, prix et disponibilité directement auprès de chaque établissement.',
          'Les liens vers des sites tiers sont fournis pour votre commodité ; nous ne sommes pas responsables de leur contenu.',
        ],
      },
      {
        heading: 'Propriété intellectuelle',
        paragraphs: [
          'Les textes et le design de ce site sont protégés. Les photographies mentionnent leur auteur ou leur source le cas échéant.',
        ],
      },
    ],
  },
  editorial: {
    title: 'Comment nous sélectionnons les adresses',
    description:
      'Critères, sources et politique éditoriale du guide : ce que nous publions, ce que nous ne publions pas et comment nous corrigeons les informations.',
    sections: [
      {
        heading: 'Ce qu’est ce guide',
        paragraphs: [
          'DescubriendoLugares est un guide indépendant. Nous ne sommes pas propriétaires des établissements présentés et ne gérons pas leurs réservations : nous les décrivons pour vous aider à choisir où aller.',
          'Nous commençons par la Costa Daurada et étendrons progressivement le guide à d’autres destinations.',
        ],
      },
      {
        heading: 'Comment nous choisissons les adresses',
        paragraphs: [
          'Chaque adresse est ajoutée après une vérification manuelle : nous vérifions qu’elle existe dans la localité indiquée, son type et sa spécialité ou son ambiance, en les recoupant avec des sources publiques comme les sites officiels, les offices de tourisme, la presse locale et des annuaires.',
          'Une sélection n’est pas un classement. Sauf mention contraire, les adresses apparaissent sans ordre de préférence.',
        ],
      },
      {
        heading: 'Ce que nous publions et ce que nous ne publions pas',
        paragraphs: [
          'Nous n’affichons que des données vérifiées : nom, type d’établissement, spécialité, quartier ou adresse confirmée et un lien Google Maps. Si une adresse n’est pas confirmée, nous ne la publions pas.',
          'Nous n’inventons ni horaires, ni prix, ni téléphones, ni notes, ni avis, et nous ne copions pas les notes d’autres plateformes. Les photos ne sont publiées qu’avec autorisation ou licence ; sans cela, la fiche n’affiche pas d’image.',
        ],
      },
      {
        heading: 'Indépendance',
        paragraphs: [
          'Aucun établissement ne paie pour apparaître ni pour sa position. Si nous proposons un jour du contenu sponsorisé ou des liens d’affiliation, ils seront toujours signalés et séparés de la sélection éditoriale.',
        ],
      },
      {
        heading: 'Mises à jour et corrections',
        paragraphs: [
          'Les informations sont mises à jour lorsque nous ajoutons de nouvelles sources ou recevons des corrections, et chaque fiche indique la date de sa dernière mise à jour. Les horaires et les données peuvent changer : vérifiez-les sur Google Maps avant de vous déplacer.',
          'Si vous repérez une erreur ou si vous êtes responsable d’un établissement et souhaitez corriger ses informations, écrivez-nous via les coordonnées indiquées dans les mentions légales.',
        ],
      },
    ],
  },
  contact: {
    title: 'Contact',
    description:
      'Comment contacter le guide pour suggérer une adresse, corriger une information ou poser une question.',
    sections: [
      {
        heading: 'Écrivez-nous',
        paragraphs: [
          'Pour suggérer une adresse, corriger les informations d’un établissement ou pour toute question, écrivez-nous par e-mail. Indiquez le nom du lieu et la localité afin que nous puissions vérifier.',
        ],
      },
    ],
  },
}

export default fr
