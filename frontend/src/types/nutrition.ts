export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
export type FoodSource = 'OPEN_FOOD_FACTS' | 'MANUAL'

export interface FoodProduct {
  name: string
  barcode: string | null
  caloriesPer100g: number | null
  proteinPer100g: number | null
  carbPer100g: number | null
  fatPer100g: number | null
}

export interface FoodLog {
  id: string
  foodName: string
  barcode: string | null
  quantityG: number
  caloriesKcal: number
  proteinG: number
  carbG: number
  fatG: number
  mealType: MealType
  source: FoodSource
  loggedAt: string
}

export interface LogMealPayload {
  foodName: string
  barcode?: string | null
  quantityG: number
  caloriesKcal: number
  proteinG: number
  carbG: number
  fatG: number
  mealType: MealType
  source: FoodSource
  isPrivate: boolean
}

export interface FavoriteFood {
  foodName: string
  quantityG: number
  caloriesKcal: number
  proteinG: number
  carbG: number
  fatG: number
  count: number
}

export interface DetectedFood {
  foodName: string
  quantityG: number
  caloriesKcal: number
  proteinG: number
  carbG: number
  fatG: number
}

export interface PhotoAnalysis {
  items: DetectedFood[]
}

export interface DailySummary {
  date: string
  consumedCalories: number
  consumedProteinG: number
  consumedCarbG: number
  consumedFatG: number
  targetCalories: number | null
  targetProteinG: number | null
  targetCarbG: number | null
  targetFatG: number | null
  remainingCalories: number | null
  mealCount: number
}
