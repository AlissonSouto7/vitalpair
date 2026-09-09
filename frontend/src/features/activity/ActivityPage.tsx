import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { StepsForm, WorkoutForm } from './forms'
import { IconBike, IconDumbbell, IconEmpty, IconPlug, IconRun, IconShoe, IconSpark } from './icons'
import { activityQueries } from './queries'

import { FormError } from '@/shared/ui/form/FormError'
import type { ActivityLog, ActivitySummary, ActivityType } from '@/types/activity'

type Tab = 'treino' | 'passos' | 'importar'

export function ActivityPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('treino')

  const logsQuery = useQuery(activityQueries.logs())
  const summaryQuery = useQuery(activityQueries.summary())
  const logs: ActivityLog[] = logsQuery.data ?? []
  const summary: ActivitySummary | null = summaryQuery.data ?? null
  const loadError = logsQuery.isError || summaryQuery.isError ? t('activity.loadError') : null

  /** Every read a logged activity makes stale, here and on the dashboard. */
  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['activity'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
  }

  return (
    <div className="space-y-5 pb-2">
      {/* cabeçalho com personalidade */}
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {t('activity.pageTitle')}
        </h1>
        <p className="mt-1 text-sm font-semibold text-muted">{t('activity.pageSubtitle')}</p>
      </header>

      {/* tabs */}
      <div className="flex gap-1 rounded-2xl bg-track p-1">
        <TabButton
          active={tab === 'treino'}
          onClick={() => setTab('treino')}
          icon={<IconDumbbell />}
        >
          {t('activity.tabWorkout')}
        </TabButton>
        <TabButton active={tab === 'passos'} onClick={() => setTab('passos')} icon={<IconShoe />}>
          {t('activity.tabSteps')}
        </TabButton>
        <TabButton
          active={tab === 'importar'}
          onClick={() => setTab('importar')}
          icon={<IconPlug />}
        >
          {t('activity.tabImport')}
        </TabButton>
      </div>

      <FormError message={loadError} />

      {/* ===== TREINO ===== */}
      {tab === 'treino' && (
        <div className="space-y-4">
          <WorkoutForm onLogged={refresh} />
          <TodayList logs={logs} t={t} />
        </div>
      )}

      {/* ===== PASSOS ===== */}
      {tab === 'passos' && (
        <div className="space-y-3">
          <StepsForm onLogged={refresh} />
          <TodayList logs={logs} t={t} />
        </div>
      )}

      {/* ===== IMPORTAR ===== */}
      {tab === 'importar' && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted">{t('activity.importHint')}</p>
          <div className="space-y-2">
            <SourceRow badge="S" color="#fc5200" name="Strava" t={t} />
            <SourceRow badge="W" color="#4f7cff" name="WeWard" t={t} />
            <SourceRow badge="G" color="#ea4335" name="Google Fit" t={t} />
          </div>
          <p className="pt-1 text-center text-xs font-semibold text-faint">
            {t('activity.importFooter')}
          </p>
        </div>
      )}

      {/* barra fixa: gasto de hoje + CTA */}
      <div className="sticky bottom-0 -mb-2 bg-canvas pt-3">
        <div className="flex items-center gap-3 rounded-2xl border border-arena-border bg-arena px-4 py-3">
          <div className="flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-arena-muted">
              {t('activity.todaySpent')}
            </div>
            <div className="font-display text-xl font-semibold leading-tight text-arena-text">
              {(summary?.totalCaloriesBurned ?? 0).toLocaleString(i18n.language)} kcal{' '}
              <span className="text-xs font-bold text-arena-muted">{t('activity.burned')}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-arena-muted">
              {t('activity.steps')}
            </div>
            <div className="font-display text-xl font-semibold leading-tight text-arena-text">
              {(summary?.totalSteps ?? 0).toLocaleString(i18n.language)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- formulário de treino ---------- */

function TodayList({
  logs,
  t,
}: {
  logs: ActivityLog[]
  t: (k: string, o?: Record<string, unknown>) => string
}) {
  return (
    <div>
      <h2 className="mb-2.5 text-xs font-bold text-muted">{t('activity.todayLogs')}</h2>
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hair bg-surface/60 px-5 py-8 text-center">
          <IconEmpty className="mx-auto mb-2 text-faint" />
          <p className="text-sm font-bold text-ink">{t('activity.empty')}</p>
          <p className="mt-1 text-xs font-semibold text-muted">{t('activity.emptyHint')}</p>
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
  if (log.steps != null)
    parts.push(`${log.steps.toLocaleString('pt-BR')} ${t('activity.steps').toLowerCase()}`)
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
  t,
}: {
  badge: string
  color: string
  name: string
  connected?: boolean
  t: (k: string, o?: Record<string, unknown>) => string
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
        <div className={`text-[11.5px] font-bold ${connected ? 'text-success-ink' : 'text-muted'}`}>
          {connected ? t('activity.connected') : t('activity.notConnected')}
        </div>
      </div>
      {connected ? (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-success"
          aria-label={t('activity.connectedAria')}
        />
      ) : (
        <button
          type="button"
          disabled
          title={t('activity.soon')}
          className="shrink-0 cursor-not-allowed rounded-xl bg-brand px-3.5 py-2 text-xs font-extrabold text-white opacity-60"
        >
          {t('activity.connect')}
        </button>
      )}
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
