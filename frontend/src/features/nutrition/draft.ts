import type { DetectedFood, FoodProduct, FoodSource, MealType } from '@/types/nutrition'

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

/** Uma casa decimal, que é o quanto um rótulo de alimento carrega. */
export const round = (v: number) => Math.round(v * 10) / 10

/**
 * Converte valores totais de uma porção para o formato por-100g que o editor usa,
 * mantendo o mesmo total quando for recalculado.
 */
export function per100(value: number, grams: number) {
  return grams > 0 ? round(value / (grams / 100)) : round(value)
}

/** Um rascunho a partir de um item da Open Food Facts. Os campos vazios são "não sei". */
export function draftFromProduct(p: FoodProduct, mealType: MealType): Draft {
  return {
    name: p.name,
    barcode: p.barcode,
    kcalPer100: p.caloriesPer100g != null ? String(p.caloriesPer100g) : '',
    proteinPer100: p.proteinPer100g != null ? String(p.proteinPer100g) : '',
    carbPer100: p.carbPer100g != null ? String(p.carbPer100g) : '',
    fatPer100: p.fatPer100g != null ? String(p.fatPer100g) : '',
    grams: '100',
    mealType,
    isPrivate: false,
    source: 'OPEN_FOOD_FACTS',
  }
}

/** Um rascunho a partir do que a IA viu no prato, que vem em totais e não por 100g. */
export function draftFromDetected(d: DetectedFood, mealType: MealType): Draft {
  const grams = round(d.quantityG) || 100
  return {
    name: d.foodName,
    barcode: null,
    kcalPer100: String(per100(d.caloriesKcal, grams)),
    proteinPer100: String(per100(d.proteinG, grams)),
    carbPer100: String(per100(d.carbG, grams)),
    fatPer100: String(per100(d.fatG, grams)),
    grams: String(grams),
    mealType,
    isPrivate: false,
    source: 'MANUAL',
  }
}

/** Um rascunho em branco, para quem não achou o alimento na busca. */
export function emptyDraft(mealType: MealType): Draft {
  return {
    name: '',
    barcode: null,
    kcalPer100: '',
    proteinPer100: '',
    carbPer100: '',
    fatPer100: '',
    grams: '100',
    mealType,
    isPrivate: false,
    source: 'MANUAL',
  }
}
