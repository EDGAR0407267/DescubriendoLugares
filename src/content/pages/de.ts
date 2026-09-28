import type { StaticPagesContent } from './types'

const de: StaticPagesContent = {
  about: {
    title: 'Über uns',
    description: 'Ein unabhängiger Guide: wo essen und was unternehmen – in jedem Reiseziel.',
    sections: [
      {
        heading: 'Was wir machen',
        paragraphs: [
          'Wir wählen Restaurants, Strandbars und besondere Orte aus – Ziel für Ziel –, damit die Entscheidung schnell und verlässlich ist.',
        ],
      },
      {
        heading: 'Unabhängigkeit',
        paragraphs: [
          'Platzierungen in unseren Rankings sind nicht käuflich. Die Reihenfolge beruht auf objektiven, dokumentierten Kriterien.',
          'Sollten wir künftig gesponserte Inhalte zeigen, werden sie stets getrennt vom Ranking und deutlich gekennzeichnet.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Datenschutzerklärung',
    description: 'Wie personenbezogene Daten auf dieser Website verarbeitet werden.',
    sections: [
      {
        heading: 'Verarbeitete Daten',
        paragraphs: [
          'Diese Website bietet weder Benutzerkonten noch Formulare; wir erheben daher keine personenbezogenen Daten direkt.',
          'Unser Hosting-Anbieter kann technische Zugriffsdaten (z. B. IP-Adressen) zur Sicherheit und zum Betrieb des Dienstes protokollieren.',
        ],
      },
      {
        heading: 'Deine Rechte',
        paragraphs: [
          'Du kannst deine Rechte auf Auskunft, Berichtigung, Löschung, Widerspruch, Einschränkung und Datenübertragbarkeit gegenüber dem im Impressum genannten Verantwortlichen geltend machen oder dich an die spanische Datenschutzbehörde (AEPD) wenden.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie-Richtlinie',
    description: 'Welche Cookies diese Website verwendet und wozu.',
    sections: [
      {
        heading: 'Verwendete Cookies',
        paragraphs: [
          'Wir verwenden nur ein technisches Cookie, NEXT_LOCALE, das deine Sprachwahl ein Jahr lang speichert. Es ist unbedingt erforderlich und benötigt keine Einwilligung.',
          'Wir verwenden keine Analyse- oder Werbe-Cookies. Sollte sich das ändern, bitten wir vorher um deine Einwilligung.',
        ],
      },
    ],
  },
  legal: {
    title: 'Impressum',
    description: 'Angaben zum Betreiber und Nutzungsbedingungen dieser Website.',
    sections: [
      {
        heading: 'Nutzungsbedingungen',
        paragraphs: [
          'Die veröffentlichten Informationen dienen der Orientierung. Bitte prüfe Öffnungszeiten, Preise und Verfügbarkeit direkt beim jeweiligen Betrieb.',
          'Links zu Websites Dritter dienen der Bequemlichkeit; für deren Inhalte übernehmen wir keine Verantwortung.',
        ],
      },
      {
        heading: 'Urheberrecht',
        paragraphs: [
          'Texte und Gestaltung dieser Website sind geschützt. Fotos nennen, wo zutreffend, Urheber oder Quelle.',
        ],
      },
    ],
  },
  editorial: {
    title: 'Wie wir Orte auswählen',
    description:
      'Kriterien, Quellen und redaktionelle Richtlinien des Reiseführers: was wir veröffentlichen, was nicht und wie wir Angaben korrigieren.',
    sections: [
      {
        heading: 'Was dieser Reiseführer ist',
        paragraphs: [
          'DescubriendoLugares ist ein unabhängiger Reiseführer. Die vorgestellten Betriebe gehören uns nicht und wir nehmen keine Reservierungen für sie entgegen: Wir beschreiben sie, damit du entscheiden kannst, wohin du gehst.',
          'Wir beginnen mit der Costa Daurada und erweitern den Reiseführer schrittweise um weitere Reiseziele.',
        ],
      },
      {
        heading: 'Wie wir Orte auswählen',
        paragraphs: [
          'Jeder Ort wird nach einer manuellen Prüfung aufgenommen: Wir prüfen, ob er im angegebenen Ort existiert, welche Art von Lokal er ist und welche Spezialität oder Atmosphäre er hat, und gleichen dies mit öffentlichen Quellen wie offiziellen Websites, Tourismusbüros, Lokalpresse und Verzeichnissen ab.',
          'Eine Auswahl ist kein Ranking. Sofern eine Liste nichts anderes angibt, erscheinen die Orte ohne Reihenfolge der Präferenz.',
        ],
      },
      {
        heading: 'Was wir veröffentlichen und was nicht',
        paragraphs: [
          'Wir zeigen nur geprüfte Angaben: Name, Art des Lokals, Spezialität, bestätigte Gegend oder Adresse und einen Link zu Google Maps. Ist eine Adresse nicht bestätigt, veröffentlichen wir sie nicht.',
          'Wir erfinden keine Öffnungszeiten, Preise, Telefonnummern, Bewertungen oder Rezensionen und übernehmen keine Bewertungen anderer Plattformen. Fotos werden nur mit Erlaubnis oder Lizenz veröffentlicht; ohne sie zeigt die Seite kein Bild.',
        ],
      },
      {
        heading: 'Unabhängigkeit',
        paragraphs: [
          'Kein Betrieb bezahlt für seine Aufnahme oder seine Position. Sollten wir künftig gesponserte Inhalte oder Affiliate-Links zeigen, werden sie immer gekennzeichnet und von der redaktionellen Auswahl getrennt.',
        ],
      },
      {
        heading: 'Aktualisierungen und Korrekturen',
        paragraphs: [
          'Die Angaben werden aktualisiert, wenn wir neue Quellen aufnehmen oder Korrekturen erhalten, und jede Seite nennt das Datum ihrer letzten Aktualisierung. Öffnungszeiten und Angaben können sich ändern: Prüfe sie vor dem Besuch auf Google Maps.',
          'Wenn du einen Fehler entdeckst oder einen Betrieb führst und seine Angaben korrigieren möchtest, schreib uns über die Kontaktdaten im Impressum.',
        ],
      },
    ],
  },
  contact: {
    title: 'Kontakt',
    description:
      'So erreichst du den Reiseführer, um einen Ort vorzuschlagen, Angaben zu korrigieren oder eine Frage zu stellen.',
    sections: [
      {
        heading: 'Schreib uns',
        paragraphs: [
          'Um einen Ort vorzuschlagen, die Angaben eines Betriebs zu korrigieren oder für andere Fragen, schreib uns eine E-Mail. Nenne den Namen des Ortes und die Stadt, damit wir es prüfen können.',
        ],
      },
    ],
  },
}

export default de
