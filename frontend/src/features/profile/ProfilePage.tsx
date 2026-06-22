import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { getProfile, updateProfile } from '../../api/profile'
import { Select } from '../../components/ui/Select'
import type { ActivityLevel, Goal, Sex } from '../../types/profile'

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
]

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'LOSE_WEIGHT', label: 'Perder peso' },
  { value: 'GAIN_MUSCLE', label: 'Ganhar massa' },
  { value: 'MAINTAIN', label: 'Manter peso' },
  { value: 'IMPROVE_FITNESS', label: 'Melhorar condicionamento' },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'SEDENTARY', label: 'Sedentário' },
  { value: 'LIGHT', label: 'Levemente ativo' },
  { value: 'MODERATE', label: 'Moderadamente ativo' },
  { value: 'ACTIVE', label: 'Muito ativo' },
  { value: 'VERY_ACTIVE', label: 'Extremamente ativo' },
]

export function ProfilePage() {
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
      .catch(() => setError('Não foi possível carregar o perfil.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!sex || !goal || !activityLevel) {
      setError('Selecione sexo, objetivo e nível de atividade.')
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
      setError(message ?? 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-400">Carregando...</p>

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-extrabold">Seu perfil</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        Preencha para liberar suas metas de calorias, macros e o placar.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <Field label="Nome">
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>

        <Field label="Data de nascimento">
          <input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="input" />
        </Field>

        <Field label="Sexo">
          <Select value={sex} onChange={setSex} options={SEX_OPTIONS} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Altura">
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
          <Field label="Peso">
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

        <Field label="Objetivo">
          <Select value={goal} onChange={setGoal} options={GOAL_OPTIONS} />
        </Field>

        <Field label="Nível de atividade">
          <Select value={activityLevel} onChange={setActivityLevel} options={ACTIVITY_OPTIONS} />
        </Field>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Salvando...' : 'Salvar perfil'}
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
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
        {unit}
      </span>
    </div>
  )
}
