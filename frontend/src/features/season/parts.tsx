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
    brand: 'bg-you-soft text-you-ink',
    rival: 'bg-pair-soft text-pair-ink',
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
  /*
   * Um rótulo a cada cinco dias, e sempre o último.
   *
   * Uma temporada de trinta dias desenhava trinta rótulos de 9,5px lado a lado, tamanho em
   * que ninguém lê nada e que ainda assim ocupava espaço abaixo de cada coluna. A régua
   * existe para situar a leitura, não para nomear cada barra: quem quer o dia exato tem o
   * tooltip, que continua em todas.
   */
  const labelEvery = days.length > 12 ? 5 : 1
  return (
    <div className="relative flex h-[130px] items-end gap-2 pb-[22px]">
      {days.map((d, i) => (
        <div
          key={d.label}
          className="relative flex h-full flex-1 flex-col items-center justify-end"
        >
          <div className="flex h-full w-full items-end gap-0.5">
            <div
              className="flex-1 rounded-t-[3px] bg-you"
              style={{ height: `${(d.you / max) * 100}%` }}
              title={t('season.dayTipYou', { label: d.label, points: d.you })}
            />
            {hasPartner && (
              <div
                className="flex-1 rounded-t-[3px] bg-pair"
                style={{ height: `${(d.rival / max) * 100}%` }}
                title={t('season.dayTipPartner', {
                  label: d.label,
                  name: partnerName,
                  points: d.rival,
                })}
              />
            )}
          </div>
          {(i % labelEvery === 0 || i === days.length - 1) && (
            <span className="absolute bottom-[-20px] text-[11px] font-extrabold tabular-nums text-muted">
              {d.label}
            </span>
          )}
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
          <span className="text-[13px] font-extrabold text-ink">
            {t(`season.source.${item.source}`)}
          </span>
          <span className="flex items-center gap-2 text-[11px] font-extrabold">
            <span className="text-you-ink">{t('season.breakdownYou', { n: item.you })}</span>
            {hasPartner && (
              <>
                <span className="text-faint">·</span>
                <span className="text-pair-ink">
                  {t('season.breakdownPartner', { name: firstName(partnerName), n: item.rival })}
                </span>
              </>
            )}
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-track">
          <div className="bg-you" style={{ width: `${(item.you / denom) * 100}%` }} />
          {hasPartner && <div className="flex-1 bg-pair" />}
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
  const { t, i18n } = useTranslation()
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
      ? 'bg-you-soft text-you-ink'
      : 'bg-pair-soft text-pair-ink'
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
        {/*
          Written here rather than received ready-made: the server used to send "30 dias ·
          fechou em 14/08", in Portuguese and with a Brazilian date, whatever language the
          reader had picked.
        */}
        <div className="text-[11.5px] font-bold text-muted">
          {t('season.historySub', {
            days: item.lengthDays,
            date: new Date(item.endedOn).toLocaleDateString(i18n.language, {
              day: '2-digit',
              month: '2-digit',
            }),
          })}
        </div>
        <div className="mt-0.5 text-[11.5px] font-extrabold">
          <span className="text-you-ink">{t('season.breakdownYou', { n: item.you })}</span>
          <span className="mx-1 text-faint">·</span>
          <span className="text-pair-ink">
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
