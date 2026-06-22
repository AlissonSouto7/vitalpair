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
