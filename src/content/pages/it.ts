import type { StaticPagesContent } from './types'

const it: StaticPagesContent = {
  about: {
    title: 'Chi siamo',
    description:
      'Una guida indipendente per scoprire dove mangiare e cosa fare in ogni destinazione.',
    sections: [
      {
        heading: 'Cosa facciamo',
        paragraphs: [
          'Selezioniamo ristoranti, chioschi in spiaggia e luoghi che vale la pena conoscere, destinazione per destinazione, per rendere la scelta rapida e affidabile.',
        ],
      },
      {
        heading: 'Indipendenza',
        paragraphs: [
          'Le posizioni nelle nostre classifiche non si vendono. L’ordine è calcolato con criteri oggettivi e documentati.',
          'Se in futuro mostreremo contenuti sponsorizzati, saranno sempre separati dalla classifica e chiaramente segnalati.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Informativa sulla privacy',
    description: 'Come vengono trattati i dati personali su questo sito.',
    sections: [
      {
        heading: 'Dati trattati',
        paragraphs: [
          'Questo sito non prevede account utente né moduli, quindi non raccogliamo direttamente dati personali.',
          'Il nostro fornitore di hosting può registrare dati tecnici di accesso (come l’indirizzo IP) per la sicurezza e il funzionamento del servizio.',
        ],
      },
      {
        heading: 'I tuoi diritti',
        paragraphs: [
          'Puoi esercitare i diritti di accesso, rettifica, cancellazione, opposizione, limitazione e portabilità rivolgendoti al titolare indicato nelle note legali, oppure presentare reclamo all’autorità spagnola per la protezione dei dati (AEPD).',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie policy',
    description: 'Quali cookie utilizza questo sito e perché.',
    sections: [
      {
        heading: 'Cookie utilizzati',
        paragraphs: [
          'Utilizziamo un solo cookie tecnico, NEXT_LOCALE, che ricorda la lingua scelta per un anno. È strettamente necessario e non richiede consenso.',
          'Non utilizziamo cookie di analisi o pubblicitari. Se in futuro li introdurremo, ti chiederemo prima il consenso.',
        ],
      },
    ],
  },
  legal: {
    title: 'Note legali',
    description: 'Informazioni sul titolare e sulle condizioni d’uso di questo sito.',
    sections: [
      {
        heading: 'Condizioni d’uso',
        paragraphs: [
          'Le informazioni pubblicate sono indicative. Ti consigliamo di verificare orari, prezzi e disponibilità direttamente con ogni locale.',
          'I link a siti di terzi sono forniti per comodità; non siamo responsabili dei loro contenuti.',
        ],
      },
      {
        heading: 'Proprietà intellettuale',
        paragraphs: [
          'I testi e il design di questo sito sono protetti. Le fotografie indicano autore o fonte quando applicabile.',
        ],
      },
    ],
  },
  editorial: {
    title: 'Come selezioniamo i luoghi',
    description:
      'Criteri, fonti e politica editoriale della guida: cosa pubblichiamo, cosa non pubblichiamo e come correggiamo le informazioni.',
    sections: [
      {
        heading: 'Che cos’è questa guida',
        paragraphs: [
          'DescubriendoLugares è una guida indipendente. Non siamo proprietari dei locali presentati e non gestiamo le loro prenotazioni: li descriviamo per aiutarti a decidere dove andare.',
          'Iniziamo dalla Costa Dorada e amplieremo la guida ad altre destinazioni in modo progressivo.',
        ],
      },
      {
        heading: 'Come scegliamo i luoghi',
        paragraphs: [
          'Ogni luogo viene aggiunto dopo una verifica manuale: controlliamo che esista nella località indicata, il tipo di locale e la sua specialità o atmosfera, confrontandoli con fonti pubbliche come siti ufficiali, uffici turistici, stampa locale e directory.',
          'Una selezione non è una classifica. Salvo diversa indicazione, i luoghi compaiono senza ordine di preferenza.',
        ],
      },
      {
        heading: 'Cosa pubblichiamo e cosa no',
        paragraphs: [
          'Mostriamo solo dati verificati: nome, tipo di locale, specialità, zona o indirizzo confermato e un link a Google Maps. Se un indirizzo non è confermato, non lo pubblichiamo.',
          'Non inventiamo orari, prezzi, telefoni, valutazioni né recensioni e non copiamo punteggi da altre piattaforme. Le foto vengono pubblicate solo con permesso o licenza; altrimenti la scheda non mostra immagini.',
        ],
      },
      {
        heading: 'Indipendenza',
        paragraphs: [
          'Nessun locale paga per comparire o per la propria posizione. Se in futuro ci saranno contenuti sponsorizzati o link di affiliazione, saranno sempre segnalati e separati dalla selezione editoriale.',
        ],
      },
      {
        heading: 'Aggiornamenti e correzioni',
        paragraphs: [
          'Le informazioni vengono aggiornate quando aggiungiamo nuove fonti o riceviamo correzioni, e ogni scheda indica la data dell’ultimo aggiornamento. Orari e dati possono cambiare: verificali su Google Maps prima di andare.',
          'Se noti un errore o gestisci un locale e vuoi correggerne le informazioni, scrivici tramite i contatti indicati nelle note legali.',
        ],
      },
    ],
  },
  contact: {
    title: 'Contatti',
    description:
      'Come contattare la guida per suggerire un luogo, correggere informazioni o fare una domanda.',
    sections: [
      {
        heading: 'Scrivici',
        paragraphs: [
          'Per suggerire un luogo, correggere le informazioni di un locale o per qualsiasi domanda, scrivici via e-mail. Indica il nome del luogo e la località così potremo verificarlo.',
        ],
      },
    ],
  },
}

export default it
