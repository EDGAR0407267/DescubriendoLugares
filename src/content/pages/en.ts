import type { StaticPagesContent } from './types'

const en: StaticPagesContent = {
  about: {
    title: 'About us',
    description: 'An independent guide to where to eat and what to do in every destination.',
    sections: [
      {
        heading: 'What we do',
        paragraphs: [
          'We select restaurants, beach bars and places worth knowing, destination by destination, so deciding where to go is quick and reliable.',
        ],
      },
      {
        heading: 'Independence',
        paragraphs: [
          'Positions in our rankings are never sold. The order is calculated with objective, documented criteria.',
          'If we show sponsored content in the future, it will always be separate from the ranking and clearly labelled.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    description: 'How personal data is handled on this website.',
    sections: [
      {
        heading: 'Data we process',
        paragraphs: [
          'This site has no user accounts or forms, so we do not collect personal data directly.',
          'Our hosting provider may log technical access data (such as IP addresses) for security and service operation.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          'You can exercise your rights of access, rectification, erasure, objection, restriction and portability by contacting the controller listed in the legal notice. You may also lodge a complaint with the Spanish Data Protection Agency (AEPD).',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie policy',
    description: 'Which cookies this website uses and why.',
    sections: [
      {
        heading: 'Cookies we use',
        paragraphs: [
          'We only use one technical cookie, NEXT_LOCALE, which remembers your chosen language for one year. It is strictly necessary for the service you request and does not require consent.',
          'We do not use analytics or advertising cookies. If we add them in the future, we will ask for your consent first.',
        ],
      },
    ],
  },
  legal: {
    title: 'Legal notice',
    description: 'Information about the publisher and the terms of use of this website.',
    sections: [
      {
        heading: 'Terms of use',
        paragraphs: [
          'Published information is for guidance only. Please confirm opening hours, prices and availability directly with each venue.',
          'Links to third-party sites are provided for convenience; we are not responsible for their content.',
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: [
          'The texts and design of this site are protected. Photographs credit their author or source where applicable.',
        ],
      },
    ],
  },
  editorial: {
    title: 'How we select places',
    description:
      'The guide’s criteria, sources and editorial policy: what we publish, what we do not and how we correct information.',
    sections: [
      {
        heading: 'What this guide is',
        paragraphs: [
          'DescubriendoLugares is an independent guide. We do not own the businesses we list and we do not handle their bookings: we describe them to help you decide where to go.',
          'We are starting with the Costa Daurada and will gradually extend the guide to other destinations.',
        ],
      },
      {
        heading: 'How we choose places',
        paragraphs: [
          'Every place is added after a manual review: we check that it exists in the stated town, its type and its speciality or atmosphere, cross-checking with public sources such as official websites, tourist offices, local press and directories.',
          'A selection is not a ranking. Unless a list says otherwise, places are shown in no order of preference.',
        ],
      },
      {
        heading: 'What we publish and what we do not',
        paragraphs: [
          'We only show verified details: name, type of place, speciality, confirmed area or address and a Google Maps link. If an address is not confirmed, we do not publish it.',
          'We never make up opening hours, prices, phone numbers, ratings or reviews, and we do not copy scores from other platforms. Photos are only published with permission or a licence; without one, the page shows no image.',
        ],
      },
      {
        heading: 'Independence',
        paragraphs: [
          'No business pays to be listed or for its position. If we ever show sponsored content or affiliate links, they will always be labelled and kept apart from the editorial selection.',
        ],
      },
      {
        heading: 'Updates and corrections',
        paragraphs: [
          'Information is updated when we add new sources or receive corrections, and every place page shows the date of its last update. Opening hours and details can change: check them on Google Maps before you go.',
          'If you spot a mistake, or you run a business and want to correct its details, write to us using the contact details in the legal notice.',
        ],
      },
    ],
  },
  contact: {
    title: 'Contact',
    description:
      'How to contact the guide to suggest a place, correct information or ask a question.',
    sections: [
      {
        heading: 'Write to us',
        paragraphs: [
          'To suggest a place, correct a business’s details or ask anything, email us. Include the name of the place and the town so we can review it.',
        ],
      },
    ],
  },
}

export default en
