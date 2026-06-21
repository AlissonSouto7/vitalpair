export interface DayProgress {
  calorieTarget: number | null
  consumedCalories: number
  burnedCalories: number
  netCalories: number
  remainingCalories: number | null
  consumedProteinG: number
  consumedCarbG: number
  consumedFatG: number
  proteinTargetG: number | null
  carbTargetG: number | null
  fatTargetG: number | null
  steps: number
  mealCount: number
}

export interface PartnerSummary {
  userId: string
  name: string
  avatarUrl: string | null
  calorieTarget: number | null
  consumedCalories: number
  burnedCalories: number
  netCalories: number
}

export interface Dashboard {
  date: string
  me: DayProgress
  partner: PartnerSummary | null
}
