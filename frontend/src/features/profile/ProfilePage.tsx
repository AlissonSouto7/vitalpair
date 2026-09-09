import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { profileQueries } from './queries'

import { updateProfile } from '@/api/profile'
import { Broto } from '@/components/brand/Broto'
import { DateField } from '@/components/ui/DateField'
import { Select } from '@/components/ui/Select'
import { WeightForm } from '@/features/progress/WeightForm'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Field } from '@/shared/ui/form/Field'
import { FormError } from '@/shared/ui/form/FormError'
import { NumberField } from '@/shared/ui/form/NumberField'
import { TextField } from '@/shared/ui/form/TextField'
import type { ActivityLevel, Goal, UserProfile, Sex, Tdee } from '@/types/profile'
import type { WeightPoint } from '@/types/progress'

type TFn = (key: string, opts?: Record<string, unknown>) => string

const SEX_VALUES = ['MALE', 'FEMALE', 'OTHER'] as const satisfies readonly Sex[]
const GOAL_VALUES: Goal[] = ['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN', 'IMPROVE_FITNESS']
const LEVEL_VALUES = [
  'SEDENTARY',
  'LIGHT',
  'MODERATE',
  'ACTIVE',
  'VERY_ACTIVE',
] as const satisfies readonly ActivityLevel[]

const goalLabel = (t: TFn, g: Goal) => t(`profile.goalLabel.${g}`)
const sexLabel = (t: TFn, s: Sex) => t(`profile.sexLabel.${s}`)
const activityLabel = (t: TFn, l: ActivityLevel) => t(`profile.levelLabel.${l}`)

/**
 * Mirrors the backend's UpdateProfileRequest: the same bounds it enforces, so a person
 * hears about a slip here rather than after a round trip. The date field emits an empty
 * string until all three parts are chosen; the server's @Past is restated as "before
 * today".
 */
const editSchema = z.object({
  name: z.string().trim().min(1).max(100),
  birthDate: z
    .string()
    .refine((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d < new Date().toISOString().slice(0, 10)),
  sex: z.enum(SEX_VALUES),
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(20).max(500),
  activityLevel: z.enum(LEVEL_VALUES),
})

type EditValues = z.infer<typeof editSchema>

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

function WeightCard({
  weights,
  currentWeight,
  onLogged,
  t,
}: {
  weights: WeightPoint[]
  currentWeight: number | null
  onLogged: () => Promise<void>
  t: TFn
}) {
  const delta = weights.length >= 2 ? weights[weights.length - 1].weightKg - weights[0].weightKg : 0
  const perdeu = delta < 0

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
            {t('profile.todayWeight')}
          </p>
          <p className="font-display text-[32px] font-semibold leading-none text-ink">
            {currentWeight != null ? `${fmtKg(currentWeight)} kg` : '--'}
          </p>
          {Math.abs(delta) >= 0.05 && (
            <p
              className={`mt-1 text-[13px] font-extrabold ${perdeu ? 'text-success-ink' : 'text-brand-ink'}`}
            >
              {perdeu
                ? t('profile.weightDown', { kg: fmtKg(Math.abs(delta)) })
                : t('profile.weightUp', { kg: fmtKg(Math.abs(delta)) })}
            </p>
          )}
        </div>
        {weights.length >= 2 && <Sparkline weights={weights} />}
      </div>

      <WeightForm
        label={t('profile.updateWeight')}
        submitLabel={t('common.save')}
        placeholder={t('profile.weightPlaceholder')}
        onLogged={onLogged}
        className="mt-4 border-t border-hair pt-4"
      />
    </section>
  )
}

function Sparkline({ weights }: { weights: WeightPoint[] }) {
  const values = weights.slice(-8).map((w) => w.weightKg)
  const W = 120
  const H = 44
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map(
      (v, i) =>
        `${((i / (values.length - 1)) * W).toFixed(1)},${(H - ((v - min) / span) * (H - 6) - 3).toFixed(1)}`,
    )
    .join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-11 w-[120px] shrink-0" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        className="stroke-brand"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ---------- formulário de edição (recolhido) ---------- */

function EditForm({ profile, onSaved, t }: { profile: UserProfile; onSaved: () => void; t: TFn }) {
  const [error, setError] = useState<string | null>(null)

  const sexOptions = SEX_VALUES.map((v) => ({ value: v, label: sexLabel(t, v) }))
  const levelOptions = LEVEL_VALUES.map((v) => ({ value: v, label: activityLabel(t, v) }))

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    mode: 'onTouched',
    defaultValues: {
      name: profile.name,
      birthDate: profile.birthDate ?? '',
      sex: profile.sex ?? undefined,
      heightCm: profile.heightCm ?? undefined,
      weightKg: profile.weightKg ?? undefined,
      activityLevel: profile.activityLevel ?? undefined,
    },
  })

  async function onSubmit(values: EditValues) {
    setError(null)
    try {
      await updateProfile({ ...values, goal: profile.goal as Goal })
      onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err, t('profile.saveError')))
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      className="mt-4 space-y-4 border-t border-hair pt-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('profile.name')}
          type="text"
          autoComplete="name"
          error={errors.name && t('profile.nameRequired')}
          {...register('name')}
        />
        <Field
          label={t('profile.birthDate')}
          error={errors.birthDate && t('profile.birthDateInvalid')}
          labelsAGroup
        >
          {(field) => (
            <Controller
              name="birthDate"
              control={control}
              render={({ field: f }) => (
                // aria-invalid is not allowed on a group, so the date field gets the name
                // and the description only; the message linked through the description
                // says what is wrong.
                <DateField
                  labelId={field.labelId}
                  aria-describedby={field['aria-describedby']}
                  value={f.value}
                  onChange={f.onChange}
                />
              )}
            />
          )}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          label={t('profile.height')}
          unit="cm"
          min={50}
          max={300}
          step="any"
          error={errors.heightCm && t('profile.heightInvalid')}
          {...register('heightCm', { valueAsNumber: true })}
        />
        <NumberField
          label={t('profile.weight')}
          unit="kg"
          min={20}
          max={500}
          step="0.1"
          error={errors.weightKg && t('profile.weightInvalid')}
          {...register('weightKg', { valueAsNumber: true })}
        />
        <Field label={t('profile.sex')} error={errors.sex && t('profile.sexRequired')}>
          {(field) => (
            <Controller
              name="sex"
              control={control}
              render={({ field: f }) => (
                <Select
                  {...field}
                  value={f.value ?? ''}
                  onChange={f.onChange}
                  options={sexOptions}
                  placeholder={t('profile.chooseHint')}
                />
              )}
            />
          )}
        </Field>
      </div>
      <Field
        label={t('profile.activityLevel')}
        error={errors.activityLevel && t('profile.activityLevelRequired')}
      >
        {(field) => (
          <Controller
            name="activityLevel"
            control={control}
            render={({ field: f }) => (
              <Select
                {...field}
                value={f.value ?? ''}
                onChange={f.onChange}
                options={levelOptions}
                placeholder={t('profile.chooseHint')}
              />
            )}
          />
        )}
      </Field>
      <FormError message={error} />
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? t('profile.saving') : t('profile.saveData')}
      </button>
    </form>
  )
}

/* ---------- subcomponentes ---------- */

const GOAL_ICON: Record<Goal, ReactNode> = {
  LOSE_WEIGHT: <IconDown className="h-5 w-5" />,
  GAIN_MUSCLE: <IconMuscle className="h-5 w-5" />,
  MAINTAIN: <IconEqual className="h-5 w-5" />,
  IMPROVE_FITNESS: <IconSpark className="h-5 w-5" />,
}

function GoalCard({
  active,
  label,
  hint,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  hint: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
        active ? 'border-brand bg-brand-soft' : 'border-hair bg-surface hover:border-brand/50'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand text-white' : 'bg-brand-soft text-brand'}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-ink">{label}</span>
        <span className="block truncate text-xs font-semibold text-muted">{hint}</span>
      </span>
    </button>
  )
}

function MacroCell({
  label,
  grams,
  tone,
}: {
  label: string
  grams: number
  tone: 'brand' | 'carb' | 'success'
}) {
  const color =
    tone === 'brand' ? 'text-brand-ink' : tone === 'carb' ? 'text-carb-ink' : 'text-success-ink'
  return (
    <div className="bg-surface px-3 py-4 text-center">
      <div className={`font-display text-2xl font-semibold ${color}`}>{Math.round(grams)}g</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
    </div>
  )
}

function fmtKg(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/* ---------- ícones SVG preenchidos ---------- */

function IconTarget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3a9 9 0 109 9h-2a7 7 0 11-7-7zm0 4l5 5-5 5z" />
    </svg>
  )
}

function IconDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11 4h2v9.2l3.3-3.3 1.4 1.4L12 17 6.3 11.3l1.4-1.4L11 13.2z" />
    </svg>
  )
}

function IconMuscle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 11h2V9a1.5 1.5 0 013 0v6a1.5 1.5 0 01-3 0v-1H3zm18 0h-2V9a1.5 1.5 0 00-3 0v6a1.5 1.5 0 003 0v-1h2zM7.5 11h9v2h-9z" />
    </svg>
  )
}

function IconEqual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4 8h16v2.4H4zm0 5.6h16V16H4z" />
    </svg>
  )
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}
