import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import { getActivities, getActivitySummary, logActivity } from '../../api/activity'
import type { ActivityLog, ActivitySource, ActivitySummary, ActivityType } from '../../types/activity'
import { Select } from '../../components/ui/Select'

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'STEPS', label: 'Passos' },
  { value: 'RUN', label: 'Corrida' },
  { value: 'WALK', label: 'Caminhada' },
  { value: 'CYCLE', label: 'Pedalada' },
  { value: 'WORKOUT', label: 'Treino' },
  { value: 'OTHER', label: 'Outro' },
]

const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label])) as Record<ActivityType, string>

const SOURCE_OPTIONS: { value: ActivitySource; label: string }[] = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'WEWARD', label: 'WeWard' },
  { value: 'GOOGLE_FIT', label: 'Google Fit' },
  { value: 'STRAVA', label: 'Strava' },
  { value: 'GARMIN', label: 'Garmin' },
  { value: 'APPLE_HEALTH', label: 'Apple Health' },
]

const toNumber = (v: string) => (v.trim() === '' ? undefined : Number(v))

export function ActivityPage() {
  const [activityType, setActivityType] = useState<ActivityType>('STEPS')
  const [steps, setSteps] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [source, setSource] = useState<ActivitySource>('MANUAL')
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [summary, setSummary] = useState<ActivitySummary | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [logsData, summaryData] = await Promise.all([getActivities(), getActivitySummary()])
    setLogs(logsData)
    setSummary(summaryData)
  }, [])

  useEffect(() => {
    refresh().catch(() => setError('Não foi possível carregar as atividades.'))
  }, [refresh])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await logActivity({
        activityType,
        steps: toNumber(steps),
        caloriesBurned: toNumber(caloriesBurned),
        distanceKm: toNumber(distanceKm),
        durationMinutes: toNumber(durationMinutes),
        source,
      })
      setSteps('')
      setCaloriesBurned('')
      setDistanceKm('')
      setDurationMinutes('')
      await refresh()
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      setError(message ?? 'Não foi possível registrar a atividade.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Atividade física</h1>

      {summary && (
        <div className="card text-sm">
          <span className="text-xl font-extrabold text-warn">{summary.totalCaloriesBurned}</span>
          <span className="text-faint"> kcal gastas · {summary.totalSteps} passos · {summary.activityCount} atividade(s)</span>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="card space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Tipo</label>
            <Select value={activityType} onChange={setActivityType} options={TYPE_OPTIONS} />
          </div>
          <Num label="Passos" value={steps} onChange={setSteps} />
          <Num label="Calorias (kcal)" value={caloriesBurned} onChange={setCaloriesBurned} />
          <Num label="Distância (km)" value={distanceKm} onChange={setDistanceKm} />
          <Num label="Duração (min)" value={durationMinutes} onChange={setDurationMinutes} />
          <div>
            <label className="label">Origem</label>
            <Select value={source} onChange={setSource} options={SOURCE_OPTIONS} />
          </div>
        </div>
        <p className="text-xs text-faint">Deixe as calorias vazias para estimar automaticamente a partir dos passos.</p>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Registrar atividade'}
        </button>
      </form>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Hoje</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-faint">Nenhuma atividade registrada hoje.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface/70">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-ink">{TYPE_LABEL[log.activityType]}</p>
                  <p className="text-xs text-faint">
                    {log.steps != null ? `${log.steps} passos · ` : ''}
                    {log.durationMinutes != null ? `${log.durationMinutes} min · ` : ''}
                    {log.caloriesBurned} kcal
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Num({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" min={0} step="0.1" value={value} onChange={(e) => onChange(e.target.value)} className="input px-2 py-1.5 text-sm" />
    </div>
  )
}
