import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { deleteLog, logMeal } from '../../api/nutrition'
import { CalorieRing } from '../../components/ui/CalorieRing'
import type {
  DailySummary,
  DetectedFood,
  FavoriteFood,
  FoodLog,
  FoodProduct,
  MealType,
} from '../../types/nutrition'

import { DayList } from './DayList'
import type { Draft } from './draft'
import { FavoritesTab } from './FavoritesTab'
import { CameraIcon, SearchIcon, StarIcon } from './icons'
import { MealDetailModal } from './MealDetailModal'
import { MealEditor } from './MealEditor'
import { Macro, TabButton } from './parts'
import { PhotoTab } from './PhotoTab'
import { nutritionQueries } from './queries'
import { SaveBar } from './SaveBar'
import { SearchTab } from './SearchTab'

import { getApiErrorMessage } from '@/shared/api/errors'

const MEAL_VALUES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']

type Tab = 'foto' | 'buscar' | 'favoritos'

const num = (v: string) => (v.trim() === '' ? 0 : Number(v))
const round = (v: number) => Math.round(v * 10) / 10

// Converte valores totais de uma porção (gramas + kcal/macros daquela porção) para o
// formato por-100g que o editor usa, mantendo o mesmo total ao recalcular.
function per100(value: number, grams: number) {
  return grams > 0 ? round(value / (grams / 100)) : round(value)
}

export function NutritionPage() {
  const { t } = useTranslation()
  const foodNameId = useId()
  const mealLabel = (m: MealType) => t(`nutrition.mealShort.${m}`)
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('foto')
  const [meal, setMeal] = useState<MealType>('LUNCH')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<FoodLog | null>(null)

  const logsQuery = useQuery(nutritionQueries.logs())
  const summaryQuery = useQuery(nutritionQueries.summary())
  const logs: FoodLog[] = logsQuery.data ?? []
  const summary: DailySummary | null = summaryQuery.data ?? null
  const loadError = logsQuery.isError || summaryQuery.isError ? t('nutrition.loadError') : null

  /** Every read a write makes stale: the day's meals, the day's totals, the dashboard. */
  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'logs'] }),
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'summary'] }),
      // The dashboard shows the same numbers, so it is stale the moment a meal is logged.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
  }

  const logMealMutation = useMutation({ mutationFn: logMeal, onSuccess: refresh })
  const deleteLogMutation = useMutation({ mutationFn: deleteLog, onSuccess: refresh })

  // Which favourite is being logged right now, or null. Tracked explicitly rather than read
  // off the mutation: saving from the editor uses the same mutation, and a "MANUAL" source
  // does not tell the two apart.
  const [addingFav, setAddingFav] = useState<string | null>(null)
  const saving = logMealMutation.isPending && addingFav === null

  function startFromProduct(p: FoodProduct) {
    setDraft({
      name: p.name,
      barcode: p.barcode,
      kcalPer100: p.caloriesPer100g != null ? String(p.caloriesPer100g) : '',
      proteinPer100: p.proteinPer100g != null ? String(p.proteinPer100g) : '',
      carbPer100: p.carbPer100g != null ? String(p.carbPer100g) : '',
      fatPer100: p.fatPer100g != null ? String(p.fatPer100g) : '',
      grams: '100',
      mealType: meal,
      isPrivate: false,
      source: 'OPEN_FOOD_FACTS',
    })
  }

  // Abre o editor pré-preenchido a partir de valores totais (Foto-IA).
  function startFromDetected(d: DetectedFood) {
    const grams = round(d.quantityG) || 100
    setDraft({
      name: d.foodName,
      barcode: null,
      kcalPer100: String(per100(d.caloriesKcal, grams)),
      proteinPer100: String(per100(d.proteinG, grams)),
      carbPer100: String(per100(d.carbG, grams)),
      fatPer100: String(per100(d.fatG, grams)),
      grams: String(grams),
      mealType: meal,
      isPrivate: false,
      source: 'MANUAL',
    })
  }

  function startManual() {
    setDraft({
      name: '',
      barcode: null,
      kcalPer100: '',
      proteinPer100: '',
      carbPer100: '',
      fatPer100: '',
      grams: '100',
      mealType: meal,
      isPrivate: false,
      source: 'MANUAL',
    })
  }

  // Favorito: registra na hora (1 toque), sem abrir editor.
  async function addFavorite(f: FavoriteFood) {
    setAddingFav(f.foodName)
    setError(null)
    try {
      await logMealMutation.mutateAsync({
        foodName: f.foodName,
        barcode: null,
        quantityG: f.quantityG,
        caloriesKcal: f.caloriesKcal,
        proteinG: f.proteinG,
        carbG: f.carbG,
        fatG: f.fatG,
        mealType: meal,
        source: 'MANUAL',
        isPrivate: false,
      })
    } catch (err) {
      setError(getApiErrorMessage(err, t('nutrition.favAddError')))
    } finally {
      setAddingFav(null)
    }
  }

  const factor = draft ? num(draft.grams) / 100 : 0
  const computed = draft
    ? {
        calories: round(num(draft.kcalPer100) * factor),
        protein: round(num(draft.proteinPer100) * factor),
        carb: round(num(draft.carbPer100) * factor),
        fat: round(num(draft.fatPer100) * factor),
      }
    : null

  async function save() {
    if (!draft || !computed) return
    setError(null)
    try {
      await logMealMutation.mutateAsync({
        foodName: draft.name,
        barcode: draft.barcode,
        quantityG: num(draft.grams),
        caloriesKcal: computed.calories,
        proteinG: computed.protein,
        carbG: computed.carb,
        fatG: computed.fat,
        mealType: draft.mealType,
        source: draft.source,
        isPrivate: draft.isPrivate,
      })
      setDraft(null)
    } catch (err) {
      setError(getApiErrorMessage(err, t('nutrition.saveError')))
    }
  }

  async function removeLog(id: string) {
    setSelected((cur) => (cur?.id === id ? null : cur))
    setError(null)
    try {
      await deleteLogMutation.mutateAsync(id)
    } catch (err) {
      // Deleting had no catch at all: a failed removal left the meal on screen with no
      // explanation, and the person could only tell by reloading.
      setError(getApiErrorMessage(err, t('nutrition.deleteError')))
    }
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Cabeçalho */}
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">
          {t('nutrition.pageTitle')}
        </h1>
        <p className="mt-1 text-sm font-semibold text-muted">{t('nutrition.pageSubtitle')}</p>
      </header>

      {/* Resumo do dia */}
      {summary && (
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              {t('nutrition.todayTitle')}
            </h2>
            <span className="text-sm font-bold text-muted">
              {summary.remainingCalories != null
                ? summary.remainingCalories >= 0
                  ? t('nutrition.remainingKcal', { kcal: summary.remainingCalories })
                  : t('nutrition.overKcal', { kcal: -summary.remainingCalories })
                : t('nutrition.mealsCount', { count: summary.mealCount })}
            </span>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <CalorieRing current={summary.consumedCalories} goal={summary.targetCalories ?? 2000} />
            <div className="w-full flex-1 space-y-4">
              <Macro
                label={t('nutrition.proteinLabel')}
                value={summary.consumedProteinG}
                target={summary.targetProteinG}
                tone="brand"
              />
              <Macro
                label={t('nutrition.carbLabel')}
                value={summary.consumedCarbG}
                target={summary.targetCarbG}
                tone="carb"
              />
              <Macro
                label={t('nutrition.fatLabel')}
                value={summary.consumedFatG}
                target={summary.targetFatG}
                tone="success"
              />
            </div>
          </div>

          {summary.targetCalories == null && (
            <p className="mt-5 text-xs font-bold text-muted">{t('nutrition.noTargetHint')}</p>
          )}
        </section>
      )}

      {(error ?? loadError) && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
        >
          {error ?? loadError}
        </p>
      )}

      {/* Tipo de refeição */}
      <div>
        <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-wide text-muted">
          {t('nutrition.whichMeal')}
        </span>
        <div className="flex gap-2">
          {MEAL_VALUES.map((value) => {
            const active = meal === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMeal(value)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${
                  active
                    ? 'border-brand bg-brand-soft text-brand-ink'
                    : 'border-hair bg-surface text-muted hover:text-ink'
                }`}
              >
                {mealLabel(value)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Abas: Foto / Buscar / Favoritos */}
      <section className="card space-y-4">
        <div className="flex gap-1 rounded-xl bg-track p-1">
          <TabButton
            active={tab === 'foto'}
            onClick={() => setTab('foto')}
            icon={<CameraIcon />}
            label={t('nutrition.tabPhoto')}
          />
          <TabButton
            active={tab === 'buscar'}
            onClick={() => setTab('buscar')}
            icon={<SearchIcon />}
            label={t('nutrition.tabSearch')}
          />
          <TabButton
            active={tab === 'favoritos'}
            onClick={() => setTab('favoritos')}
            icon={<StarIcon />}
            label={t('nutrition.tabFavorites')}
          />
        </div>

        {tab === 'foto' && <PhotoTab onPick={startFromDetected} />}

        {/* --- Aba Buscar --- */}
        {tab === 'buscar' && <SearchTab onPick={startFromProduct} onManual={startManual} />}

        {tab === 'favoritos' && (
          <FavoritesTab onAdd={(food) => void addFavorite(food)} addingName={addingFav} />
        )}
      </section>

      {/* Editor do item */}
      {draft && computed && (
        <MealEditor
          t={t}
          draft={draft}
          setDraft={setDraft}
          computed={computed}
          foodNameId={foodNameId}
          mealLabel={mealLabel}
          mealValues={MEAL_VALUES}
          onSave={() => void save()}
          onDiscard={() => setDraft(null)}
          saving={saving}
        />
      )}

      {/* Refeições de hoje */}
      <DayList
        t={t}
        logs={logs}
        mealLabel={mealLabel}
        onOpen={setSelected}
        onRemove={(id) => void removeLog(id)}
      />

      {/* Barra fixa "vai entrar" */}
      {draft && computed && computed.calories > 0 && (
        <SaveBar
          t={t}
          calories={computed.calories}
          mealType={draft.mealType}
          mealLabel={mealLabel}
          disabled={saving || !draft.name}
          saving={saving}
          onSave={() => void save()}
        />
      )}

      {selected && (
        <MealDetailModal
          meal={selected}
          onClose={() => setSelected(null)}
          onDelete={(id) => void removeLog(id)}
        />
      )}
    </div>
  )
}
