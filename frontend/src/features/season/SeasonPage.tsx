import { useQuery } from '@tanstack/react-query'
import { Trans, useTranslation } from 'react-i18next'

import { Scoreboard } from '../../components/ui/Scoreboard'
import type { SeasonView } from '../../types/season'
import { profileQueries } from '../profile/queries'

import { ClockIcon, DishIcon, MedalIcon, TrophyIcon } from './icons'
import { firstName, initial } from './names'
import { BreakdownRow, DayChart, HistoryRow, Legend, Stat } from './parts'

export function SeasonPage() {
  const { t } = useTranslation()
  // The same season query the dashboard, profile and end-of-season screens read.
  const seasonQuery = useQuery(profileQueries.season())
  const season: SeasonView | null = seasonQuery.data ?? null

  if (seasonQuery.isPending) return <p className="font-bold text-muted">{t('common.loading')}</p>
  if (seasonQuery.isError)
    return (
      <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">
        {t('season.loadError')}
      </p>
    )
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
