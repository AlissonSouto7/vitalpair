/**
 * Strings for the pages shown when something is missing or broken.
 *
 * The tone is deliberately plain here. A person landing on a 404 or on a crash screen is
 * already frustrated, so the copy says what happened and offers the way out, without the
 * playful voice the rest of the product uses.
 */
export const errors = {
  pt: {
    notFound: {
      title: 'Essa página não existe',
      description: 'O link pode estar errado ou a página pode ter saído do ar.',
      backHome: 'Voltar pro início',
    },
    errorBoundary: {
      title: 'Algo quebrou por aqui',
      description: 'Não foi você. Tenta de novo e, se continuar, manda esse código pra gente.',
      requestId: 'Código do erro',
      retry: 'Tentar de novo',
    },
    toast: {
      serverError: 'Deu ruim do nosso lado',
      offline: 'Sem conexão com o servidor',
      requestId: 'Código: {{id}}',
    },
  },
  en: {
    notFound: {
      title: 'This page does not exist',
      description: 'The link may be wrong, or the page may have been taken down.',
      backHome: 'Back to start',
    },
    errorBoundary: {
      title: 'Something broke here',
      description: 'It was not you. Try again, and if it keeps happening, send us this code.',
      requestId: 'Error code',
      retry: 'Try again',
    },
    toast: {
      serverError: 'Something went wrong on our side',
      offline: 'No connection to the server',
      requestId: 'Code: {{id}}',
    },
  },
  es: {
    notFound: {
      title: 'Esta página no existe',
      description: 'El enlace puede estar mal o la página puede haber sido retirada.',
      backHome: 'Volver al inicio',
    },
    errorBoundary: {
      title: 'Algo se rompió aquí',
      description: 'No fuiste tú. Inténtalo de nuevo y, si sigue pasando, envíanos este código.',
      requestId: 'Código del error',
      retry: 'Intentar de nuevo',
    },
    toast: {
      serverError: 'Algo falló de nuestro lado',
      offline: 'Sin conexión con el servidor',
      requestId: 'Código: {{id}}',
    },
  },
  fr: {
    notFound: {
      title: "Cette page n'existe pas",
      description: 'Le lien est peut-être incorrect ou la page a été retirée.',
      backHome: "Retour à l'accueil",
    },
    errorBoundary: {
      title: "Quelque chose s'est cassé ici",
      description: "Ce n'est pas vous. Réessayez et, si cela persiste, envoyez-nous ce code.",
      requestId: "Code de l'erreur",
      retry: 'Réessayer',
    },
    toast: {
      serverError: 'Quelque chose a cassé chez nous',
      offline: 'Pas de connexion au serveur',
      requestId: 'Code : {{id}}',
    },
  },
}
