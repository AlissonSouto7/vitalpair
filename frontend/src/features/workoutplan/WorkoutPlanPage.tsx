import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { completeWorkout, generateWorkoutPlan, toggleExercise } from '../../api/aiplan'
import type { WorkoutToday } from '../../types/aiplan'

import { IconCheck, IconFlame, IconRest, IconSpark } from './parts'
import { workoutPlanQueries } from './queries'
import { goalLabel } from './text'

import { getApiErrorMessage } from '@/shared/api/errors'

/**
 * Plano de treino — gerado pela IA no objetivo do usuário (dados reais).
 * Mostra o treino de HOJE; marcar como feito registra a atividade (e os pontos vêm por lá).
 */
export function WorkoutPlanPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const key = workoutPlanQueries.today().queryKey
  const todayQuery = useQuery(workoutPlanQueries.today())
  const today = todayQuery.data ?? null

  /** Writes the server's answer straight into the cache: it is the whole screen's state. */
  function replace(next: WorkoutToday | null) {
    queryClient.setQueryData(key, next)
  }

  const generateMutation = useMutation({
    mutationFn: generateWorkoutPlan,
    onSuccess: replace,
    onError: (err) => setError(getApiErrorMessage(err, t('workoutplan.generateError'))),
  })

  const toggleMutation = useMutation({
    mutationFn: toggleExercise,
    // Ticking a box has to feel instant, so the box flips before the request goes. The
    // snapshot is what puts it back if the request fails, instead of leaving a tick the
    // server never recorded.
    onMutate: (id: string) => {
      const previous = queryClient.getQueryData<WorkoutToday | null>(key)
      if (previous) {
        const optimistic: WorkoutToday = {
          ...previous,
          exercises: previous.exercises.map((e) => (e.id === id ? { ...e, done: !e.done } : e)),
        }
        queryClient.setQueryData(key, optimistic)
      }
      return { previous }
    },
    onSuccess: replace,
    onError: (_err, _id, context) => {
      setError(t('workoutplan.toggleError'))
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
  })

  const finishMutation = useMutation({
    mutationFn: completeWorkout,
    onSuccess: replace,
    onError: (err) => setError(getApiErrorMessage(err, t('workoutplan.completeError'))),
  })

  const generating = generateMutation.isPending
  const finishing = finishMutation.isPending

  function generate() {
    setError(null)
    generateMutation.mutate()
  }

  function toggle(id: string) {
    if (!today || today.completed) return
    toggleMutation.mutate(id)
  }

  function finish() {
    setError(null)
    finishMutation.mutate()
  }

  if (todayQuery.isPending) return <p className="font-bold text-muted">{t('common.loading')}</p>
  if (todayQuery.isError)
    return (
      <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">
        {t('workoutplan.loadError')}
      </p>
    )

  const total = today?.exercises.length ?? 0
  const done = today?.exercises.filter((e) => e.done).length ?? 0
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  return (
    <div className="space-y-5 pb-2">
      {/* cabeçalho */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {t('workoutplan.title')}
          </h1>
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
            onClick={() => void generate()}
            disabled={generating}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-brand/40 bg-brand-soft px-3.5 py-2 text-[13px] font-extrabold text-brand-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconSpark className="h-4 w-4" />
            {generating ? t('workoutplan.generating') : t('workoutplan.regenerate')}
          </button>
        )}
      </header>

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {!today ? (
        /* Sem plano: estado vazio + gerar */
        <section className="card flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
            <IconSpark className="h-8 w-8 text-brand" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              {t('workoutplan.emptyTitle')}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm font-semibold text-muted">
              {t('workoutplan.emptyText')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void generate()}
            disabled={generating}
            className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconSpark className="h-[18px] w-[18px]" />
            {generating ? t('workoutplan.generating') : t('workoutplan.generate')}
          </button>
          {generating && (
            <p className="text-xs font-bold text-muted">{t('workoutplan.generatingHint')}</p>
          )}
        </section>
      ) : today.rest ? (
        /* Dia de descanso */
        <section className="card flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft">
            <IconRest className="h-8 w-8 text-success" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              {t('workoutplan.restTitle')}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm font-semibold text-muted">
              {t('workoutplan.restText')}
            </p>
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
                  onClick={() => void toggle(ex.id)}
                  disabled={today.completed}
                  aria-pressed={ex.done}
                  aria-label={
                    ex.done
                      ? t('workoutplan.markDone', { name: ex.name })
                      : t('workoutplan.markUndone', { name: ex.name })
                  }
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
            onClick={() => void finish()}
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
