export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
export type FoodSource = 'OPEN_FOOD_FACTS' | 'MANUAL'

/**
 * The family of a food, which decides the icon and the word shown under its name.
 *
 * Mirrors the backend enum. `OTHER` is every branded product from Open Food Facts, whose own
 * categories do not map onto these.
 */
export type FoodCategory =
  | 'STAPLE'
  | 'PROTEIN'
  | 'BREAD'
  | 'DAIRY'
  | 'FRUIT'
  | 'VEGETABLE'
  | 'TREAT'
  | 'DISH'
  | 'SUPPLEMENT'
  | 'OTHER'

export interface FoodProduct {
  name: string
  barcode: string | null
  caloriesPer100g: number | null
  proteinPer100g: number | null
  carbPer100g: number | null
  fatPer100g: number | null
  category: FoodCategory
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
  /**
   * When the meal was eaten. Omitted means now, which is the common case.
   *
   * Sent whenever somebody picks a day other than today: the streak, the ledger and the weekly
   * competition are all counted by date, so logging yesterday's dinner against today would put
   * the points on the wrong day. A date in the future is refused by the server.
   */
  loggedAt?: string
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
