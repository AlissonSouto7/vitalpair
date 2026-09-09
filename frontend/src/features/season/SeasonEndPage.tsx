import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { SeasonHistoryItem, SeasonView } from '../../types/season'
import { profileQueries } from '../profile/queries'

import { BowlIcon, Confetti, ScopedStyles, ScoreSide, StarIcon, TrophyIcon } from './endParts'
import { initial, lowerFirst } from './endText'

/**
 * Fim de temporada — a ÚNICA tela de celebração do app (dados reais).
 * Mostra a última temporada FECHADA (do histórico). Confete nas 3 cores da marca.
 */
export function SeasonEndPage() {
  const { t } = useTranslation()
  // Shares the season query with the profile and dashboard screens: same data, same key, so
  // the three cannot disagree about which season is running.
  const seasonQuery = useQuery(profileQueries.season())
  const season: SeasonView | null = seasonQuery.data ?? null

  if (seasonQuery.isPending) return <p className="font-bold text-muted">{t('common.loading')}</p>
  if (seasonQuery.isError)
    return (
      <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">
        {t('season.loadError')}
      </p>
    )

  const last: SeasonHistoryItem | undefined = season?.history[0]
  const partnerName = season?.rival?.name ?? t('season.defaultPartner')

  // Ainda não fechou nenhuma temporada: nada pra celebrar por aqui.
  if (!season || !last) {
    return (
      <div className="mx-auto max-w-[520px]">
        <section className="card flex flex-col items-center gap-4 py-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
            <TrophyIcon className="h-8 w-8 fill-brand" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {t('seasonEnd.emptyTitle')}
            </h1>
            <p className="mx-auto mt-1 max-w-sm text-sm font-semibold text-muted">
              {season
                ? t('seasonEnd.emptyText', { days: season.daysLeft })
                : t('seasonEnd.emptyTextNoSeason')}
            </p>
          </div>
          <Link to="/season" className="btn-primary">
            {t('seasonEnd.backToSeason')}
          </Link>
        </section>
      </div>
    )
  }

  const youWon = last.winner === 'YOU'
  const tie = last.winner === 'TIE'
  const lead = Math.abs(last.you - last.rival)

  return (
    <div className="relative -mx-4 -my-4 min-h-[calc(100vh-6rem)] overflow-hidden sm:-mx-6 sm:-my-6">
      <Confetti />

      <div className="relative z-10 mx-auto flex max-w-[520px] flex-col items-center px-4 py-10 text-center">
        {/* Faixa de abertura */}
        <p className="vp-rise text-xs font-extrabold uppercase tracking-[0.16em] text-brand-ink">
          {t('seasonEnd.banner', { n: String(last.number).padStart(2, '0') })}
        </p>

        {/* Troféu com aura */}
        <div className="vp-pop relative my-2 h-[150px] w-[150px]">
          <div className="vp-glow absolute -inset-3 rounded-full bg-[radial-gradient(circle,var(--brand-soft),transparent_68%)]" />
          <div className="vp-bob relative flex h-[150px] w-[150px] items-center justify-center rounded-[42px] bg-gradient-to-br from-brand to-brand-ink shadow-[0_16px_40px_rgba(255,107,44,0.45)]">
            <TrophyIcon className="h-[74px] w-[74px] fill-white" />
          </div>
        </div>

        {/* Título celebrativo */}
        <h1
          className="vp-rise mt-3 font-display text-[38px] font-semibold leading-none tracking-tight text-ink"
          style={{ animationDelay: '0.1s' }}
        >
          {tie
            ? t('seasonEnd.tie')
            : youWon
              ? t('seasonEnd.youWon')
              : t('seasonEnd.rivalWon', { rival: partnerName })}
        </h1>
        <p
          className="vp-rise mb-6 mt-2 text-[15px] font-bold text-muted"
          style={{ animationDelay: '0.15s' }}
        >
          {tie
            ? t('seasonEnd.tieText', { rival: partnerName })
            : youWon
              ? t('seasonEnd.youWonText', { lead, rival: partnerName })
              : t('seasonEnd.rivalWonText', { lead, rival: partnerName })}
        </p>

        {/* Placar final */}
        <div
          className="vp-rise w-full rounded-[20px] border border-arena-border bg-arena px-6 py-5 shadow-[0_14px_36px_var(--arena-shadow)]"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-center justify-between">
            <ScoreSide
              name={t('season.you')}
              initial="V"
              score={last.you}
              tone="you"
              winner={youWon || tie}
            />

            <div className="flex flex-col items-center gap-1 px-2">
              <StarIcon />
              <span className="whitespace-nowrap text-[10px] font-extrabold text-success-ink">
                {tie ? t('seasonEnd.tieShort') : t('seasonEnd.lead', { lead })}
              </span>
            </div>

            <ScoreSide
              name={partnerName}
              initial={initial(partnerName)}
              score={last.rival}
              tone="rival"
              winner={!youWon || tie}
            />
          </div>
        </div>

        {/* Aposta a pagar */}
        {last.stake && !tie && (
          <div
            className="vp-rise mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-carb/30 bg-carb/10 px-5 py-4"
            style={{ animationDelay: '0.25s' }}
          >
            <BowlIcon />
            <span className="text-sm font-extrabold text-ink">
              {youWon
                ? t('seasonEnd.stakeWon', { rival: partnerName, stake: lowerFirst(last.stake) })
                : t('seasonEnd.stakeLost', { stake: lowerFirst(last.stake) })}
            </span>
          </div>
        )}

        {/* Ações */}
        <Link
          to="/season"
          className="vp-rise btn-primary mt-6 w-full py-4 text-center text-base shadow-[0_8px_22px_rgba(255,107,44,0.35)]"
          style={{ animationDelay: '0.35s' }}
        >
          {t('seasonEnd.newSeason', { n: last.number + 1 })}
        </Link>
        <Link
          to="/progress"
          className="vp-rise mt-3 text-[13px] font-extrabold text-muted transition hover:text-ink"
          style={{ animationDelay: '0.4s' }}
        >
          {t('seasonEnd.seeSummary')}
        </Link>
      </div>

      <ScopedStyles />
    </div>
  )
}

/* ---------------- subcomponentes locais ---------------- */
