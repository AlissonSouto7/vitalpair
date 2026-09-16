import { useQuery } from '@tanstack/react-query'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Scoreboard } from '../../components/ui/Scoreboard'
import type { SeasonView } from '../../types/season'
import { profileQueries } from '../profile/queries'

import { ClockIcon, DishIcon, MedalIcon, TrophyIcon } from './icons'
import { firstName, initial } from './names'
import { BreakdownRow, DayChart, HistoryRow, Legend, Stat } from './parts'
import { stakeText } from './stake'

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

      {/*
        Placar. daysLeft is passed, or the scoreboard falls back to total - day and counts
        today as already spent: the screen showed "faltam 29 dias" inside the scoreboard and
        "30 dias" in the subtitle and the stat card, from the same season.
      */}
      {hasPartner && rival ? (
        <Scoreboard
          you={{ name: t('season.you'), score: you.score, initial: 'V' }}
          rival={{
            name: partnerName,
            score: rival.score,
            initial: initial(partnerName),
            tone: 'rival',
          }}
          stake={stakeText(season.stake, t)}
          day={season.day}
          total={season.total}
          daysLeft={season.daysLeft}
        />
      ) : (
        <div className="rounded-[22px] border border-dashed border-hair bg-surface px-7 py-7 text-center">
          <p className="font-display text-lg font-semibold text-ink">{t('season.soloTitle')}</p>
          <p className="mt-1 text-sm font-semibold text-muted">
            <Trans
              i18nKey="season.soloText"
              count={season.day}
              values={{ points: you.score, count: season.day }}
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
          value={stakeText(season.stake, t)}
        />
        <Stat
          icon={<ClockIcon />}
          tone="brand"
          title={t('season.statDaysLeftTitle')}
          value={t(season.daysLeft === 1 ? 'season.daysOne' : 'season.daysOther', {
            n: season.daysLeft,
          })}
        />
        {/*
          The leader card carries the same missing third state as the scoreboard: a draw used
          to read "Você, por 0 pts" with a green star, so the screen declared a winner twice
          over on a tie. Fixing the Scoreboard alone would have left this card wrong.
        */}
        {hasPartner ? (
          <Stat
            icon={<MedalIcon />}
            tone={leading > 0 ? 'success' : leading < 0 ? 'rival' : 'carb'}
            title={t('season.statLeaderTitle')}
            value={
              leading > 0
                ? t('season.leaderYou', { n: leading })
                : leading < 0
                  ? t('season.leaderPartner', { name: partnerName, n: -leading })
                  : t('season.leaderTied')
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

      {/*
        A saída da tela.

        Eram seis seções densas, vinte e nove números e nenhum botão: um relatório dentro de
        um app. Quem lê que está trinta pontos atrás não tinha o que fazer com a informação,
        e competição que só informa a derrota desanima em vez de puxar. Aparece só para quem
        está atrás, porque para quem lidera seria cobrança sem motivo.
      */}
      {hasPartner && leading < 0 && (
        <Link
          to="/nutrition"
          className="flex items-center justify-between gap-4 rounded-xl border border-hair bg-surface px-[18px] py-[14px] transition hover:bg-track"
        >
          <span>
            <span className="block text-sm font-extrabold text-ink">{t('season.nudgeTitle')}</span>
            <span className="block text-[11.5px] font-bold text-muted">
              {t('season.nudgeBody')}
            </span>
          </span>
          <span className="shrink-0 rounded-xl bg-act px-4 py-2.5 text-[13px] font-extrabold text-on-fill">
            {t('season.nudgeCta')}
          </span>
        </Link>
      )}

      {/* Ponto a ponto */}
      {season.days.length > 0 && (
        <section className="card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">
              {t('season.pointByPoint')}
            </h2>
            <div className="flex items-center gap-4 text-[11.5px] font-extrabold">
              <Legend color="bg-you" label={t('season.you')} cls="text-you-ink" />
              {hasPartner && <Legend color="bg-pair" label={partnerName} cls="text-pair-ink" />}
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
              {/*
                Os números saíram daqui. A frase ao lado já diz "Você 3 · Ana 1, na frente no
                geral também", e repeti-los em corpo grande era a mesma informação duas vezes
                na mesma linha, competindo consigo mesma.
              */}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

/* ---------- subcomponentes ---------- */
