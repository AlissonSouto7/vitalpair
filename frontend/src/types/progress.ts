export interface WeightPoint {
  date: string
  weightKg: number
}

export interface CalorieDay {
  date: string
  label: string
  kcal: number
  withinGoal: boolean
}

export type MacroKey = 'PROTEIN' | 'CARB' | 'FAT'

export interface MacroAverage {
  key: MacroKey
  label: string
  avgG: number
  targetG: number | null
}

export interface ProgressView {
  weights: WeightPoint[]
  targetKcal: number | null
  calories: CalorieDay[]
  macros: MacroAverage[]
}
