export type StreakType = 'NUTRITION_LOG' | 'ACTIVITY'
export type BadgeCategory = 'NUTRITION' | 'WORKOUT' | 'CONSISTENCY' | 'SOCIAL' | 'WEIGHT'

export interface Streak {
  type: StreakType
  currentCount: number
  longestCount: number
  lastActivityDate: string | null
  /** A sequência já conta hoje: nada em risco. */
  recordedToday: boolean
  /**
   * O último registro foi ontem e nenhum chegou hoje: a sequência zera se o dia virar assim.
   *
   * Vem do servidor, e não de uma conta no navegador, porque "hoje" é no fuso da pessoa e o
   * dispositivo pode discordar. Um aviso de urgência no dia errado é pior que nenhum.
   */
  breaksToday: boolean
}

/** Como uma semana fechada terminou, do lado de quem pediu. */
export type WeekOutcome = 'WON' | 'LOST' | 'TIED'

/**
 * Uma semana já encerrada do placar.
 *
 * Vem do servidor já dito como "teus" e "dele": a linha gravada guarda user1/user2, que são
 * posições do par e não pessoas, e cada tela que lia o placar carregava a sua própria conta
 * para descobrir qual das duas era a sua.
 */
export interface WeekRow {
  weekStart: string
  yours: number
  theirs: number
  outcome: WeekOutcome
}

export interface Competition {
  weekStart: string
  user1Score: number
  user2Score: number
  winnerId: string | null
  /** As semanas fechadas, da mais recente para a mais antiga. */
  history: WeekRow[]
}

export interface Badge {
  code: string
  name: string
  description: string
  icon: string | null
  category: BadgeCategory
}

export interface EarnedBadge {
  badge: Badge
  earnedAt: string
}

/**
 * O nível de quem usa, somado do histórico inteiro de pontos.
 *
 * Vinha de uma conta feita no navegador a partir da temporada, que caía se o histórico
 * mudasse. Agora é do servidor, e não zera quando uma temporada fecha nem quando alguém troca
 * de dupla.
 */
export interface Level {
  level: number
  /** Quanto somou na vida, do primeiro registro até agora. */
  points: number
  /** Quanto falta para subir, que é o número que faz registrar mais uma coisa hoje. */
  pointsToNext: number
  /** Quanto do nível atual já foi andado, de 0 a 100. */
  percent: number
}
