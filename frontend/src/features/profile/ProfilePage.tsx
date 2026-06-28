import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AxiosError } from 'axios'
import { getProfile, getTdee, updateProfile } from '../../api/profile'
import { getProgress, recordWeight } from '../../api/progress'
import { getSeason } from '../../api/season'
import { Select } from '../../components/ui/Select'
import { DateField } from '../../components/ui/DateField'
import { Broto } from '../../components/brand/Broto'
import type { ActivityLevel, Goal, UserProfile, Sex, Tdee } from '../../types/profile'
import type { WeightPoint } from '../../types/progress'

type TFn = (key: string, opts?: Record<string, unknown>) => string

const SEX_VALUES: Sex[] = ['MALE', 'FEMALE', 'OTHER']
const GOAL_VALUES: Goal[] = ['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN', 'IMPROVE_FITNESS']
const LEVEL_VALUES: ActivityLevel[] = ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']

const goalLabel = (t: TFn, g: Goal) => t(`profile.goalLabel.${g}`)
const sexLabel = (t: TFn, s: Sex) => t(`profile.sexLabel.${s}`)
const activityLabel = (t: TFn, l: ActivityLevel) => t(`profile.levelLabel.${l}`)

// Curva de nível do Broto: pontos acumulados pra alcançar cada nível (1..8), depois +1500 por nível.
function levelInfo(points: number) {
  const T = [0, 150, 400, 800, 1400, 2200, 3200, 4500]
  const STEP = 1500
  const thresholdFor = (lvl: number) => (lvl <= T.length ? T[lvl - 1] : T[T.length - 1] + (lvl - T.length) * STEP)
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tdee, setTdee] = useState<Tdee | null>(null)
  const [weights, setWeights] = useState<WeightPoint[]>([])
  const [lifetimePoints, setLifetimePoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [changingGoal, setChangingGoal] = useState(false)

  const load = useCallback(async () => {
    const [p, prog, season] = await Promise.all([
      getProfile(),
      getProgress().catch(() => null),
      getSeason().catch(() => null),
    ])
    setProfile(p)
    if (prog) setWeights(prog.weights)
    if (season) {
      const fromHistory = season.history.reduce((acc, h) => acc + h.you, 0)
      setLifetimePoints(season.you.score + fromHistory)
    }
    getTdee()
      .then(setTdee)
      .catch(() => {
        if (p.dailyCalorieTarget != null) {
          setTdee({
            bmr: 0,
            tdee: 0,
            dailyCalorieTarget: p.dailyCalorieTarget,
            proteinTargetG: p.proteinTargetG ?? 0,
            carbTargetG: p.carbTargetG ?? 0,
            fatTargetG: p.fatTargetG ?? 0,
          })
        }
      })
  }, [])

  useEffect(() => {
    load()
      .catch(() => setError(t('profile.loadError')))
      .finally(() => setLoading(false))
  }, [load, t])

  if (loading) return <p className="text-muted">{t('common.loading')}</p>
  if (error) return <p className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">{error}</p>
  if (!profile) return null

  const firstName = (profile.name?.trim().split(' ')[0] || t('profile.fallbackName')).trim()
  const lvl = levelInfo(lifetimePoints)
  const brotoLevel = Math.min(lvl.level, 8) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weightKg : profile.weightKg ?? null
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
      await load()
    } catch {
      setError(t('profile.goalChangeError'))
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">{t('profile.title')}</h1>
        <p className="mt-1 text-sm font-semibold text-muted">{t('profile.subtitle')}</p>
      </header>

      {/* Broto + nível */}
      <section className="card flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Broto who="you" expr="happy" level={brotoLevel} size={120} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-brand-ink">{t('profile.yourCreature')}</p>
          <p className="font-display text-2xl font-semibold text-ink">
            {t('profile.levelName', { level: lvl.level, name: firstName })}
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${lvl.pct}%` }} />
          </div>
          <p className="mt-1.5 text-[12.5px] font-semibold text-muted">
            {brotoLevel >= 8 && lvl.level >= 8
              ? t('profile.creaturePeak', { points: lvl.pointsToNext, next: lvl.level + 1 })
              : t('profile.creatureNext', { points: lvl.pointsToNext, next: lvl.level + 1 })}
          </p>
        </div>
      </section>

      {/* Peso */}
      <WeightCard weights={weights} currentWeight={currentWeight} onLogged={load} t={t} />

      {/* Objetivo */}
      <section className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">{t('profile.goal')}</p>
            <p className="font-display text-lg font-semibold text-ink">
              {profile.goal ? goalLabel(t, profile.goal) : t('profile.noGoal')}
            </p>
            {targetKcal != null && (
              <p className="text-[13px] font-semibold text-muted">{t('profile.dailyTarget', { kcal: targetKcal.toLocaleString('pt-BR') })}</p>
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
                onClick={() => changeGoal(g)}
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
            <h2 className="font-display text-lg font-semibold text-ink">{t('profile.todayMacros')}</h2>
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
            <span className="block font-display text-base font-semibold text-ink">{t('profile.yourData')}</span>
            <span className="block text-[13px] font-semibold text-muted">
              {profile.heightCm ? `${profile.heightCm} cm` : t('profile.heightFallback')} ·{' '}
              {profile.sex ? sexLabel(t, profile.sex) : t('profile.sexFallback')} ·{' '}
              {profile.activityLevel ? activityLabel(t, profile.activityLevel) : t('profile.activityFallback')}
            </span>
          </span>
          <span className="text-[13px] font-extrabold text-brand-ink">{editing ? t('profile.close') : t('profile.edit')}</span>
        </button>

        {editing && <EditForm profile={profile} onSaved={() => { setEditing(false); load() }} onError={setError} t={t} />}
      </section>

      {error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
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
  const [valor, setValor] = useState('')
  const [salvando, setSalvando] = useState(false)
  const delta = weights.length >= 2 ? weights[weights.length - 1].weightKg - weights[0].weightKg : 0
  const perdeu = delta < 0

  async function registrar(e: FormEvent) {
    e.preventDefault()
    const kg = Number(valor.replace(',', '.'))
    if (!kg || kg <= 0) return
    setSalvando(true)
    try {
      await recordWeight(kg)
      setValor('')
      await onLogged()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">{t('profile.todayWeight')}</p>
          <p className="font-display text-[32px] font-semibold leading-none text-ink">
            {currentWeight != null ? `${fmtKg(currentWeight)} kg` : '--'}
          </p>
          {Math.abs(delta) >= 0.05 && (
            <p className={`mt-1 text-[13px] font-extrabold ${perdeu ? 'text-success-ink' : 'text-brand-ink'}`}>
              {perdeu
                ? t('profile.weightDown', { kg: fmtKg(Math.abs(delta)) })
                : t('profile.weightUp', { kg: fmtKg(Math.abs(delta)) })}
            </p>
          )}
        </div>
        {weights.length >= 2 && <Sparkline weights={weights} />}
      </div>

      <form onSubmit={registrar} className="mt-4 flex items-end gap-2 border-t border-hair pt-4">
        <div className="flex-1">
          <label className="label">{t('profile.updateWeight')}</label>
          <input
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            placeholder={t('profile.weightPlaceholder')}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="input"
          />
        </div>
        <button type="submit" disabled={salvando || !valor} className="btn-primary disabled:opacity-60">
          {salvando ? '...' : t('common.save')}
        </button>
      </form>
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
    .map((v, i) => `${((i / (values.length - 1)) * W).toFixed(1)},${(H - ((v - min) / span) * (H - 6) - 3).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-11 w-[120px] shrink-0" aria-hidden="true">
      <polyline points={pts} fill="none" className="stroke-brand" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- formulário de edição (recolhido) ---------- */

function EditForm({
  profile,
  onSaved,
  onError,
  t,
}: {
  profile: UserProfile
  onSaved: () => void
  onError: (m: string) => void
  t: TFn
}) {
  const [name, setName] = useState(profile.name ?? '')
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? '')
  const [sex, setSex] = useState<Sex | ''>(profile.sex ?? '')
  const [heightCm, setHeightCm] = useState(profile.heightCm != null ? String(profile.heightCm) : '')
  const [weightKg, setWeightKg] = useState(profile.weightKg != null ? String(profile.weightKg) : '')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>(profile.activityLevel ?? '')
  const [saving, setSaving] = useState(false)

  const sexOptions = SEX_VALUES.map((v) => ({ value: v, label: sexLabel(t, v) }))
  const levelOptions = LEVEL_VALUES.map((v) => ({ value: v, label: activityLabel(t, v) }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!sex || !activityLevel) {
      onError(t('profile.requiredSelects'))
      return
    }
    setSaving(true)
    try {
      await updateProfile({
        name,
        birthDate,
        sex,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        goal: profile.goal as Goal,
        activityLevel,
      })
      onSaved()
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      onError(message ?? t('profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 border-t border-hair pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('profile.name')}>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>
        <Field label={t('profile.birthDate')}>
          <DateField value={birthDate} onChange={setBirthDate} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t('profile.height')}>
          <Unit unit="cm">
            <input type="number" required min={50} max={300} step="any" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="input pr-10" />
          </Unit>
        </Field>
        <Field label={t('profile.weight')}>
          <Unit unit="kg">
            <input type="number" required min={20} max={500} step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="input pr-10" />
          </Unit>
        </Field>
        <Field label={t('profile.sex')}>
          <Select value={sex} onChange={setSex} options={sexOptions} placeholder={t('profile.chooseHint')} />
        </Field>
      </div>
      <Field label={t('profile.activityLevel')}>
        <Select value={activityLevel} onChange={setActivityLevel} options={levelOptions} placeholder={t('profile.chooseHint')} />
      </Field>
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? t('profile.saving') : t('profile.saveData')}
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
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand text-white' : 'bg-brand-soft text-brand'}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-ink">{label}</span>
        <span className="block truncate text-xs font-semibold text-muted">{hint}</span>
      </span>
    </button>
  )
}

function MacroCell({ label, grams, tone }: { label: string; grams: number; tone: 'brand' | 'carb' | 'success' }) {
  const color = tone === 'brand' ? 'text-brand-ink' : tone === 'carb' ? 'text-carb-ink' : 'text-success-ink'
  return (
    <div className="bg-surface px-3 py-4 text-center">
      <div className={`font-display text-2xl font-semibold ${color}`}>{Math.round(grams)}g</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function Unit({ unit, children }: { unit: string; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-faint">{unit}</span>
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
