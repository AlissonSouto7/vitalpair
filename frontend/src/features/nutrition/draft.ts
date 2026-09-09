import type { FoodSource, MealType } from '@/types/nutrition'

/**
 * A meal being edited before it is saved.
 *
 * The numbers are strings because they come straight from inputs: keeping them as typed
 * lets someone clear a field or leave a trailing dot without the value jumping back to 0
 * under the cursor. They are converted once, where the totals are computed.
 *
 * Shared between the page and the editor, which is why it lives here rather than in either.
 */
export interface Draft {
  name: string
  barcode: string | null
  kcalPer100: string
  proteinPer100: string
  carbPer100: string
  fatPer100: string
  grams: string
  mealType: MealType
  isPrivate: boolean
  source: FoodSource
}
