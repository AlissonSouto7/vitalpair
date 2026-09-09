import type { TFunction } from 'i18next'

import { Points } from '@/components/ui/Badge'
import type { MealType } from '@/types/nutrition'

/**
 * The bar pinned to the bottom while a meal is being edited: what it adds up to, and save.
 *
 * Moved out of NutritionPage verbatim, markup untouched. It is separate from the editor
 * above it because it stays on screen while the editor scrolls, which is why the draft lives
 * in the page rather than in either of them.
 */
export function SaveBar({
  t,
  calories,
  mealType,
  mealLabel,
  disabled,
  saving,
  onSave,
}: {
  t: TFunction
  calories: number
  mealType: MealType
  mealLabel: (meal: MealType) => string
  disabled: boolean
  saving: boolean
  onSave: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-arena-border bg-canvas/95 px-4 py-3 backdrop-blur md:left-64">
      <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl bg-arena px-4 py-3 shadow-[0_10px_30px_rgba(70,45,20,0.12)] md:px-8">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-arena-muted">
            {t('nutrition.willEnter')}
          </p>
          <p className="font-display text-xl font-semibold leading-tight text-arena-text">
            {calories} kcal{' '}
            <span className="text-sm font-bold text-arena-muted">
              {t('nutrition.inMeal', { meal: mealLabel(mealType).toLowerCase() })}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={disabled}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? t('common.saving') : t('nutrition.register')}
          <Points value={10} />
        </button>
      </div>
    </div>
  )
}
