import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'


import { PlusIcon } from './icons'
import { nutritionQueries } from './queries'

import type { FavoriteFood } from '@/types/nutrition'

const round = (v: number) => Math.round(v * 10) / 10

/**
 * The foods this person logs often, one tap each.
 *
 * The list is fetched when the tab opens and cached afterwards. Before, a null check served
 * as both "not loaded" and "loading", so a failed request left the tab permanently empty
 * with no way to retry; now a failure is a failed query and the empty state is genuinely
 * empty.
 */
export function FavoritesTab({
  onAdd,
  addingName,
}: {
  onAdd: (food: FavoriteFood) => void
  /** The favourite currently being logged, so its own button shows the wait. */
  addingName: string | null
}) {
  const { t } = useTranslation()
  const favorites = useQuery(nutritionQueries.favorites(true))
  const list = favorites.data ?? []

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-muted">{t('nutrition.favoritesHint')}</p>

      {favorites.isPending && (
        <p className="text-sm font-semibold text-muted">{t('nutrition.favoritesLoading')}</p>
      )}

      {favorites.isError && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
        >
          {t('nutrition.favoritesLoadError')}
        </p>
      )}

      {favorites.isSuccess && list.length === 0 && (
        <div className="rounded-xl border border-dashed border-hair bg-surface px-5 py-8 text-center">
          <p className="text-sm font-bold text-ink">{t('nutrition.favoritesEmptyTitle')}</p>
          <p className="mt-1 text-sm font-semibold text-muted">
            {t('nutrition.favoritesEmptyText')}
          </p>
        </div>
      )}

      {list.length > 0 && (
        <ul className="space-y-2">
          {list.map((f, i) => (
            <li
              key={`${f.foodName}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-hair bg-surface px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-ink">{f.foodName}</p>
                <p className="text-[11.5px] font-semibold text-muted">
                  {round(f.quantityG)}g · {round(f.caloriesKcal)} kcal
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAdd(f)}
                disabled={addingName === f.foodName}
                aria-label={t('nutrition.addAria', { name: f.foodName })}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition hover:brightness-105 disabled:opacity-60"
              >
                {addingName === f.foodName ? (
                  <span className="text-[11px] font-extrabold">...</span>
                ) : (
                  <PlusIcon />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
