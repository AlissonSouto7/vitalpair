import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { getActivities, getActivitySummary, logActivity } from '../../api/activity'
import type { ActivityLog, ActivitySource, ActivitySummary, ActivityType } from '../../types/activity'
import { Select } from '../../components/ui/Select'

const TYPE_VALUES: ActivityType[] = ['STEPS', 'RUN', 'WALK', 'CYCLE', 'WORKOUT', 'OTHER']
const SOURCE_VALUES: ActivitySource[] = ['MANUAL', 'WEWARD', 'GOOGLE_FIT', 'STRAVA', 'GARMIN', 'APPLE_HEALTH']

const toNumber = (v: string) => (v.trim() === '' ? undefined : Number(v))

export function ActivityPage() {
  const { t } = useTranslation()
  const typeOptions = TYPE_VALUES.map((v) => ({ value: v, label: t(`activity.typeLabel.${v}`) }))
  const sourceOptions = SOURCE_VALUES.map((v) => ({ value: v, label: t(`activity.sourceLabel.${v}`) }))
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
    refresh().catch(() => setError(t('activity.loadError')))
  }, [refresh, t])

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
      setError(message ?? t('activity.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{t('activity.title')}</h1>

      {summary && (
        <div className="card text-sm">
          <span className="text-xl font-extrabold text-warn">{summary.totalCaloriesBurned}</span>
          <span className="text-faint"> {t('activity.summary', { steps: summary.totalSteps, count: summary.activityCount })}</span>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="card space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">{t('activity.type')}</label>
            <Select value={activityType} onChange={setActivityType} options={typeOptions} />
          </div>
          <Num label={t('activity.steps')} value={steps} onChange={setSteps} />
          <Num label={t('activity.calories')} value={caloriesBurned} onChange={setCaloriesBurned} />
          <Num label={t('activity.distance')} value={distanceKm} onChange={setDistanceKm} />
          <Num label={t('activity.duration')} value={durationMinutes} onChange={setDurationMinutes} />
          <div>
            <label className="label">{t('activity.source')}</label>
            <Select value={source} onChange={setSource} options={sourceOptions} />
          </div>
        </div>
        <p className="text-xs text-faint">{t('activity.autoEstimate')}</p>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? t('common.saving') : t('activity.register')}
        </button>
      </form>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">{t('activity.today')}</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-faint">{t('activity.empty')}</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface/70">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-ink">{t(`activity.typeLabel.${log.activityType}`)}</p>
                  <p className="text-xs text-faint">
                    {log.steps != null ? `${log.steps} ${t('activity.steps').toLowerCase()} · ` : ''}
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
