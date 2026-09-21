import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { deleteLog, logMeal } from '../../api/nutrition'
import { Card } from '../../components/ui/Card'
import type {
  DailySummary,
  DetectedFood,
  FavoriteFood,
  FoodLog,
  FoodProduct,
  MealType,
} from '../../types/nutrition'
import { usePartnerName } from '../pair/usePartnerName'

import { DayList } from './DayList'
import { type Draft, draftFromDetected, draftFromProduct, emptyDraft, round } from './draft'
import { FavoritesTab } from './FavoritesTab'
import { CameraIcon, SearchIcon, StarIcon } from './icons'
import { MealDetailModal } from './MealDetailModal'
import { MealEditor } from './MealEditor'
import { mealForHour } from './mealForHour'
import { TabButton } from './parts'
import { PhotoTab } from './PhotoTab'
import { nutritionQueries } from './queries'
import { SearchTab } from './SearchTab'
import { useScrollToEditor } from './useScrollToEditor'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { premiumQueries } from '@/features/premium/queries'
import { getApiErrorMessage } from '@/shared/api/errors'

const MEAL_VALUES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']

type Tab = 'foto' | 'buscar' | 'favoritos'

const num = (v: string) => (v.trim() === '' ? 0 : Number(v))

export function NutritionPage() {
  const { t, i18n } = useTranslation()
  const foodNameId = useId()
  const mealLabel = (m: MealType) => t(`nutrition.mealShort.${m}`)
  const queryClient = useQueryClient()
  /*
   * Which tab opens first.
   *
   * It used to be 'foto', always. The photo tab is behind the paid plan, so somebody who came
   * here to log a meal landed on a padlock reading "Disponível no plano pago", under a
   * subtitle still telling them a photo is the fastest way. The first screen of the main
   * action in the app was a wall.
   *
   * `null` until the entitlement answers, so the tabs do not flip under the person's finger
   * between the first paint and the response.
   */
  const entitlement = useQuery(premiumQueries.entitlement())
  const aiAccess = entitlement.data?.aiAccess ?? null
  const [chosenTab, setChosenTab] = useState<Tab | null>(null)
  const tab: Tab = chosenTab ?? (aiAccess === false ? 'buscar' : 'foto')
  const setTab = setChosenTab
  const [meal, setMeal] = useState<MealType>(() => mealForHour(new Date().getHours()))
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<FoodLog | null>(null)
  const editorRef = useScrollToEditor(draft ? `${draft.source}:${draft.name}` : null)

  const logsQuery = useQuery(nutritionQueries.logs())
  const summaryQuery = useQuery(nutritionQueries.summary())
  const partnerName = usePartnerName()
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
    setDraft(draftFromProduct(p, meal))
  }

  function startFromDetected(d: DetectedFood) {
    setDraft(draftFromDetected(d, meal))
  }

  function startManual() {
    setDraft(emptyDraft(meal))
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

  /*
    Apagar pergunta antes. A ação leva junto a linha do feed da dupla e os pontos que a
    refeição rendeu, e era um clique só, sem volta: quem errasse o alvo perdia as três coisas
    e só descobria depois.
  */
  const [toDelete, setToDelete] = useState<FoodLog | null>(null)

  async function removeLog(id: string) {
    setSelected((cur) => (cur?.id === id ? null : cur))
    setToDelete(null)
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
        {/*
          Sem o plano pago, o subtítulo não anuncia a foto: ele dizia "Foto é o jeito mais
          rápido" logo acima de um cadeado, ou seja, vendia como atalho justamente o caminho
          que estava fechado.
        */}
        <p className="mt-1 text-sm font-semibold text-muted">
          {t(aiAccess === false ? 'nutrition.pageSubtitleFree' : 'nutrition.pageSubtitle')}
        </p>
      </header>

      {/*
        O saldo do dia numa linha, e não o card inteiro.

        Aqui havia uma cópia do painel do Início: o mesmo anel de calorias e as mesmas três
        barras de macro, ocupando a primeira dobra de uma tela cuja função é registrar. Quem
        abre esta tela já sabe quanto comeu, veio para adicionar mais uma coisa. O número
        fica porque situa a decisão ("ainda cabe?"), o resto está a um clique no Início.
      */}
      {summary && (
        <Card as="section" padding="tight">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="font-display text-xl font-semibold tabular-nums text-ink">
              {summary.remainingCalories != null
                ? summary.remainingCalories >= 0
                  ? t('nutrition.remainingKcal', { kcal: summary.remainingCalories })
                  : t('nutrition.overKcal', { kcal: -summary.remainingCalories })
                : t('nutrition.mealsCount', { count: summary.mealCount })}
            </span>
            <span className="text-xs font-bold tabular-nums text-muted">
              {t('nutrition.consumedOfTarget', {
                consumed: summary.consumedCalories.toLocaleString(i18n.language),
                target: (summary.targetCalories ?? 2000).toLocaleString(i18n.language),
              })}
            </span>
          </div>
          {summary.targetCalories == null && (
            <p className="mt-2 text-xs font-bold text-muted">{t('nutrition.noTargetHint')}</p>
          )}
        </Card>
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

      {/*
        Editor do item.

        O wrapper existe pela rolagem: medido num iPhone, o editor era inserido a 2190px do
        topo numa tela de 844px, ou seja 1346px abaixo do que a pessoa estava vendo, e nada
        a levava até lá. Ela tocava no "+", a tela não mudava, e ela tocava de novo.
      */}
      {draft && computed && (
        <div ref={editorRef}>
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
        </div>
      )}

      {/* Refeições de hoje */}
      <DayList
        t={t}
        logs={logs}
        mealLabel={mealLabel}
        partnerName={partnerName}
        onOpen={setSelected}
        onRemove={(id) => setToDelete(logs.find((l) => l.id === id) ?? null)}
      />

      {/*
        A barra fixa "vai entrar" saiu junto com o editor em passos.

        Ela e o botão dentro do editor chamavam o mesmo `save()`, então eram dois botões
        para a mesma ação, um deles por cima do formulário. Com o editor perguntando uma
        coisa por vez e carregando o próprio rodapé, a barra passou a competir com o passo
        em vez de ajudar: na tela de "qual refeição?" ela já oferecia registrar, antes de a
        pergunta ter sido respondida.
      */}

      {selected && (
        <MealDetailModal
          meal={selected}
          onClose={() => setSelected(null)}
          onDelete={(id) => setToDelete(logs.find((l) => l.id === id) ?? null)}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={t('nutrition.deleteTitle', { name: toDelete.foodName })}
          description={t('nutrition.deleteText')}
          confirmLabel={t('nutrition.deleteConfirm')}
          cancelLabel={t('nutrition.deleteCancel')}
          busy={deleteLogMutation.isPending}
          onConfirm={() => void removeLog(toDelete.id)}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
