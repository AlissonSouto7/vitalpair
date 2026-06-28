import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { getActivities, getActivitySummary, logActivity } from '../../api/activity'
import type { ActivityLog, ActivitySource, ActivitySummary, ActivityType } from '../../types/activity'
import { Select } from '../../components/ui/Select'
import { Points } from '../../components/ui/Badge'

const TYPE_VALUES: ActivityType[] = ['STEPS', 'RUN', 'WALK', 'CYCLE', 'WORKOUT', 'OTHER']
const SOURCE_VALUES: ActivitySource[] = ['MANUAL', 'WEWARD', 'GOOGLE_FIT', 'STRAVA', 'GARMIN', 'APPLE_HEALTH']

type Tab = 'treino' | 'passos' | 'importar'

const toNumber = (v: string) => (v.trim() === '' ? undefined : Number(v))

// ~0.04 kcal por passo: estimativa rapidinha pro feedback verde
const stepsToKcal = (steps: number) => Math.round(steps * 0.04)

export function ActivityPage() {
  const { t } = useTranslation()
  const typeOptions = useMemo(
    () => TYPE_VALUES.filter((v) => v !== 'STEPS').map((v) => ({ value: v, label: t(`activity.typeLabel.${v}`) })),
    [t],
  )
  const sourceOptions = useMemo(
    () => SOURCE_VALUES.map((v) => ({ value: v, label: t(`activity.sourceLabel.${v}`) })),
    [t],
  )

  const [tab, setTab] = useState<Tab>('treino')

  // form do treino (atividade que não é só passo)
  const [activityType, setActivityType] = useState<ActivityType>('RUN')
  const [caloriesBurned, setCaloriesBurned] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [source, setSource] = useState<ActivitySource>('MANUAL')

  // form dos passos
  const [steps, setSteps] = useState('')

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

  async function submitWorkout(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await logActivity({
        activityType,
        caloriesBurned: toNumber(caloriesBurned),
        distanceKm: toNumber(distanceKm),
        durationMinutes: toNumber(durationMinutes),
        source,
      })
      setCaloriesBurned('')
      setDistanceKm('')
      setDurationMinutes('')
      await refresh()
    } catch (err) {
      setError(apiMessage(err) ?? t('activity.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function submitSteps(event: FormEvent) {
    event.preventDefault()
    const value = toNumber(steps)
    if (value == null || value <= 0) return
    setSaving(true)
    setError(null)
    try {
      await logActivity({ activityType: 'STEPS', steps: value, source })
      setSteps('')
      await refresh()
    } catch (err) {
      setError(apiMessage(err) ?? t('activity.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const stepsNum = toNumber(steps) ?? 0

  return (
    <div className="space-y-5 pb-2">
      {/* cabeçalho com personalidade */}
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Se mexeu hoje?</h1>
        <p className="mt-1 text-sm font-semibold text-muted">
          Treino, caminhada, passos: tudo conta e vira ponto.
        </p>
      </header>

      {/* tabs */}
      <div className="flex gap-1 rounded-2xl bg-track p-1">
        <TabButton active={tab === 'treino'} onClick={() => setTab('treino')} icon={<IconDumbbell />}>
          Treino
        </TabButton>
        <TabButton active={tab === 'passos'} onClick={() => setTab('passos')} icon={<IconShoe />}>
          Passos
        </TabButton>
        <TabButton active={tab === 'importar'} onClick={() => setTab('importar')} icon={<IconPlug />}>
          Importar
        </TabButton>
      </div>

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>
      )}

      {/* ===== TREINO ===== */}
      {tab === 'treino' && (
        <div className="space-y-4">
          <form onSubmit={submitWorkout} className="card space-y-4">
            <div>
              <label className="label">{t('activity.type')}</label>
              <Select value={activityType} onChange={setActivityType} options={typeOptions} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Num label={t('activity.distance')} value={distanceKm} onChange={setDistanceKm} />
              <Num label={t('activity.duration')} value={durationMinutes} onChange={setDurationMinutes} />
              <Num label={t('activity.calories')} value={caloriesBurned} onChange={setCaloriesBurned} />
            </div>
            <div>
              <label className="label">{t('activity.source')}</label>
              <Select value={source} onChange={setSource} options={sourceOptions} />
            </div>
            <p className="flex items-start gap-2 text-xs font-semibold text-faint">
              <IconSpark className="mt-0.5 shrink-0 text-brand" />
              {t('activity.autoEstimate')}
            </p>
            <button type="submit" disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2">
              <IconPlus />
              {saving ? t('common.saving') : 'Registrar treino'}
              {!saving && <Points value={15} />}
            </button>
          </form>

          <TodayList logs={logs} t={t} />
        </div>
      )}

      {/* ===== PASSOS ===== */}
      {tab === 'passos' && (
        <div className="space-y-3">
          <form onSubmit={submitSteps} className="space-y-3">
            <div className="card text-center">
              <p className="mb-2 text-xs font-bold text-muted">Quantos passos hoje?</p>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="w-full bg-transparent text-center font-display text-[44px] font-semibold leading-none text-ink outline-none placeholder:text-faint"
              />
              <p className="mt-2 text-[13px] font-extrabold text-success-ink">
                {stepsNum > 0
                  ? `isso dá uns ${stepsToKcal(stepsNum).toLocaleString('pt-BR')} kcal queimados`
                  : 'joga o número e eu calculo as calorias'}
              </p>
            </div>

            <div className="flex gap-2">
              {[1000, 5000, 10000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setSteps(String((toNumber(steps) ?? 0) + inc))}
                  className="flex-1 rounded-xl border border-hair bg-surface py-2.5 text-sm font-extrabold text-ink transition hover:border-brand hover:text-brand-ink"
                >
                  +{inc.toLocaleString('pt-BR')}
                </button>
              ))}
            </div>

            <p className="text-center text-xs font-semibold text-muted">
              Sabe o valor exato do WeWard? Joga ele aí em cima.
            </p>

            <button
              type="submit"
              disabled={saving || stepsNum <= 0}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              <IconPlus />
              {saving ? t('common.saving') : 'Registrar passos'}
              {!saving && <Points value={15} />}
            </button>
          </form>

          <TodayList logs={logs} t={t} />
        </div>
      )}

      {/* ===== IMPORTAR ===== */}
      {tab === 'importar' && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted">
            Conecta uma vez e esquece: os passos entram sozinhos.
          </p>
          <div className="space-y-2">
            <SourceRow badge="S" color="#fc5200" name="Strava" />
            <SourceRow badge="W" color="#4f7cff" name="WeWard" />
            <SourceRow badge="G" color="#ea4335" name="Google Fit" />
          </div>
          <p className="pt-1 text-center text-xs font-semibold text-faint">
            Integração ainda chega. Por enquanto, registra na mão que vale igual.
          </p>
        </div>
      )}

      {/* barra fixa: gasto de hoje + CTA */}
      <div className="sticky bottom-0 -mb-2 bg-canvas pt-3">
        <div className="flex items-center gap-3 rounded-2xl border border-arena-border bg-arena px-4 py-3">
          <div className="flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-arena-muted">
              Gasto de hoje
            </div>
            <div className="font-display text-xl font-semibold leading-tight text-arena-text">
              {(summary?.totalCaloriesBurned ?? 0).toLocaleString('pt-BR')} kcal{' '}
              <span className="text-xs font-bold text-arena-muted">queimadas</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-arena-muted">
              Passos
            </div>
            <div className="font-display text-xl font-semibold leading-tight text-arena-text">
              {(summary?.totalSteps ?? 0).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TodayList({ logs, t }: { logs: ActivityLog[]; t: (k: string, o?: Record<string, unknown>) => string }) {
  return (
    <div>
      <h2 className="mb-2.5 text-xs font-bold text-muted">Seus registros de hoje</h2>
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hair bg-surface/60 px-5 py-8 text-center">
          <IconEmpty className="mx-auto mb-2 text-faint" />
          <p className="text-sm font-bold text-ink">{t('activity.empty')}</p>
          <p className="mt-1 text-xs font-semibold text-muted">
            Bora se mexer. Até a caminhada até a padaria conta.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-center gap-3 rounded-2xl border border-hair bg-surface px-4 py-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
                <ActivityIcon type={log.activityType} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-ink">
                  {t(`activity.typeLabel.${log.activityType}`)}
                </div>
                <div className="truncate text-[11.5px] font-semibold text-muted">
                  {logDetail(log, t)}
                </div>
              </div>
              <span className="shrink-0 font-display text-[13px] font-semibold text-success-ink">
                {log.caloriesBurned.toLocaleString('pt-BR')} kcal
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function logDetail(log: ActivityLog, t: (k: string) => string): string {
  const parts: string[] = []
  if (log.steps != null) parts.push(`${log.steps.toLocaleString('pt-BR')} ${t('activity.steps').toLowerCase()}`)
  if (log.distanceKm != null) parts.push(`${log.distanceKm} km`)
  if (log.durationMinutes != null) parts.push(`${log.durationMinutes} min`)
  parts.push(t(`activity.sourceLabel.${log.source}`))
  return parts.join(' · ')
}

function SourceRow({
  badge,
  color,
  name,
  connected,
}: {
  badge: string
  color: string
  name: string
  connected?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-hair bg-surface px-4 py-3.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-sans text-[15px] font-bold text-white"
        style={{ background: color }}
      >
        {badge}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold text-ink">{name}</div>
        <div
          className={`text-[11.5px] font-bold ${connected ? 'text-success-ink' : 'text-muted'}`}
        >
          {connected ? 'conectado · sincronizou agora' : 'não conectado'}
        </div>
      </div>
      {connected ? (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-success" aria-label="Conectado" />
      ) : (
        <button
          type="button"
          disabled
          title="Em breve"
          className="shrink-0 cursor-not-allowed rounded-xl bg-brand px-3.5 py-2 text-xs font-extrabold text-white opacity-60"
        >
          Conectar
        </button>
      )}
    </div>
  )
}

function Num({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min={0}
        step="0.1"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input px-3 py-2 text-sm"
      />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-extrabold transition ${
        active
          ? 'bg-surface text-ink shadow-[0_1px_4px_rgba(0,0,0,.08)]'
          : 'bg-transparent text-muted hover:text-ink'
      }`}
    >
      <span className={active ? 'text-brand' : 'text-muted'}>{icon}</span>
      {children}
    </button>
  )
}

/* ---------- ícones (SVG preenchidos, fill currentColor) ---------- */

function ActivityIcon({ type }: { type: ActivityType }) {
  switch (type) {
    case 'STEPS':
    case 'WALK':
      return <IconShoe />
    case 'RUN':
      return <IconRun />
    case 'CYCLE':
      return <IconBike />
    case 'WORKOUT':
      return <IconDumbbell />
    default:
      return <IconSpark />
  }
}

function IconDumbbell({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${className}`}>
      <path d="M3 11h2V9a1.5 1.5 0 013 0v6a1.5 1.5 0 01-3 0v-1H3zm18 0h-2V9a1.5 1.5 0 00-3 0v6a1.5 1.5 0 003 0v-1h2zM7.5 11h9v2h-9z" />
    </svg>
  )
}

function IconShoe({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${className}`}>
      <path d="M2 16a1 1 0 011-1h3l2.2-3.3a1 1 0 011.5-.2l1.5 1.2 1.1-1.5a1 1 0 011.5-.1l1.2 1.1 2.3.6A3 3 0 0122 15.8V18a1 1 0 01-1 1H3a1 1 0 01-1-1zm3-3v2h2l-1.4-2.1z" />
    </svg>
  )
}

function IconRun({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${className}`}>
      <path d="M13.5 5.5a2 2 0 11-4 0 2 2 0 014 0zM6.8 14l1.7-3 2 1.3-.7 2.5 2.7 2.4.9 4.3-2 .4-.8-3.6-2.8-2.5L6.5 19l-1.8-.9 2-3.6zm6.1-4.7 1.7 1.2 2.1-.2.2 2-3 .3-2.5-1.8z" />
    </svg>
  )
}

function IconBike({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${className}`}>
      <path d="M5.5 14.5a3 3 0 100 6 3 3 0 000-6zm0 1.6a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8zM18.5 14.5a3 3 0 100 6 3 3 0 000-6zm0 1.6a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8zM14 5a1 1 0 100 2h1.2l.9 1.6-3.3 3.4-2-3H13a1 1 0 100-2H8.5a1 1 0 00-.85 1.53L9.4 12 8 15.4l1.5.6 1.6-3.8 2.3 3.3.8-.6-.05-.07L17 11.3l.6 1a1 1 0 00.9.5l-.5-1-1.6-2.9L15.7 5z" />
    </svg>
  )
}

function IconPlug({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] fill-current ${className}`}>
      <path d="M9 2a1 1 0 011 1v4h4V3a1 1 0 112 0v4h1a1 1 0 110 2h-1v2a5 5 0 01-4 4.9V21a1 1 0 11-2 0v-3.1A5 5 0 016 13v-2H5a1 1 0 110-2h1V3a1 1 0 011-1z" />
    </svg>
  )
}

function IconPlus({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] fill-current ${className}`}>
      <path d="M11 5a1 1 0 112 0v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6z" />
    </svg>
  )
}

function IconSpark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-current ${className}`}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  )
}

function IconEmpty({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-8 w-8 fill-current ${className}`}>
      <path d="M13.5 5.5a2 2 0 11-4 0 2 2 0 014 0zM6.8 14l1.7-3 2 1.3-.7 2.5 2.7 2.4.9 4.3-2 .4-.8-3.6-2.8-2.5L6.5 19l-1.8-.9 2-3.6zm6.1-4.7 1.7 1.2 2.1-.2.2 2-3 .3-2.5-1.8z" />
    </svg>
  )
}

function apiMessage(err: unknown): string | null {
  return err instanceof AxiosError ? (err.response?.data?.message as string | undefined) ?? null : null
}
