export interface FlashMission {
  code: string
  title: string
  description: string | null
  reward: number
  expiresAt: string
  accepted: boolean
}

export type WeeklyMissionIcon = 'MEAL' | 'WORKOUT' | 'USERS'
export type WeeklyMissionScope = 'SELF' | 'PAIR'

export interface WeeklyMission {
  code: string
  title: string
  subtitle: string | null
  reward: number
  target: number
  icon: WeeklyMissionIcon
  scope: WeeklyMissionScope
  current: number
  partnerName: string | null
  partnerCurrent: number | null
  completed: boolean
}
