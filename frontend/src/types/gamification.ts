export type StreakType = 'NUTRITION_LOG' | 'ACTIVITY'
export type BadgeCategory = 'NUTRITION' | 'WORKOUT' | 'CONSISTENCY' | 'SOCIAL' | 'WEIGHT'

export interface Streak {
  type: StreakType
  currentCount: number
  longestCount: number
  lastActivityDate: string | null
}

export interface Competition {
  weekStart: string
  user1Score: number
  user2Score: number
  winnerId: string | null
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
