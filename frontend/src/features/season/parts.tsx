import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { StarIcon, TrophyIcon } from './icons'
import { firstName } from './names'
import { SOURCE_ICONS } from './sourceIcons'

import { Points } from '@/components/ui/Badge'
import type { SeasonBreakdown, SeasonDay, SeasonHistoryItem } from '@/types/season'

/**
 * The pieces the season screen is assembled from.
 *
 * Moved out of SeasonPage verbatim, markup untouched. They carry no state and no data
 * fetching, which makes them the part that can leave without changing how anything behaves.
 */

export function Stat({
  icon,
  tone,
  title,
  value,
}: {
  icon: ReactNode
  tone: 'brand' | 'rival' | 'success' | 'carb'
  title: string
  value: string
}) {
  const soft: Record<typeof tone, string> = {
    brand: 'bg-brand-soft text-brand-ink',
    rival: 'bg-rival-soft text-rival-ink',
    success: 'bg-success-soft text-success-ink',
    carb: 'bg-carb/15 text-carb-ink',
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-hair bg-surface px-4 py-3.5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${soft[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
          {title}
        </div>
        <div className="truncate font-display text-[15px] font-semibold text-ink">{value}</div>
      </div>
    </div>
  )
}

export function Legend({ color, label, cls }: { color: string; label: string; cls: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${cls}`}>
      <span className={`h-[9px] w-[9px] rounded-[3px] ${color}`} />
      {label}
    </span>
  )
}

export function DayChart({
  days,
  hasPartner,
  partnerName,
}: {
  days: SeasonDay[]
  hasPartner: boolean
  partnerName: string
}) {
  const { t } = useTranslation()
  const max = Math.max(...days.flatMap((d) => [d.you, d.rival]), 1)
  return (
    <div className="relative flex h-[130px] items-end gap-2 pb-[22px]">
      {days.map((d) => (
        <div
          key={d.label}
          className="relative flex h-full flex-1 flex-col items-center justify-end"
        >
          <div className="flex h-full w-full items-end gap-0.5">
            <div
              className="flex-1 rounded-t-[3px] bg-brand"
              style={{ height: `${(d.you / max) * 100}%` }}
              title={t('season.dayTipYou', { label: d.label, points: d.you })}
            />
            {hasPartner && (
              <div
                className="flex-1 rounded-t-[3px] bg-rival"
                style={{ height: `${(d.rival / max) * 100}%` }}
                title={t('season.dayTipPartner', {
                  label: d.label,
                  name: partnerName,
                  points: d.rival,
                })}
              />
            )}
          </div>
          <span className="absolute bottom-[-20px] text-[9.5px] font-extrabold text-muted">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function BreakdownRow({
  item,
  hasPartner,
  partnerName,
}: {
  item: SeasonBreakdown
  hasPartner: boolean
  partnerName: string
}) {
  const { t } = useTranslation()
  const Icon = SOURCE_ICONS[item.source] ?? StarIcon
  const youAhead = item.you >= item.rival
  const denom = item.you + item.rival || 1
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-track">
        <Icon className="h-[18px] w-[18px] fill-muted" />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[13px] font-extrabold text-ink">{item.label}</span>
          <span className="flex items-center gap-2 text-[11px] font-extrabold">
            <span className="text-brand-ink">{t('season.breakdownYou', { n: item.you })}</span>
            {hasPartner && (
              <>
                <span className="text-faint">·</span>
                <span className="text-rival-ink">
                  {t('season.breakdownPartner', { name: firstName(partnerName), n: item.rival })}
                </span>
              </>
            )}
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-track">
          <div className="bg-brand" style={{ width: `${(item.you / denom) * 100}%` }} />
          {hasPartner && <div className="flex-1 bg-rival" />}
        </div>
      </div>
      <Points value={youAhead ? item.you : item.rival} />
    </div>
  )
}

export function HistoryRow({
  item,
  partnerName,
}: {
  item: SeasonHistoryItem
  partnerName: string
}) {
  const { t } = useTranslation()
  const youWon = item.winner === 'YOU'
  const tie = item.winner === 'TIE'
  const badge = tie
    ? t('season.historyWinTie')
    : youWon
      ? t('season.historyWinYou')
      : t('season.historyWinPartner', { name: firstName(partnerName) })
  const badgeCls = tie
    ? 'bg-track text-muted'
    : youWon
      ? 'bg-brand-soft text-brand-ink'
      : 'bg-rival-soft text-rival-ink'
  return (
    <div className="flex items-center gap-[14px] rounded-2xl border border-hair bg-surface px-[18px] py-[14px]">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          tie ? 'bg-track' : youWon ? 'bg-brand-soft' : 'bg-rival-soft'
        }`}
      >
        <TrophyIcon
          className={`h-[21px] w-[21px] ${tie ? 'fill-muted' : youWon ? 'fill-brand' : 'fill-rival'}`}
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-extrabold text-ink">
          {t('season.seasonNumber', { n: String(item.number).padStart(2, '0') })}
        </div>
        <div className="text-[11.5px] font-bold text-muted">{item.sub}</div>
        <div className="mt-0.5 text-[11.5px] font-extrabold">
          <span className="text-brand-ink">{t('season.breakdownYou', { n: item.you })}</span>
          <span className="mx-1 text-faint">·</span>
          <span className="text-rival-ink">
            {t('season.breakdownPartner', { name: firstName(partnerName), n: item.rival })}
          </span>
        </div>
      </div>
      <span
        className={`shrink-0 rounded-[9px] px-[11px] py-[5px] text-xs font-extrabold ${badgeCls}`}
      >
        {badge}
      </span>
    </div>
  )
}
