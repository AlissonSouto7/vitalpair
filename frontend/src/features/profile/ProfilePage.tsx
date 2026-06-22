import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { getProfile, updateProfile } from '../../api/profile'
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
    if (!sex || !goal || !activityLevel) return
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

  if (loading) return <p className="text-slate-500">Carregando...</p>

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-bold text-slate-800">Seu perfil</h1>
      <p className="mb-6 text-sm text-slate-500">
        Preencha para calcularmos automaticamente sua meta de calorias e macros.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <Field label="Nome">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Data de nascimento">
          <input
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Sexo">
          <select required value={sex} onChange={(e) => setSex(e.target.value as Sex)} className={inputClass}>
            <option value="" disabled>
              Selecione
            </option>
            {SEX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Altura (cm)">
            <input
              type="number"
              required
              min={50}
              max={300}
              step="0.1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Peso (kg)">
            <input
              type="number"
              required
              min={20}
              max={500}
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Objetivo">
          <select required value={goal} onChange={(e) => setGoal(e.target.value as Goal)} className={inputClass}>
            <option value="" disabled>
              Selecione
            </option>
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nível de atividade">
          <select
            required
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
            className={inputClass}
          >
            <option value="" disabled>
              Selecione
            </option>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </form>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}
