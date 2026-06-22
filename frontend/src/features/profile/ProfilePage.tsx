import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { getProfile, updateProfile } from '../../api/profile'
import { Select } from '../../components/ui/Select'
import type { ActivityLevel, Goal, Sex } from '../../types/profile'

const SEX_VALUES: Sex[] = ['MALE', 'FEMALE', 'OTHER']
const GOAL_VALUES: Goal[] = ['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN', 'IMPROVE_FITNESS']
const LEVEL_VALUES: ActivityLevel[] = ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']

export function ProfilePage() {
  const { t } = useTranslation()
  const sexOptions = SEX_VALUES.map((v) => ({ value: v, label: t(`profile.sexLabel.${v}`) }))
  const goalOptions = GOAL_VALUES.map((v) => ({ value: v, label: t(`profile.goalLabel.${v}`) }))
  const levelOptions = LEVEL_VALUES.map((v) => ({ value: v, label: t(`profile.levelLabel.${v}`) }))
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState<Sex | ''>('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [goal, setGoal] = useState<Goal | ''>('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProfile()
      .then((profile) => {
        setName(profile.name ?? '')
        setBirthDate(profile.birthDate ?? '')
        setSex(profile.sex ?? '')
        setHeightCm(profile.heightCm != null ? String(profile.heightCm) : '')
        setWeightKg(profile.weightKg != null ? String(profile.weightKg) : '')
        setGoal(profile.goal ?? '')
        setActivityLevel(profile.activityLevel ?? '')
      })
      .catch(() => setError(t('profile.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!sex || !goal || !activityLevel) {
      setError(t('profile.requiredSelects'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateProfile({
        name,
        birthDate,
        sex,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        goal,
        activityLevel,
      })
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      setError(message ?? t('profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted">{t('common.loading')}</p>

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-extrabold">{t('profile.title')}</h1>
      <p className="mb-5 mt-1 text-sm text-faint">{t('profile.subtitle')}</p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <Field label={t('profile.name')}>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>

        <Field label={t('profile.birthDate')}>
          <input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="input" />
        </Field>

        <Field label={t('profile.sex')}>
          <Select value={sex} onChange={setSex} options={sexOptions} placeholder={t('common.select')} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('profile.height')}>
            <Unit unit="cm">
              <input
                type="number"
                required
                min={50}
                max={300}
                step="any"
                placeholder="ex: 172"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="input pr-10"
              />
            </Unit>
          </Field>
          <Field label={t('profile.weight')}>
            <Unit unit="kg">
              <input
                type="number"
                required
                min={20}
                max={500}
                step="0.1"
                placeholder="ex: 70"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="input pr-10"
              />
            </Unit>
          </Field>
        </div>

        <Field label={t('profile.goal')}>
          <Select value={goal} onChange={setGoal} options={goalOptions} placeholder={t('common.select')} />
        </Field>

        <Field label={t('profile.activityLevel')}>
          <Select value={activityLevel} onChange={setActivityLevel} options={levelOptions} placeholder={t('common.select')} />
        </Field>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? t('common.saving') : t('profile.save')}
        </button>
      </form>
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
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint">
        {unit}
      </span>
    </div>
  )
}
