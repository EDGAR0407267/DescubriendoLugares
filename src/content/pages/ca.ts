import type { StaticPagesContent } from './types'

const ca: StaticPagesContent = {
  about: {
    title: 'Qui som',
    description: 'Una guia independent per descobrir on menjar i què fer a cada destinació.',
    sections: [
      {
        heading: 'Què fem',
        paragraphs: [
          'Seleccionem restaurants, xiringuitos i llocs que val la pena conèixer, destinació a destinació, perquè decidir on anar sigui ràpid i fiable.',
        ],
      },
      {
        heading: 'Independència',
        paragraphs: [
          'Les posicions dels nostres rànquings no es venen. L’ordre es calcula amb criteris objectius i documentats.',
          'Si en el futur mostrem contingut patrocinat, sempre apareixerà separat del rànquing i clarament senyalitzat.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Política de privacitat',
    description: 'Com tractem les dades personals en aquest lloc web.',
    sections: [
      {
        heading: 'Dades que tractem',
        paragraphs: [
          'Aquest lloc no ofereix registre d’usuaris ni formularis, de manera que no recollim dades personals directament.',
          'El nostre proveïdor d’allotjament pot registrar dades tècniques d’accés (com l’adreça IP) per a la seguretat i el funcionament del servei.',
        ],
      },
      {
        heading: 'Els teus drets',
        paragraphs: [
          'Pots exercir els drets d’accés, rectificació, supressió, oposició, limitació i portabilitat adreçant-te al responsable indicat a l’avís legal. També pots reclamar davant l’Agència Espanyola de Protecció de Dades.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Política de galetes',
    description: 'Quines galetes utilitza aquest lloc web i per a què.',
    sections: [
      {
        heading: 'Galetes que fem servir',
        paragraphs: [
          'Només fem servir una galeta tècnica, NEXT_LOCALE, que recorda l’idioma que tries durant un any. És necessària per prestar el servei que sol·licites i no requereix consentiment.',
          'No fem servir galetes d’analítica ni de publicitat. Si en el futur les incorporem, et demanarem el consentiment abans.',
        ],
      },
    ],
  },
  legal: {
    title: 'Avís legal',
    description: 'Informació sobre el titular i les condicions d’ús d’aquest lloc web.',
    sections: [
      {
        heading: 'Condicions d’ús',
        paragraphs: [
          'La informació publicada és orientativa. Et recomanem confirmar horaris, preus i disponibilitat directament amb cada establiment.',
          'Els enllaços a llocs de tercers s’ofereixen per comoditat; no som responsables del seu contingut.',
        ],
      },
      {
        heading: 'Propietat intel·lectual',
        paragraphs: [
          'Els textos i el disseny d’aquest lloc estan protegits. Les fotografies indiquen l’autoria o la font quan correspon.',
        ],
      },
    ],
  },
  editorial: {
    title: 'Com seleccionem els llocs',
    description:
      'Criteris, fonts i política editorial de la guia: què publiquem, què no publiquem i com corregim la informació.',
    sections: [
      {
        heading: 'Què és aquesta guia',
        paragraphs: [
          'DescubriendoLugares és una guia independent. No som propietaris dels establiments que hi apareixen ni gestionem les seves reserves: els descrivim per ajudar-te a decidir on anar.',
          'Comencem per la Costa Daurada i ampliarem la guia a altres destinacions de manera progressiva.',
        ],
      },
      {
        heading: 'Com triem els llocs',
        paragraphs: [
          'Cada lloc s’incorpora després d’una revisió manual: comprovem que existeix a la població indicada, el tipus de local i l’especialitat o l’ambient, contrastant-ho amb fonts públiques com webs oficials, oficines de turisme, premsa local i directoris.',
          'Una selecció no és un rànquing. Llevat que una llista indiqui el contrari, els llocs apareixen sense ordre de preferència.',
        ],
      },
      {
        heading: 'Què publiquem i què no',
        paragraphs: [
          'Només mostrem dades contrastades: nom, tipus de local, especialitat, zona o adreça confirmada i un enllaç a Google Maps. Si una adreça no està confirmada, no la publiquem.',
          'No inventem horaris, preus, telèfons, valoracions ni ressenyes, i no copiem puntuacions d’altres plataformes. Les fotografies només es publiquen amb permís o llicència; sense, la fitxa no mostra imatge.',
        ],
      },
      {
        heading: 'Independència',
        paragraphs: [
          'Cap establiment paga per aparèixer ni per la seva posició. Si en el futur hi ha contingut patrocinat o enllaços d’afiliació, sempre estaran senyalitzats i separats de la selecció editorial.',
        ],
      },
      {
        heading: 'Actualitzacions i correccions',
        paragraphs: [
          'La informació s’actualitza quan incorporem noves fonts o rebem correccions, i cada fitxa indica la data de la darrera actualització. Els horaris i les dades poden canviar: consulta’ls a Google Maps abans d’anar-hi.',
          'Si detectes un error o ets responsable d’un establiment i vols corregir-ne la informació, escriu-nos a través de les dades de contacte de l’avís legal.',
        ],
      },
    ],
  },
  contact: {
    title: 'Contacte',
    description:
      'Com contactar amb la guia per suggerir un lloc, corregir informació o fer una consulta.',
    sections: [
      {
        heading: 'Escriu-nos',
        paragraphs: [
          'Per suggerir un lloc, corregir la informació d’un establiment o qualsevol consulta, escriu-nos per correu electrònic. Indica el nom del lloc i la població perquè ho puguem revisar.',
        ],
      },
    ],
  },
}

export default ca
