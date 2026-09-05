import { useEffect, useState, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { getSeason } from '../../api/season'
import { Scoreboard } from '../../components/ui/Scoreboard'
import { Points } from '../../components/ui/Badge'
import type { SeasonBreakdown, SeasonDay, SeasonHistoryItem, SeasonView } from '../../types/season'

export function SeasonPage() {
  const { t } = useTranslation()
  const [season, setSeason] = useState<SeasonView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSeason()
      .then(setSeason)
      .catch(() => setError(t('season.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  if (loading) return <p className="font-bold text-muted">{t('common.loading')}</p>
  if (error)
    return <p className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">{error}</p>
  if (!season) return null

  const { you, rival, hasPartner } = season
  const partnerName = rival?.name ?? t('season.defaultPartner')
  const leading = you.score - (rival?.score ?? 0)

  const overall = season.history.reduce(
    (acc, h) => ({
      you: acc.you + (h.winner === 'YOU' ? 1 : 0),
      rival: acc.rival + (h.winner === 'RIVAL' ? 1 : 0),
    }),
    { you: 0, rival: 0 },
  )

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink">
          {t('season.title', { n: String(season.number).padStart(2, '0') })}
        </h1>
        <p className="mt-1.5 text-[13px] font-bold text-muted">
          {!hasPartner
            ? t('season.subNoPartner', { days: season.daysLeft })
            : leading >= 0
              ? t('season.subLeading', { days: season.daysLeft })
              : t('season.subBehind', { days: season.daysLeft })}
        </p>
      </header>

      {/* Placar */}
      {hasPartner && rival ? (
        <Scoreboard
          you={{ name: t('season.you'), score: you.score, initial: 'V' }}
          rival={{
            name: partnerName,
            score: rival.score,
            initial: initial(partnerName),
            tone: 'rival',
          }}
          stake={season.stake}
          day={season.day}
          total={season.total}
        />
      ) : (
        <div className="rounded-[22px] border border-dashed border-hair bg-surface px-7 py-7 text-center">
          <p className="font-display text-lg font-semibold text-ink">{t('season.soloTitle')}</p>
          <p className="mt-1 text-sm font-semibold text-muted">
            <Trans
              i18nKey="season.soloText"
              values={{ points: you.score, days: season.day }}
              components={[<span className="font-extrabold text-success-ink" />]}
            />
          </p>
        </div>
      )}

      {/* Resumo: aposta + dias + quem lidera */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          icon={<DishIcon />}
          tone="carb"
          title={t('season.statStakeTitle')}
          value={season.stake}
        />
        <Stat
          icon={<ClockIcon />}
          tone="brand"
          title={t('season.statDaysLeftTitle')}
          value={t(season.daysLeft === 1 ? 'season.daysOne' : 'season.daysOther', {
            n: season.daysLeft,
          })}
        />
        {hasPartner ? (
          <Stat
            icon={<MedalIcon />}
            tone={leading >= 0 ? 'success' : 'rival'}
            title={t('season.statLeaderTitle')}
            value={
              leading >= 0
                ? t('season.leaderYou', { n: leading })
                : t('season.leaderPartner', { name: partnerName, n: -leading })
            }
          />
        ) : (
          <Stat
            icon={<MedalIcon />}
            tone="success"
            title={t('season.statYourPointsTitle')}
            value={t('season.pts', { n: you.score })}
          />
        )}
      </div>

      {/* Ponto a ponto */}
      {season.days.length > 0 && (
        <section className="card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">
              {t('season.pointByPoint')}
            </h2>
            <div className="flex items-center gap-4 text-[11.5px] font-extrabold">
              <Legend color="bg-brand" label={t('season.you')} cls="text-brand-ink" />
              {hasPartner && <Legend color="bg-rival" label={partnerName} cls="text-rival-ink" />}
            </div>
          </div>
          <DayChart days={season.days} hasPartner={hasPartner} partnerName={partnerName} />
        </section>
      )}

      {/* Breakdown */}
      {season.breakdown.length > 0 && (
        <section className="card">
          <h2 className="mb-1 font-display text-base font-semibold text-ink">
            {t('season.breakdownTitle')}
          </h2>
          <p className="mb-4 text-[13px] font-bold text-muted">{t('season.breakdownSubtitle')}</p>
          <div className="space-y-3">
            {season.breakdown.map((b) => (
              <BreakdownRow
                key={b.source}
                item={b}
                hasPartner={hasPartner}
                partnerName={partnerName}
              />
            ))}
          </div>
        </section>
      )}

      {/* Histórico */}
      {season.history.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-base font-semibold text-ink">{t('season.history')}</h2>
          {season.history.map((h) => (
            <HistoryRow key={h.number} item={h} partnerName={partnerName} />
          ))}

          {hasPartner && (
            <div className="flex items-center gap-[14px] rounded-2xl border border-hair bg-surface px-[18px] py-[14px]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-track">
                <TrophyIcon className="h-[21px] w-[21px] fill-muted" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-extrabold text-ink">{t('season.overallTitle')}</div>
                <div className="text-[11.5px] font-bold text-muted">
                  {overall.you === overall.rival
                    ? t('season.overallTie', { you: overall.you, rival: overall.rival })
                    : overall.you > overall.rival
                      ? t('season.overallYouAhead', {
                          you: overall.you,
                          rival: overall.rival,
                          name: partnerName,
                        })
                      : t('season.overallPartnerAhead', {
                          you: overall.you,
                          rival: overall.rival,
                          name: partnerName,
                          first: firstName(partnerName),
                        })}
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 font-display text-lg font-semibold">
                <span className="text-brand-ink">{overall.you}</span>
                <span className="text-faint">·</span>
                <span className="text-rival-ink">{overall.rival}</span>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

/* ---------- subcomponentes ---------- */

function Stat({
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

function Legend({ color, label, cls }: { color: string; label: string; cls: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${cls}`}>
      <span className={`h-[9px] w-[9px] rounded-[3px] ${color}`} />
      {label}
    </span>
  )
}

function DayChart({
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

function BreakdownRow({
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

function HistoryRow({ item, partnerName }: { item: SeasonHistoryItem; partnerName: string }) {
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

/* ---------- ícones ---------- */

const SOURCE_ICONS: Record<string, (props: { className?: string }) => ReactNode> = {
  MEAL: ForkKnifeIcon,
  ACTIVITY: DumbbellIcon,
  STREAK: FlameIcon,
  MISSION: StarIcon,
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 4h10v2h3v3a4 4 0 01-4 4 5 5 0 01-3 2v2h3v3H8v-3h3v-2a5 5 0 01-3-2 4 4 0 01-4-4V6h3zm0 4H6v1a2 2 0 002 2zm10 0v3a2 2 0 002-2V8z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px] fill-current" aria-hidden="true">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.7-4-2.3z" />
    </svg>
  )
}

function MedalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px] fill-current" aria-hidden="true">
      <path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9z" />
    </svg>
  )
}

function DishIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px] fill-current" aria-hidden="true">
      <path d="M12 5a8 8 0 00-7.9 7h15.8A8 8 0 0012 5zM3 14h18v2H3zm-1 4h20v2H2z" />
    </svg>
  )
}

function ForkKnifeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 2v7a2 2 0 01-1 1.7V22H8v-11.3A2 2 0 017 9V2zm2 0v6h1.5V2zm-4 0v6h1.5V2zM16 2c-1.7 0-3 2.5-3 5.5 0 2.4.9 4 2 4.5V22h2V2z" />
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

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2c1 3-1 4-2 6s-2 3 .5 5c0-1.5 1-2.5 1.5-3 .5 2 2.5 2.5 2.5 5a4 4 0 11-8 0c0-4 4-5 2.5-9C11 9 13 6 12 2z" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9z" />
    </svg>
  )
}

/* ---------- helpers ---------- */

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'P'
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'Par'
}
