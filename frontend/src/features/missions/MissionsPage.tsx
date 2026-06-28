import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { acceptFlashMission, getFlashMission, getWeeklyMissions } from '../../api/missions'
import { Points } from '../../components/ui/Badge'
import type { FlashMission as FlashMissionT, WeeklyMission, WeeklyMissionIcon } from '../../types/missions'

/**
 * Tela de Missões — dados reais.
 *   relâmpago (laranja) = backend de missão relâmpago
 *   semanais (verde)    = progresso calculado dos logs
 *   do par (roxo)       = você + a Célia
 *   concluídas (verde)  = missões batidas
 */
export function MissionsPage() {
  const { t } = useTranslation()
  const [flash, setFlash] = useState<FlashMissionT | null>(null)
  const [weekly, setWeekly] = useState<WeeklyMission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getFlashMission().catch(() => null), getWeeklyMissions().catch(() => [])])
      .then(([f, w]) => {
        setFlash(f)
        setWeekly(w)
      })
      .catch(() => setError(t('missions.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  if (loading) return <p className="font-bold text-muted">{t('common.loading')}</p>
  if (error) return <p className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">{error}</p>

  const selfActive = weekly.filter((m) => m.scope === 'SELF' && !m.completed)
  const pair = weekly.filter((m) => m.scope === 'PAIR' && m.partnerName)
  const done = weekly.filter((m) => m.completed)
  const partnerName = pair[0]?.partnerName ?? t('missions.defaultPartner')

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">{t('missions.title')}</h1>
        <p className="mt-1 text-sm font-bold text-muted">{t('missions.subtitle')}</p>
      </header>

      {flash && <FlashMission mission={flash} onAccept={setFlash} />}

      {selfActive.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-ink">{t('missions.sectionThisWeek')}</h2>
          <div className="space-y-[10px]">
            {selfActive.map((m) => (
              <MissionCard key={m.code} mission={m} />
            ))}
          </div>
        </section>
      )}

      {pair.length > 0 && (
        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-ink">
            {t('missions.sectionPair', { partner: partnerName })}
          </h2>
          <p className="mb-3 text-[13px] font-semibold text-muted">{t('missions.sectionPairHint')}</p>
          <div className="space-y-[10px]">
            {pair.map((m) => (
              <PairMissionCard key={m.code} mission={m} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-ink">{t('missions.sectionDone')}</h2>
          <div className="space-y-[9px]">
            {done.map((m) => (
              <DoneRow key={m.code} mission={m} />
            ))}
          </div>
        </section>
      )}

      {selfActive.length === 0 && pair.length === 0 && done.length === 0 && (
        <div className="rounded-2xl border border-dashed border-hair bg-surface px-6 py-10 text-center">
          <p className="font-display text-base font-semibold text-ink">{t('missions.emptyTitle')}</p>
          <p className="mt-1 text-sm font-semibold text-muted">{t('missions.emptyText')}</p>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Missão relâmpago — laranja, countdown real
   ============================================================ */

function FlashMission({ mission, onAccept }: { mission: FlashMissionT; onAccept: (m: FlashMissionT) => void }) {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now())
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const id = setInterval(() => setNow(Date.now()), reduceMotion ? 60000 : 1000)
    return () => clearInterval(id)
  }, [])

  const secondsLeft = Math.max(0, Math.floor((new Date(mission.expiresAt).getTime() - now) / 1000))
  const acabou = secondsLeft <= 0

  async function topar() {
    setAccepting(true)
    try {
      const updated = await acceptFlashMission()
      onAccept(updated)
    } catch {
      // silencioso: o botão volta a "Topar"
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-[18px] border-[1.5px] border-brand-soft bg-brand-soft p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-brand">
        <BoltIcon className="h-6 w-6 animate-pulse fill-white motion-reduce:animate-none" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-brand-ink">
          {acabou
            ? t('missions.flashLabelOver')
            : t('missions.flashLabelLeft', { time: formatRemaining(secondsLeft) })}
        </p>
        <p className="font-display text-lg font-semibold text-ink">{mission.title}</p>
        {mission.description && <p className="text-xs font-semibold text-muted">{mission.description}</p>}
      </div>

      <div className="shrink-0 text-right">
        <div className="font-display text-[22px] font-semibold text-success-ink">+{mission.reward}</div>
        <button
          type="button"
          onClick={topar}
          disabled={mission.accepted || acabou || accepting}
          className="btn-primary mt-1.5 px-4 py-2 text-[13px] disabled:opacity-60"
        >
          {mission.accepted
            ? t('missions.flashAccepted')
            : acabou
              ? t('missions.flashOver')
              : accepting
                ? '...'
                : t('missions.flashAccept')}
        </button>
      </div>
    </div>
  )
}

/* ============================================================
   Missão semanal (SELF) — progresso em verde
   ============================================================ */

function MissionCard({ mission }: { mission: WeeklyMission }) {
  const { t } = useTranslation()
  const pct = Math.min(100, Math.round((mission.current / mission.target) * 100))
  const done = mission.current >= mission.target
  const Icon = WEEKLY_ICON[mission.icon]

  return (
    <div className="rounded-2xl border border-hair bg-surface p-[18px]">
      <div className="mb-3 flex items-center gap-[13px]">
        <span
          className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] ${
            done ? 'bg-success' : 'bg-success-soft'
          }`}
        >
          <Icon className={`h-[21px] w-[21px] ${done ? 'fill-white' : 'fill-success'}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-extrabold text-ink">{mission.title}</p>
          {mission.subtitle && <p className="text-xs font-semibold text-muted">{mission.subtitle}</p>}
        </div>
        <Points value={mission.reward} />
      </div>

      <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-track">
        <div className="h-full rounded-full bg-success transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11.5px] font-bold text-muted">
        {t('missions.progressOf', {
          current: mission.current,
          target: mission.target,
          label: t(progressLabelKey(mission.current, mission.target)),
        })}
      </p>
    </div>
  )
}

/* ============================================================
   Missão do par — roxo (a Célia). Dois lados.
   ============================================================ */

function PairMissionCard({ mission }: { mission: WeeklyMission }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border border-hair bg-surface p-[18px]">
      <div className="mb-[14px] flex items-center gap-[13px]">
        <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-rival-soft">
          <UsersIcon className="h-[21px] w-[21px] fill-rival" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-extrabold text-ink">{mission.title}</p>
          {mission.subtitle && <p className="text-xs font-semibold text-muted">{mission.subtitle}</p>}
        </div>
        <Points value={mission.reward} />
      </div>

      <div className="space-y-[10px]">
        <SideProgress label={t('missions.you')} current={mission.current} total={mission.target} tone="you" />
        <SideProgress
          label={firstName(mission.partnerName)}
          current={mission.partnerCurrent ?? 0}
          total={mission.target}
          tone="rival"
        />
      </div>
    </div>
  )
}

function SideProgress({
  label,
  current,
  total,
  tone,
}: {
  label: string
  current: number
  total: number
  tone: 'you' | 'rival'
}) {
  const { t } = useTranslation()
  const pct = Math.min(100, Math.round((current / total) * 100))
  const done = current >= total
  const barCls = tone === 'you' ? 'bg-brand' : 'bg-rival'
  const labelCls = tone === 'you' ? 'text-brand-ink' : 'text-rival-ink'

  return (
    <div className="flex items-center gap-3">
      <span className={`w-12 shrink-0 truncate text-[11px] font-extrabold ${labelCls}`}>{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
        <div className={`h-full rounded-full ${barCls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-[11px] font-bold text-muted">
        {done ? t('missions.sideDone') : `${current}/${total}`}
      </span>
    </div>
  )
}

/* ============================================================
   Já concluídas — verde, esmaecidas
   ============================================================ */

function DoneRow({ mission }: { mission: WeeklyMission }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-[13px] rounded-[14px] border border-hair bg-surface px-4 py-[13px] opacity-[0.72]">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-success-soft">
        <CheckIcon className="h-[17px] w-[17px] fill-success" />
      </span>
      <p className="min-w-0 flex-1 text-[13.5px] font-extrabold text-ink">{mission.title}</p>
      <span className="shrink-0 text-xs font-extrabold text-success-ink">
        {t('missions.rewardPts', { reward: mission.reward })}
      </span>
    </div>
  )
}

/* ============================================================
   Ícones SVG preenchidos
   ============================================================ */

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
    </svg>
  )
}

function ForkKnifeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 2v7a2 2 0 002 2v11h2V11a2 2 0 002-2V2h-1.5v6h-1V2h-1v6h-1V2zm9 0c-1.7 0-3 2-3 5s1.3 4.5 2 4.5V22h2V2z" />
    </svg>
  )
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 10.5h2V9a1.5 1.5 0 013 0v6a1.5 1.5 0 01-3 0v-1.5H3zm18 0h-2V9a1.5 1.5 0 00-3 0v6a1.5 1.5 0 003 0v-1.5h2zM7.5 11h9v2h-9z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M8 7a3 3 0 116 0 3 3 0 01-6 0zm9 1.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM3 19c0-3 2.7-5 8-5s8 2 8 5v1H3zm16.5-1H21v-1c0-2-1-3.4-2.8-4.2 2 .6 3 2 3 4.2v1z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  )
}

const WEEKLY_ICON: Record<WeeklyMissionIcon, (props: { className?: string }) => ReactNode> = {
  MEAL: ForkKnifeIcon,
  WORKOUT: DumbbellIcon,
  USERS: UsersIcon,
}

/* ============================================================
   util
   ============================================================ */

function formatRemaining(totalSeconds: number): string {
  if (totalSeconds >= 3600) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    return `${h}h ${m}min`
  }
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function progressLabelKey(current: number, target: number): string {
  if (current >= target) return 'missions.progressDone'
  if (target - current === 1) return 'missions.progressAlmost'
  if (current === 0) return 'missions.progressStart'
  return 'missions.progressGoing'
}

function firstName(name?: string | null): string {
  return (name ?? '').trim().split(/\s+/)[0] || 'Par'
}
