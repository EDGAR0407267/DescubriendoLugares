import type { StaticPagesContent } from './types'

const es: StaticPagesContent = {
  about: {
    title: 'Sobre nosotros',
    description: 'Una guía independiente para descubrir dónde comer y qué hacer en cada destino.',
    sections: [
      {
        heading: 'Qué hacemos',
        paragraphs: [
          'Seleccionamos restaurantes, chiringuitos y lugares que merece la pena conocer, destino a destino, para que decidir dónde ir sea rápido y fiable.',
        ],
      },
      {
        heading: 'Independencia',
        paragraphs: [
          'Las posiciones de nuestros rankings no se venden. El orden se calcula con criterios objetivos y documentados.',
          'Si en el futuro mostramos contenido patrocinado, siempre aparecerá separado del ranking y claramente señalizado.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Política de privacidad',
    description: 'Cómo tratamos los datos personales en este sitio web.',
    sections: [
      {
        heading: 'Datos que tratamos',
        paragraphs: [
          'Este sitio no ofrece registro de usuarios ni formularios, por lo que no recogemos datos personales de forma directa.',
          'Nuestro proveedor de alojamiento puede registrar datos técnicos de acceso (como la dirección IP) con fines de seguridad y funcionamiento del servicio.',
        ],
      },
      {
        heading: 'Tus derechos',
        paragraphs: [
          'Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad dirigiéndote al responsable indicado en el aviso legal. También puedes reclamar ante la Agencia Española de Protección de Datos.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Política de cookies',
    description: 'Qué cookies utiliza este sitio web y para qué.',
    sections: [
      {
        heading: 'Cookies que usamos',
        paragraphs: [
          'Solo utilizamos una cookie técnica, NEXT_LOCALE, que recuerda el idioma que eliges durante un año. Es necesaria para prestar el servicio que solicitas y no requiere consentimiento.',
          'No utilizamos cookies de analítica ni de publicidad. Si en el futuro las incorporamos, te pediremos el consentimiento previamente.',
        ],
      },
    ],
  },
  legal: {
    title: 'Aviso legal',
    description: 'Información sobre el titular y las condiciones de uso de este sitio web.',
    sections: [
      {
        heading: 'Condiciones de uso',
        paragraphs: [
          'La información publicada tiene carácter orientativo. Recomendamos confirmar horarios, precios y disponibilidad directamente con cada establecimiento.',
          'Los enlaces a sitios de terceros se ofrecen por comodidad; no somos responsables de su contenido.',
        ],
      },
      {
        heading: 'Propiedad intelectual',
        paragraphs: [
          'Los textos y el diseño de este sitio están protegidos. Las fotografías indican su autoría o fuente cuando corresponde.',
        ],
      },
    ],
  },
  editorial: {
    title: 'Cómo seleccionamos los lugares',
    description:
      'Criterios, fuentes y política editorial de la guía: qué publicamos, qué no publicamos y cómo corregimos la información.',
    sections: [
      {
        heading: 'Qué es esta guía',
        paragraphs: [
          'DescubriendoLugares es una guía independiente. No somos propietarios de los establecimientos que aparecen ni gestionamos sus reservas: los describimos para ayudarte a decidir dónde ir.',
          'Empezamos por la Costa Dorada y ampliaremos la guía a otros destinos de forma progresiva.',
        ],
      },
      {
        heading: 'Cómo elegimos los lugares',
        paragraphs: [
          'Cada lugar se incorpora tras una revisión manual: comprobamos que existe en la localidad indicada, su tipo de local y su especialidad o ambiente, contrastándolo con fuentes públicas como webs oficiales, oficinas de turismo, prensa local y directorios.',
          'Una selección no es un ranking. Salvo que una lista indique lo contrario, los lugares aparecen sin orden de preferencia.',
        ],
      },
      {
        heading: 'Qué publicamos y qué no',
        paragraphs: [
          'Solo mostramos datos contrastados: nombre, tipo de local, especialidad, zona o dirección confirmada y un enlace a Google Maps. Si una dirección no está confirmada, no la publicamos.',
          'No inventamos horarios, precios, teléfonos, valoraciones ni reseñas, y no copiamos puntuaciones de otras plataformas. Las fotografías solo se publican con permiso o licencia; sin ella, la ficha no muestra imagen.',
        ],
      },
      {
        heading: 'Independencia',
        paragraphs: [
          'Ningún establecimiento paga por aparecer ni por su posición. Si en el futuro hay contenido patrocinado o enlaces de afiliación, estarán siempre señalizados y separados de la selección editorial.',
        ],
      },
      {
        heading: 'Actualizaciones y correcciones',
        paragraphs: [
          'La información se actualiza cuando incorporamos nuevas fuentes o recibimos correcciones, y cada ficha indica la fecha de su última actualización. Horarios y datos pueden cambiar: consúltalos en Google Maps antes de ir.',
          'Si detectas un error o eres responsable de un establecimiento y quieres corregir su información, escríbenos a través de los datos de contacto del aviso legal.',
        ],
      },
    ],
  },
  contact: {
    title: 'Contacto',
    description:
      'Cómo contactar con la guía para sugerir un lugar, corregir información o hacer una consulta.',
    sections: [
      {
        heading: 'Escríbenos',
        paragraphs: [
          'Para sugerir un lugar, corregir la información de un establecimiento o cualquier consulta, escríbenos por correo electrónico. Indica el nombre del lugar y la localidad para que podamos revisarlo.',
        ],
      },
    ],
  },
}

export default es
