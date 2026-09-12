import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BoltIcon, CheckIcon, UsersIcon } from './icons'
import { firstName, formatRemaining, progressLabelKey, WEEKLY_ICON } from './missionText'

import { acceptFlashMission } from '@/api/missions'
import { Points } from '@/components/ui/Badge'
import type { FlashMission as FlashMissionT, WeeklyMission } from '@/types/missions'

/**
 * The cards the missions screen is built from.
 *
 * Moved out of MissionsPage verbatim, markup untouched. The flash card keeps its own
 * countdown, which is a timer rather than a fetch.
 */

export function FlashMission({
  mission,
  onAccept,
}: {
  mission: FlashMissionT
  onAccept: (m: FlashMissionT) => void
}) {
  const { t } = useTranslation()
  // Lazy initialiser: Date.now() runs once on mount instead of on every render.
  const [now, setNow] = useState(() => Date.now())
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
        {mission.description && (
          <p className="text-xs font-semibold text-muted">{mission.description}</p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <div className="font-display text-[22px] font-semibold text-success-ink">
          +{mission.reward}
        </div>
        <button
          type="button"
          onClick={() => void topar()}
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

export function MissionCard({ mission }: { mission: WeeklyMission }) {
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
          {mission.subtitle && (
            <p className="text-xs font-semibold text-muted">{mission.subtitle}</p>
          )}
        </div>
        <Points value={mission.reward} />
      </div>

      <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-full bg-success transition-[width]"
          style={{ width: `${pct}%` }}
        />
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
   Missão do par — roxo (o par). Dois lados.
   ============================================================ */

export function PairMissionCard({ mission }: { mission: WeeklyMission }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border border-hair bg-surface p-[18px]">
      <div className="mb-[14px] flex items-center gap-[13px]">
        <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-rival-soft">
          <UsersIcon className="h-[21px] w-[21px] fill-rival" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-extrabold text-ink">{mission.title}</p>
          {mission.subtitle && (
            <p className="text-xs font-semibold text-muted">{mission.subtitle}</p>
          )}
        </div>
        <Points value={mission.reward} />
      </div>

      <div className="space-y-[10px]">
        <SideProgress
          label={t('missions.you')}
          current={mission.current}
          total={mission.target}
          tone="you"
        />
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

export function SideProgress({
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
      <span className={`w-12 shrink-0 truncate text-[11px] font-extrabold ${labelCls}`}>
        {label}
      </span>
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

export function DoneRow({ mission }: { mission: WeeklyMission }) {
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
