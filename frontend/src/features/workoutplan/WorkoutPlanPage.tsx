import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AxiosError } from 'axios'
import { completeWorkout, generateWorkoutPlan, getWorkoutToday, toggleExercise } from '../../api/aiplan'
import type { WorkoutToday } from '../../types/aiplan'

/**
 * Plano de treino — gerado pela IA no objetivo do usuário (dados reais).
 * Mostra o treino de HOJE; marcar como feito registra a atividade (e os pontos vêm por lá).
 */
export function WorkoutPlanPage() {
  const { t } = useTranslation()
  const [today, setToday] = useState<WorkoutToday | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getWorkoutToday()
      .then(setToday)
      .catch(() => setError(t('workoutplan.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      setToday(await generateWorkoutPlan())
    } catch (err) {
      setError(apiMessage(err) ?? t('workoutplan.generateError'))
    } finally {
      setGenerating(false)
    }
  }

  async function toggle(id: string) {
    if (!today || today.completed) return
    // otimista: inverte local, sincroniza com a resposta
    setToday({
      ...today,
      exercises: today.exercises.map((e) => (e.id === id ? { ...e, done: !e.done } : e)),
    })
    try {
      setToday(await toggleExercise(id))
    } catch {
      setError(t('workoutplan.toggleError'))
      getWorkoutToday().then(setToday).catch(() => {})
    }
  }

  async function finish() {
    setFinishing(true)
    setError(null)
    try {
      setToday(await completeWorkout())
    } catch (err) {
      setError(apiMessage(err) ?? t('workoutplan.completeError'))
    } finally {
      setFinishing(false)
    }
  }

  if (loading) return <p className="font-bold text-muted">{t('common.loading')}</p>

  const total = today?.exercises.length ?? 0
  const done = today?.exercises.filter((e) => e.done).length ?? 0
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  return (
    <div className="space-y-5 pb-2">
      {/* cabeçalho */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{t('workoutplan.title')}</h1>
          {today && !today.rest && (
            <p className="mt-1 text-sm font-semibold text-muted">
              {t('workoutplan.subtitle', {
                focus: today.focus ?? '',
                duration: today.durationMin ?? 45,
                goal: goalLabel(t, today.goal),
              })}
            </p>
          )}
        </div>

        {today && (
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-brand/40 bg-brand-soft px-3.5 py-2 text-[13px] font-extrabold text-brand-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconSpark className="h-4 w-4" />
            {generating ? t('workoutplan.generating') : t('workoutplan.regenerate')}
          </button>
        )}
      </header>

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>
      )}

      {!today ? (
        /* Sem plano: estado vazio + gerar */
        <section className="card flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
            <IconSpark className="h-8 w-8 text-brand" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">{t('workoutplan.emptyTitle')}</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm font-semibold text-muted">{t('workoutplan.emptyText')}</p>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconSpark className="h-[18px] w-[18px]" />
            {generating ? t('workoutplan.generating') : t('workoutplan.generate')}
          </button>
          {generating && <p className="text-xs font-bold text-muted">{t('workoutplan.generatingHint')}</p>}
        </section>
      ) : today.rest ? (
        /* Dia de descanso */
        <section className="card flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft">
            <IconRest className="h-8 w-8 text-success" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">{t('workoutplan.restTitle')}</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm font-semibold text-muted">{t('workoutplan.restText')}</p>
          </div>
        </section>
      ) : (
        <>
          {/* progresso (arena) */}
          <div className="flex items-center gap-4 rounded-2xl border border-arena-border bg-arena px-5 py-4 shadow-[0_10px_26px_var(--arena-shadow)]">
            <div className="flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-arena-muted">
                {t('workoutplan.youDid')}
              </div>
              <div className="font-display text-xl font-semibold leading-tight text-arena-text">
                {t('workoutplan.exercisesCount', { done, total })}
              </div>
            </div>
            <div className="w-[130px]">
              <div className="h-2 overflow-hidden rounded-full bg-arena-track">
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* exercícios */}
          <ul className="space-y-2.5">
            {today.exercises.map((ex) => (
              <li
                key={ex.id}
                className={`flex items-center gap-3.5 rounded-2xl border border-hair bg-surface px-4 py-3.5 transition ${
                  ex.done ? 'opacity-60' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(ex.id)}
                  disabled={today.completed}
                  aria-pressed={ex.done}
                  aria-label={ex.done ? t('workoutplan.markDone', { name: ex.name }) : t('workoutplan.markUndone', { name: ex.name })}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] transition ${
                    ex.done
                      ? 'border-none bg-success text-white'
                      : 'border-2 border-track bg-transparent hover:border-success'
                  } disabled:cursor-default`}
                >
                  {ex.done && <IconCheck />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-extrabold text-ink">{ex.name}</div>
                  <div className="mt-0.5 text-xs font-bold text-muted">
                    {t('workoutplan.seriesReps', { series: ex.sets, reps: ex.reps })}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 font-display text-[13px] font-semibold text-muted">
                  <IconRest className="h-4 w-4 text-faint" />
                  {ex.restSeconds}s
                </div>
              </li>
            ))}
          </ul>

          {/* CTA: marcar treino como feito */}
          <button
            type="button"
            onClick={finish}
            disabled={!allDone || today.completed || finishing}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-display text-[15px] font-semibold transition ${
              today.completed
                ? 'cursor-default bg-success-soft text-success-ink'
                : allDone
                  ? 'bg-brand text-white hover:brightness-105'
                  : 'cursor-not-allowed bg-track text-faint'
            }`}
          >
            {today.completed ? (
              <>
                <IconCheck />
                {t('workoutplan.doneCta')}
              </>
            ) : allDone ? (
              <>
                <IconFlame />
                {finishing ? t('common.saving') : t('workoutplan.finishCta')}
              </>
            ) : (
              <>{t('workoutplan.remainingCta', { n: total - done })}</>
            )}
          </button>
        </>
      )}
    </div>
  )
}

/* ---------- helpers ---------- */

function goalLabel(t: (k: string) => string, goal: string): string {
  const known = ['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN', 'IMPROVE_FITNESS']
  return known.includes(goal) ? t(`profile.goalLabel.${goal}`).toLowerCase() : goal.toLowerCase()
}

function apiMessage(err: unknown): string | null {
  return err instanceof AxiosError ? ((err.response?.data?.message as string | undefined) ?? null) : null
}

/* ---------- ícones (SVG preenchidos) ---------- */

function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[15px] w-[15px] fill-current ${className}`}>
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  )
}

function IconSpark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <path d="M12 2l1.9 4.6L18.5 8 14 9.8 12.4 14.5 10.6 9.9 6 8.4l4.6-1.7zM6 14l.9 2.3L9 17l-2.1.9L6 20l-.9-2.1L3 17l2.1-.7zm12 1 .7 1.8L20 18l-1.3.6-.7 1.6-.7-1.6L16 18l1.3-.7z" />
    </svg>
  )
}

function IconFlame({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] fill-current ${className}`}>
      <path d="M13 2c.5 3-1.5 4.4-2.8 5.8C9 9 8 10.2 8 12a4 4 0 002 3.5C9.4 14.7 9.4 13.6 10 13c0 2 1.4 2.7 2.2 3.4.9.8 1.3 1.6 1.3 2.6a3.5 3.5 0 003-3.5c0-2.4-1.4-4-2.6-5.4C12.6 8.6 12 7.4 13 2z" />
    </svg>
  )
}

function IconRest({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm-1 3a1 1 0 012 0v4.6l3.3 2a1 1 0 01-1 1.7l-3.8-2.3a1 1 0 01-.5-.9z" />
    </svg>
  )
}
