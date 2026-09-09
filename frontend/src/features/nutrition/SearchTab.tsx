import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'


import { PlusIcon, SearchIcon } from './icons'
import { nutritionQueries } from './queries'

import type { FoodProduct } from '@/types/nutrition'

/**
 * Searching Open Food Facts by name.
 *
 * The debounce is here rather than in the query because it is about typing, not about data:
 * the query is keyed on the settled term, so a response for an abandoned word is stored
 * under its own key instead of overwriting the results of the current one. That was a real
 * race before, when a single results array was overwritten by whichever request returned
 * last.
 */
export function SearchTab({
  onPick,
  onManual,
}: {
  onPick: (product: FoodProduct) => void
  onManual: () => void
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [term, setTerm] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setTerm(query), 400)
    return () => clearTimeout(timer)
  }, [query])

  const search = useQuery(nutritionQueries.search(term))
  const results = search.data ?? []
  // Typing counts as searching even before the timer fires, so the message does not blink
  // off between the keystroke and the request.
  const searching = search.isFetching || (query.trim().length >= 2 && query !== term)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 rounded-xl border border-brand bg-canvas px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-brand/30">
        <SearchIcon />
        <input
          type="text"
          placeholder={t('nutrition.searchInputPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 border-none bg-transparent font-bold text-ink placeholder-faint outline-none"
        />
      </div>

      {searching && (
        <p className="text-sm font-semibold text-muted">{t('nutrition.searchingShort')}</p>
      )}

      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm font-semibold text-muted">{t('nutrition.searchEmpty')}</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((p, i) => (
            <li
              key={`${p.barcode ?? p.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-hair bg-surface px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-ink">{p.name}</p>
                <p className="text-[11.5px] font-semibold text-muted">
                  {p.caloriesPer100g != null
                    ? t('nutrition.per100Source')
                    : t('nutrition.noInfoSource')}
                </p>
              </div>
              {p.caloriesPer100g != null && (
                <span className="shrink-0 font-display text-sm font-semibold text-muted">
                  {p.caloriesPer100g} kcal
                </span>
              )}
              <button
                type="button"
                onClick={() => onPick(p)}
                aria-label={t('nutrition.addAria', { name: p.name })}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition hover:brightness-105"
              >
                <PlusIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onManual}
        className="w-full rounded-xl border border-dashed border-hair py-3 text-sm font-bold text-muted transition hover:border-brand hover:text-brand-ink"
      >
        {t('nutrition.manualCta')}
      </button>
    </div>
  )
}
