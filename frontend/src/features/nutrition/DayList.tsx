import type { TFunction } from 'i18next'

import { ForkIcon, TrashIcon } from './icons'

import type { FoodLog, MealType } from '@/types/nutrition'

/**
 * What the person ate today, newest last.
 *
 * Moved out of NutritionPage verbatim, markup untouched. It is the read side of the screen:
 * a 201 nobody reads back proves less than a row appearing here, which is what the browser
 * test asserts on.
 */
export function DayList({
  t,
  logs,
  mealLabel,
  onOpen,
  onRemove,
}: {
  t: TFunction
  logs: FoodLog[]
  mealLabel: (meal: MealType) => string
  onOpen: (log: FoodLog) => void
  onRemove: (id: string) => void
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-ink">
        {t('nutrition.todayMeals')}
      </h2>
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hair bg-surface px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
            <ForkIcon />
          </div>
          <p className="font-display text-base font-semibold text-ink">
            {t('nutrition.emptyPlateTitle')}
          </p>
          <p className="mt-1 text-sm font-semibold text-muted">{t('nutrition.emptyPlateText')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-center gap-3 rounded-2xl border border-hair bg-surface px-4 py-3 transition hover:border-brand/40"
            >
              <button
                type="button"
                onClick={() => onOpen(log)}
                aria-label={t('nutrition.detailAria', { name: log.foodName })}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                  <ForkIcon small />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-ink">
                    {log.foodName}
                  </span>
                  <span className="block text-[11.5px] font-semibold text-muted">
                    {mealLabel(log.mealType)} · {log.quantityG}g · {log.caloriesKcal} kcal
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(log.id)}
                aria-label={t('nutrition.removeAria', { name: log.foodName })}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition hover:bg-danger-soft hover:text-danger"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
