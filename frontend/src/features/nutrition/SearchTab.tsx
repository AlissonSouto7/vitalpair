import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CategoryIcon } from './categories'
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
        {/*
          type="search" and an aria-label, not a placeholder alone: a placeholder disappears
          the moment somebody types, and a screen reader announces a control with no label as
          an unnamed edit box. The visible design is unchanged; what changes is that the field
          says what it is for.
        */}
        <input
          type="search"
          aria-label={t('nutrition.searchInputPlaceholder')}
          placeholder={t('nutrition.searchInputPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 border-none bg-transparent font-bold text-ink placeholder-faint outline-none [&::-webkit-search-cancel-button]:appearance-none"
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
              {/*
                O ícone da família à esquerda, fora do bloco de texto: é o que a pessoa vê
                antes de ler. Oito linhas de nome parecido obrigam a ler todas para achar a
                sua; um desenho por linha resolve a triagem antes da leitura.
              */}
              <CategoryIcon category={p.category} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-ink">{p.name}</p>
                <p className="truncate text-[11.5px] font-semibold text-muted">
                  {/*
                    A família, e só ela.

                    Aqui havia família e procedência juntas ("Base do prato · por 100g · tabela
                    TACO"). Medido num iPhone 12: os cinco primeiros resultados truncaram, então
                    a procedência aparecia cortada e às vezes comia o fim da própria família.
                    Duas informações numa linha que só caiba uma não são duas informações.

                    Fica a família, porque a pergunta de quem está escolhendo é "é isso que eu
                    quero?". A procedência responde de onde vem o número, que é a pergunta de
                    quem já escolheu, e ela aparece no editor, onde a pessoa confere.

                    A exceção é o alimento sem informação nutricional: esse aviso não é
                    procedência, é o que decide a escolha, porque leva a um caminho diferente
                    (preencher na mão em vez de só confirmar). Esse cabe, porque substitui a
                    família em vez de somar a ela.
                  */}
                  {p.caloriesPer100g == null
                    ? t('nutrition.noInfo')
                    : t(`nutrition.category.${p.category}`)}
                </p>
              </div>
              {p.caloriesPer100g != null && (
                <span className="shrink-0 font-display text-sm font-semibold text-muted">
                  {p.caloriesPer100g} kcal
                </span>
              )}
              {/*
                An item Open Food Facts has no nutrition for gets a different button, because
                it leads somewhere different: the editor opens with the calories blank and the
                person has to supply them. It used to carry the same "+" as a complete item and
                open at 0 kcal with saving enabled, so the diary ended up with a meal claiming
                the food had no calories, which is not what "no information" means.
              */}
              {p.caloriesPer100g != null ? (
                <button
                  type="button"
                  onClick={() => onPick(p)}
                  aria-label={t('nutrition.addAria', { name: p.name })}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-act-soft text-act-ink transition hover:brightness-95"
                >
                  <PlusIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onPick(p)}
                  aria-label={t('nutrition.fillInAria', { name: p.name })}
                  className="shrink-0 rounded-lg border border-brand px-2.5 py-1.5 text-[11px] font-extrabold text-brand-ink transition hover:bg-brand-soft"
                >
                  {t('nutrition.fillIn')}
                </button>
              )}
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
