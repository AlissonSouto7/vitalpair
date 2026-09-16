export const gamification = {
  pt: {
    title: 'Conquistas',
    subtitle: 'As medalhas que você foi acendendo. Cada uma é um troféu de teimosia.',
    loadError: 'Não rolou carregar agora. Tenta de novo daqui a pouco.',
    // streaks
    streaks: 'Suas sequências',
    streaksEmpty: 'Sua chama tá apagada. Registra uma refeição ou um treino que ela acende.',
    dayOne: '{{n}} dia',
    dayOther: '{{n}} dias',
    record_one: 'recorde: {{count}} dia',
    record_other: 'recorde: {{count}} dias',
    // badges
    badges: 'Medalhas',
    badgeCount: '{{earned}} de {{total}}',
    badgesEmpty: 'Nenhuma medalha por aqui ainda. Começa a registrar e elas vão acendendo.',
    streakLabel: { NUTRITION_LOG: 'Alimentação', ACTIVITY: 'Atividade' },
    /* Nomes das cinco famílias de medalha. A categoria já vinha no dado e era usada só
       pra escolher o ícone; agora agrupa a grade, que antes era o catálogo inteiro numa
       parede única onde ninguém achava nada. */
    category: {
      NUTRITION: 'Comida',
      WORKOUT: 'Treino',
      CONSISTENCY: 'Constância',
      SOCIAL: 'Dupla',
      WEIGHT: 'Peso',
    },
    /* Nome e descrição de cada medalha, pela chave estável que o servidor manda no `code`.
       O catálogo do backend vem com o texto fixo em pt-BR gravado no banco, então uma tela
       em inglês exibia "Primeira refeição" no meio dela. Traduzir pelo código resolve no
       cliente, sem migração e sem quebrar quem já tem a medalha. Medalha nova que o servidor
       criar e que ainda não estiver aqui cai no texto que ele mandou. */
    badge: {
      FIRST_MEAL: { name: 'Primeira refeição', description: 'Registrou a primeira refeição' },
      FIRST_ACTIVITY: {
        name: 'Primeira atividade',
        description: 'Registrou a primeira atividade física',
      },
      STREAK_7_NUTRITION: {
        name: '7 dias nutrindo',
        description: '7 dias seguidos registrando refeições',
      },
      STREAK_7_ACTIVITY: {
        name: '7 dias ativo',
        description: '7 dias seguidos de atividade física',
      },
      PAIR_FORMED: { name: 'Dupla formada', description: 'Formou um par no VitalPair' },
    },
  },
  en: {
    title: 'Achievements',
    subtitle: 'The medals you’ve been lighting up. Each one’s a trophy for not quitting.',
    loadError: 'Couldn’t load right now. Give it another shot in a bit.',
    streaks: 'Your streaks',
    streaksEmpty: 'Your flame’s out. Log a meal or a workout and it sparks back up.',
    dayOne: '{{n}} day',
    dayOther: '{{n}} days',
    record_one: 'record: {{count}} day',
    record_other: 'record: {{count}} days',
    badges: 'Medals',
    badgeCount: '{{earned}} of {{total}}',
    badgesEmpty: 'No medals around here yet. Start logging and they’ll light up.',
    streakLabel: { NUTRITION_LOG: 'Nutrition', ACTIVITY: 'Activity' },
    category: {
      NUTRITION: 'Food',
      WORKOUT: 'Workout',
      CONSISTENCY: 'Consistency',
      SOCIAL: 'Pair',
      WEIGHT: 'Weight',
    },
    badge: {
      FIRST_MEAL: { name: 'First meal', description: 'Logged your first meal' },
      FIRST_ACTIVITY: { name: 'First workout', description: 'Logged your first workout' },
      STREAK_7_NUTRITION: {
        name: '7 days fed',
        description: '7 days in a row logging meals',
      },
      STREAK_7_ACTIVITY: {
        name: '7 days active',
        description: '7 days in a row of exercise',
      },
      PAIR_FORMED: { name: 'Pair formed', description: 'Teamed up with someone on VitalPair' },
    },
  },
  es: {
    title: 'Logros',
    subtitle: 'Las medallas que has ido encendiendo. Cada una es un trofeo a la terquedad.',
    loadError: 'No se pudo cargar ahora. Inténtalo de nuevo en un rato.',
    streaks: 'Tus rachas',
    streaksEmpty: 'Tu llama está apagada. Registra una comida o un entreno y se enciende.',
    dayOne: '{{n}} día',
    dayOther: '{{n}} días',
    record_one: 'récord: {{count}} día',
    record_other: 'récord: {{count}} días',
    badges: 'Medallas',
    badgeCount: '{{earned}} de {{total}}',
    badgesEmpty: 'Aún no hay medallas por aquí. Empieza a registrar y se irán encendiendo.',
    streakLabel: { NUTRITION_LOG: 'Alimentación', ACTIVITY: 'Actividad' },
    category: {
      NUTRITION: 'Comida',
      WORKOUT: 'Entrenamiento',
      CONSISTENCY: 'Constancia',
      SOCIAL: 'Pareja',
      WEIGHT: 'Peso',
    },
    badge: {
      FIRST_MEAL: { name: 'Primera comida', description: 'Registró su primera comida' },
      FIRST_ACTIVITY: { name: 'Primera actividad', description: 'Registró su primera actividad' },
      STREAK_7_NUTRITION: {
        name: '7 días comiendo bien',
        description: '7 días seguidos registrando comidas',
      },
      STREAK_7_ACTIVITY: {
        name: '7 días activo',
        description: '7 días seguidos de actividad física',
      },
      PAIR_FORMED: { name: 'Pareja formada', description: 'Formó una pareja en VitalPair' },
    },
  },
  fr: {
    title: 'Succès',
    subtitle: 'Les médailles que tu as allumées. Chacune est un trophée d’entêtement.',
    loadError: 'Impossible de charger pour l’instant. Réessaie dans un moment.',
    streaks: 'Tes séries',
    streaksEmpty: 'Ta flamme est éteinte. Enregistre un repas ou une séance et elle se rallume.',
    dayOne: '{{n}} jour',
    dayOther: '{{n}} jours',
    record_one: 'record : {{count}} jour',
    record_other: 'record : {{count}} jours',
    badges: 'Médailles',
    badgeCount: '{{earned}} sur {{total}}',
    badgesEmpty: 'Pas encore de médaille par ici. Commence à enregistrer et elles s’allumeront.',
    streakLabel: { NUTRITION_LOG: 'Nutrition', ACTIVITY: 'Activité' },
    category: {
      NUTRITION: 'Repas',
      WORKOUT: 'Séance',
      CONSISTENCY: 'Régularité',
      SOCIAL: 'Duo',
      WEIGHT: 'Poids',
    },
    badge: {
      FIRST_MEAL: { name: 'Premier repas', description: 'A enregistré son premier repas' },
      FIRST_ACTIVITY: {
        name: 'Première activité',
        description: 'A enregistré sa première activité',
      },
      STREAK_7_NUTRITION: {
        name: '7 jours de repas',
        description: '7 jours d’affilée à enregistrer ses repas',
      },
      STREAK_7_ACTIVITY: {
        name: '7 jours actif',
        description: '7 jours d’affilée d’activité physique',
      },
      PAIR_FORMED: { name: 'Duo formé', description: 'A formé un duo sur VitalPair' },
    },
  },
} as const
