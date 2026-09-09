import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EditForm } from './EditForm'
import { GOAL_ICON } from './goalIcons'
import { IconTarget } from './icons'
import { GoalCard, MacroCell, WeightCard } from './parts'
import { activityLabel, GOAL_VALUES, goalLabel, sexLabel } from './profileForm'
import { profileQueries } from './queries'

import { updateProfile } from '@/api/profile'
import { Broto } from '@/components/brand/Broto'
import type { ActivityLevel, Goal, Sex, Tdee } from '@/types/profile'
import type { WeightPoint } from '@/types/progress'

// Curva de nível do Broto: pontos acumulados pra alcançar cada nível (1..8), depois +1500 por nível.
function levelInfo(points: number) {
  const T = [0, 150, 400, 800, 1400, 2200, 3200, 4500]
  const STEP = 1500
  const thresholdFor = (lvl: number) =>
    lvl <= T.length ? T[lvl - 1] : T[T.length - 1] + (lvl - T.length) * STEP
  let level = 1
  while (level < 99 && points >= thresholdFor(level + 1)) level++
  const cur = thresholdFor(level)
  const next = thresholdFor(level + 1)
  const span = next - cur || 1
  return {
    level,
    pointsToNext: Math.max(0, next - points),
    pct: Math.min(100, Math.max(0, Math.round(((points - cur) / span) * 100))),
  }
}

export function ProfilePage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [changingGoal, setChangingGoal] = useState(false)

  const profileQuery = useQuery(profileQueries.profile())
  const tdeeQuery = useQuery(profileQueries.tdee())
  const progressQuery = useQuery(profileQueries.progress())
  const seasonQuery = useQuery(profileQueries.season())

  const profile = profileQuery.data ?? null
  const weights: WeightPoint[] = progressQuery.data?.weights ?? []

  /** Everything the screen reads again after a write. */
  async function reload() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['progress'] }),
      queryClient.invalidateQueries({ queryKey: ['season'] }),
      // The dashboard shows the same targets.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
  }

  // The endpoint refuses an incomplete profile with a 422, which is the normal state of a
  // new account. What the profile already carries is the fallback, so the macros card
  // shows numbers instead of vanishing on the first visit.
  const tdee: Tdee | null =
    tdeeQuery.data ??
    (profile?.dailyCalorieTarget != null
      ? {
          bmr: 0,
          tdee: 0,
          dailyCalorieTarget: profile.dailyCalorieTarget,
          proteinTargetG: profile.proteinTargetG ?? 0,
          carbTargetG: profile.carbTargetG ?? 0,
          fatTargetG: profile.fatTargetG ?? 0,
        }
      : null)

  const lifetimePoints = seasonQuery.data
    ? seasonQuery.data.you.score + seasonQuery.data.history.reduce((acc, h) => acc + h.you, 0)
    : 0

  if (profileQuery.isPending) return <p className="text-muted">{t('common.loading')}</p>
  // Only the profile is required. Progress and season failing is a thinner screen, not a
  // broken one, which is why they are not part of this condition.
  if (profileQuery.isError || !profile)
    return (
      <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">
        {t('profile.loadError')}
      </p>
    )

  const firstName = (profile.name?.trim().split(' ')[0] || t('profile.fallbackName')).trim()
  const lvl = levelInfo(lifetimePoints)
  const brotoLevel = Math.min(lvl.level, 8) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  const currentWeight =
    weights.length > 0 ? weights[weights.length - 1].weightKg : (profile.weightKg ?? null)
  const targetKcal = tdee?.dailyCalorieTarget ?? profile.dailyCalorieTarget ?? null

  async function changeGoal(g: Goal) {
    if (!profile) return
    try {
      await updateProfile({
        name: profile.name ?? '',
        birthDate: profile.birthDate ?? '',
        sex: profile.sex as Sex,
        heightCm: Number(profile.heightCm),
        weightKg: Number(currentWeight ?? profile.weightKg),
        goal: g,
        activityLevel: profile.activityLevel as ActivityLevel,
      })
      setChangingGoal(false)
      await reload()
    } catch {
      setError(t('profile.goalChangeError'))
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">
          {t('profile.title')}
        </h1>
        <p className="mt-1 text-sm font-semibold text-muted">{t('profile.subtitle')}</p>
      </header>

      {/* Broto + nível */}
      <section className="card flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Broto who="you" expr="happy" level={brotoLevel} size={120} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-brand-ink">
            {t('profile.yourCreature')}
          </p>
          <p className="font-display text-2xl font-semibold text-ink">
            {t('profile.levelName', { level: lvl.level, name: firstName })}
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-track">
            <div
              className="h-full rounded-full bg-brand transition-[width]"
              style={{ width: `${lvl.pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[12.5px] font-semibold text-muted">
            {brotoLevel >= 8 && lvl.level >= 8
              ? t('profile.creaturePeak', { points: lvl.pointsToNext, next: lvl.level + 1 })
              : t('profile.creatureNext', { points: lvl.pointsToNext, next: lvl.level + 1 })}
          </p>
        </div>
      </section>

      {/* Peso */}
      <WeightCard weights={weights} currentWeight={currentWeight} onLogged={reload} t={t} />

      {/* Objetivo */}
      <section className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
              {t('profile.goal')}
            </p>
            <p className="font-display text-lg font-semibold text-ink">
              {profile.goal ? goalLabel(t, profile.goal) : t('profile.noGoal')}
            </p>
            {targetKcal != null && (
              <p className="text-[13px] font-semibold text-muted">
                {t('profile.dailyTarget', { kcal: targetKcal.toLocaleString('pt-BR') })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setChangingGoal((v) => !v)}
            className="shrink-0 rounded-xl bg-brand-soft px-3.5 py-2 text-[13px] font-extrabold text-brand-ink transition hover:brightness-105"
          >
            {changingGoal ? t('profile.close') : t('profile.changeGoal')}
          </button>
        </div>

        {changingGoal && (
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {GOAL_VALUES.map((g) => (
              <GoalCard
                key={g}
                active={profile.goal === g}
                label={goalLabel(t, g)}
                hint={t(`profile.goalHint.${g}`)}
                onClick={() => void changeGoal(g)}
                icon={GOAL_ICON[g]}
              />
            ))}
          </div>
        )}
      </section>

      {/* Macros do dia */}
      {tdee && (
        <section className="card">
          <div className="mb-4 flex items-center gap-2">
            <IconTarget className="h-5 w-5 text-success" />
            <h2 className="font-display text-lg font-semibold text-ink">
              {t('profile.todayMacros')}
            </h2>
          </div>
          <div className="grid grid-cols-3 divide-x divide-hair overflow-hidden rounded-xl border border-hair">
            <MacroCell label={t('profile.macroProtein')} grams={tdee.proteinTargetG} tone="brand" />
            <MacroCell label={t('profile.macroCarb')} grams={tdee.carbTargetG} tone="carb" />
            <MacroCell label={t('profile.macroFat')} grams={tdee.fatTargetG} tone="success" />
          </div>
        </section>
      )}

      {/* Editar dados completos (recolhido) */}
      <section className="card">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span>
            <span className="block font-display text-base font-semibold text-ink">
              {t('profile.yourData')}
            </span>
            <span className="block text-[13px] font-semibold text-muted">
              {profile.heightCm ? `${profile.heightCm} cm` : t('profile.heightFallback')} ·{' '}
              {profile.sex ? sexLabel(t, profile.sex) : t('profile.sexFallback')} ·{' '}
              {profile.activityLevel
                ? activityLabel(t, profile.activityLevel)
                : t('profile.activityFallback')}
            </span>
          </span>
          <span className="text-[13px] font-extrabold text-brand-ink">
            {editing ? t('profile.close') : t('profile.edit')}
          </span>
        </button>

        {editing && (
          <EditForm
            profile={profile}
            onSaved={() => {
              setEditing(false)
              void reload()
            }}
            t={t}
          />
        )}
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
        >
          {error}
        </p>
      )}
    </div>
  )
}

/* ---------- card de peso ---------- */
