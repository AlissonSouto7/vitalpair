import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AxiosError } from 'axios'
import { generateMealPlan, getMealPlan, swapMeal } from '../../api/aiplan'
import type { MealPlan, PlanMeal, PlanMealType } from '../../types/aiplan'

/**
 * Plano alimentar semanal — gerado pela IA na meta do usuário (dados reais).
 * Sem plano ainda: estado vazio com CTA de gerar. "Trocar" pede outra opção à IA.
 */

const WEEKDAY_KEYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'] as const

export function MealPlanPage() {
  const { t } = useTranslation()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [swapping, setSwapping] = useState<PlanMealType | null>(null)
  const [selected, setSelected] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMealPlan()
      .then((p) => {
        setPlan(p)
        if (p) setSelected(todayIndex(p))
      })
      .catch(() => setError(t('mealplan.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const p = await generateMealPlan()
      setPlan(p)
      setSelected(todayIndex(p))
    } catch (err) {
      setError(apiMessage(err) ?? t('mealplan.generateError'))
    } finally {
      setGenerating(false)
    }
  }

  async function swap(mealType: PlanMealType) {
    if (!plan) return
    setSwapping(mealType)
    setError(null)
    try {
      const p = await swapMeal(selected, mealType)
      setPlan(p)
    } catch (err) {
      setError(apiMessage(err) ?? t('mealplan.swapError'))
    } finally {
      setSwapping(null)
    }
  }

  const day = plan?.days[selected] ?? null

  const totals = useMemo(() => {
    if (!day) return { kcal: 0, protein: 0, carb: 0, fat: 0 }
    return day.meals.reduce(
      (acc, m) => ({
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.proteinG,
        carb: acc.carb + m.carbG,
        fat: acc.fat + m.fatG,
      }),
      { kcal: 0, protein: 0, carb: 0, fat: 0 },
    )
  }, [day])

  if (loading) return <p className="font-bold text-muted">{t('common.loading')}</p>

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">
            {t('mealplan.title')}
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted">{t('mealplan.subtitle')}</p>
        </div>

        {plan && (
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-extrabold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SparkIcon className="h-[18px] w-[18px]" />
            {generating ? t('mealplan.generating') : t('mealplan.regenerate')}
          </button>
        )}
      </header>

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {!plan ? (
        /* Estado vazio: ainda sem cardápio */
        <section className="card flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
            <SparkIcon className="h-8 w-8 text-brand" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              {t('mealplan.emptyTitle')}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm font-semibold text-muted">
              {t('mealplan.emptyText')}
            </p>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SparkIcon className="h-[18px] w-[18px]" />
            {generating ? t('mealplan.generating') : t('mealplan.generate')}
          </button>
          {generating && (
            <p className="text-xs font-bold text-muted">{t('mealplan.generatingHint')}</p>
          )}
        </section>
      ) : (
        <>
          {/* Seletor de dias */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {plan.days.map((d, i) => {
              const active = i === selected
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-pressed={active}
                  className={`flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 leading-tight transition ${
                    active
                      ? 'border-brand bg-brand text-white'
                      : 'border-hair bg-surface text-muted hover:text-ink'
                  }`}
                >
                  <span
                    className={`text-[10px] font-extrabold tracking-wide ${active ? 'opacity-80' : ''}`}
                  >
                    {t(`mealplan.weekday.${WEEKDAY_KEYS[d.dayIndex] ?? 'SEG'}`)}
                  </span>
                  <span className="font-display text-base font-semibold">{dayOfMonth(d.date)}</span>
                </button>
              )
            })}
          </div>

          {/* Refeições do dia */}
          <div className="space-y-3">
            {day?.meals.map((m) => (
              <MealCard
                key={m.mealType}
                meal={m}
                swapping={swapping === m.mealType}
                onSwap={() => swap(m.mealType)}
              />
            ))}
          </div>

          {/* Total do dia vs meta */}
          <section className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
                {t('mealplan.dayTotal')}
              </p>
              <p className="font-display text-2xl font-semibold text-ink">
                {totals.kcal.toLocaleString('pt-BR')} kcal
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-bold">
              <MacroPill label={t('mealplan.protein')} value={totals.protein} tone="brand" />
              <MacroPill label={t('mealplan.carb')} value={totals.carb} tone="carb" />
              <MacroPill label={t('mealplan.fat')} value={totals.fat} tone="success" />
            </div>

            {plan.targetKcal != null && <TargetBadge diff={totals.kcal - plan.targetKcal} t={t} />}
          </section>
        </>
      )}
    </div>
  )
}

function TargetBadge({
  diff,
  t,
}: {
  diff: number
  t: (k: string, o?: Record<string, unknown>) => string
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-extrabold ${
        Math.abs(diff) <= 80
          ? 'bg-success-soft text-success-ink'
          : diff > 0
            ? 'bg-carb/15 text-carb-ink'
            : 'bg-brand-soft text-brand-ink'
      }`}
    >
      {Math.abs(diff) <= 80
        ? t('mealplan.onTarget')
        : diff > 0
          ? t('mealplan.overTarget', { n: diff })
          : t('mealplan.underTarget', { n: -diff })}
    </span>
  )
}

function MealCard({
  meal,
  swapping,
  onSwap,
}: {
  meal: PlanMeal
  swapping: boolean
  onSwap: () => void
}) {
  const { t } = useTranslation()
  return (
    <article className={`card p-4 transition sm:p-5 ${swapping ? 'opacity-60' : ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-ink">
          {t(`mealplan.mealLabel.${meal.mealType}`)}
        </span>

        <button
          type="button"
          onClick={onSwap}
          disabled={swapping}
          className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-rival-ink transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SwapIcon className={`h-[13px] w-[13px] ${swapping ? 'animate-spin' : ''}`} />
          {swapping ? t('mealplan.swapping') : t('mealplan.swap')}
        </button>
      </div>

      <p className="text-[15px] font-extrabold text-ink">{meal.name}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-bold">
        <span className="font-display text-sm font-semibold text-ink">{meal.kcal} kcal</span>
        <MacroPill label="P" value={meal.proteinG} tone="brand" />
        <MacroPill label="C" value={meal.carbG} tone="carb" />
        <MacroPill label="G" value={meal.fatG} tone="success" />
      </div>
    </article>
  )
}

function MacroPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'brand' | 'carb' | 'success'
}) {
  const dot = tone === 'brand' ? 'bg-brand' : tone === 'carb' ? 'bg-carb' : 'bg-success'
  const text =
    tone === 'brand' ? 'text-brand-ink' : tone === 'carb' ? 'text-carb-ink' : 'text-success-ink'
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      <span className={text}>
        {label} {value}g
      </span>
    </span>
  )
}

/* ---------- helpers ---------- */

function dayOfMonth(iso: string): number {
  return new Date(`${iso}T00:00:00`).getDate()
}

// Índice do dia de hoje dentro do plano (cai no primeiro dia se hoje não estiver na semana).
function todayIndex(plan: MealPlan): number {
  const today = new Date()
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const idx = plan.days.findIndex((d) => d.date === iso)
  return idx >= 0 ? idx : 0
}

function apiMessage(err: unknown): string | null {
  return err instanceof AxiosError
    ? ((err.response?.data?.message as string | undefined) ?? null)
    : null
}

/* ---------- ícones ---------- */

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2zm6 11l.9 2.6L21 17l-2.1.8L18 21l-.9-2.2L15 17l2.1-.4L18 13zM6 14l.7 2L9 16.7l-2.3.6L6 20l-.7-2.7L3 16.7 5.3 16 6 14z" />
    </svg>
  )
}

function SwapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 5V2L7 7l5 5V8a5 5 0 11-5 5H5a7 7 0 107-8z" />
    </svg>
  )
}
