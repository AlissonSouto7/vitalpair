export type Sex = 'MALE' | 'FEMALE' | 'OTHER'
export type Goal = 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'MAINTAIN' | 'IMPROVE_FITNESS'
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE'

export interface UserProfile {
  id: string
  email: string
  emailVerified: boolean
  name: string
  birthDate: string | null
  sex: Sex | null
  heightCm: number | null
  weightKg: number | null
  goal: Goal | null
  activityLevel: ActivityLevel | null
  dailyCalorieTarget: number | null
  proteinTargetG: number | null
  carbTargetG: number | null
  fatTargetG: number | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateProfilePayload {
  name: string
  birthDate: string
  sex: Sex
  heightCm: number
  weightKg: number
  goal: Goal
  activityLevel: ActivityLevel
  avatarUrl?: string | null
}

export interface Tdee {
  bmr: number
  tdee: number
  dailyCalorieTarget: number
  proteinTargetG: number
  carbTargetG: number
  fatTargetG: number
}
