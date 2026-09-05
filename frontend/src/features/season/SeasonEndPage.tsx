import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSeason } from '../../api/season'
import { Avatar } from '../../components/ui/Avatar'
import type { SeasonHistoryItem, SeasonView } from '../../types/season'

/**
 * Fim de temporada — a ÚNICA tela de celebração do app (dados reais).
 * Mostra a última temporada FECHADA (do histórico). Confete nas 3 cores da marca.
 */
export function SeasonEndPage() {
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
  if (error) return <p className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">{error}</p>

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
            <h1 className="font-display text-2xl font-semibold text-ink">{t('seasonEnd.emptyTitle')}</h1>
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
          {tie ? t('seasonEnd.tie') : youWon ? t('seasonEnd.youWon') : t('seasonEnd.rivalWon', { rival: partnerName })}
        </h1>
        <p className="vp-rise mb-6 mt-2 text-[15px] font-bold text-muted" style={{ animationDelay: '0.15s' }}>
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
            <ScoreSide name={t('season.you')} initial="V" score={last.you} tone="you" winner={youWon || tie} />

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

function ScoreSide({
  name,
  initial,
  score,
  tone,
  winner,
}: {
  name: string
  initial: string
  score: number
  tone: 'you' | 'rival'
  winner: boolean
}) {
  const isYou = tone === 'you'
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <div className={winner ? '' : 'opacity-80'}>
        <Avatar initial={initial} tone={tone} size={48} />
      </div>
      <div className={`text-[11px] font-extrabold uppercase tracking-wide ${isYou ? 'text-brand-ink' : 'text-rival-ink'}`}>
        {name}
      </div>
      <div className={`font-display text-[32px] font-semibold leading-none ${winner ? 'text-arena-text' : 'text-arena-muted'}`}>
        {score}
      </div>
    </div>
  )
}

/** Confete nas 3 cores da marca, feito com CSS. Respeita prefers-reduced-motion. */
function Confetti() {
  const pieces = [
    { left: '8%', color: 'var(--brand)', dur: '3.2s', delay: '0s' },
    { left: '18%', color: 'var(--success)', dur: '3.8s', delay: '0.6s' },
    { left: '28%', color: 'var(--rival)', dur: '3s', delay: '1.1s' },
    { left: '40%', color: 'var(--brand)', dur: '4s', delay: '0.3s' },
    { left: '52%', color: 'var(--success)', dur: '3.4s', delay: '0.9s' },
    { left: '62%', color: 'var(--rival)', dur: '3.6s', delay: '1.4s' },
    { left: '72%', color: 'var(--brand)', dur: '3.1s', delay: '0.2s' },
    { left: '82%', color: 'var(--success)', dur: '3.9s', delay: '0.8s' },
    { left: '92%', color: 'var(--rival)', dur: '3.3s', delay: '1.2s' },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="vp-conf"
          style={{ left: p.left, background: p.color, animationDuration: p.dur, animationDelay: p.delay }}
        />
      ))}
    </div>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M18 2H6v2H3a1 1 0 0 0-1 1v2a4 4 0 0 0 4 4 6 6 0 0 0 5 3.91V18H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-3.09A6 6 0 0 0 18 11a4 4 0 0 0 4-4V5a1 1 0 0 0-1-1h-3V2ZM4 7V6h2v3a2 2 0 0 1-2-2Zm16 0a2 2 0 0 1-2 2V6h2v1ZM7 21a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2H7Z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[26px] w-[26px] fill-success" aria-hidden="true">
      <path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9z" />
    </svg>
  )
}

function BowlIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-carb" aria-hidden="true">
      <path d="M3 11h18a1 1 0 0 1 1 1 9 9 0 0 1-5 8.06V21a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-.94A9 9 0 0 1 2 12a1 1 0 0 1 1-1Zm9-9c2.21 0 4 1.34 4 3 0 .67-.3 1.28-.8 1.78.5.4.8.93.8 1.52V9h-2v-.7c0-.3-.4-.55-1-.55s-1 .25-1 .55V9h-2v-.18c0-.59.3-1.12.8-1.52-.5-.5-.8-1.11-.8-1.78 0-1.66 1.79-3 4-3Z" />
    </svg>
  )
}

/* ---------------- helpers ---------------- */

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'P'
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

/**
 * Keyframes locais da celebração. prefers-reduced-motion para tudo (confete some).
 */
function ScopedStyles() {
  return (
    <style>{`
      @keyframes vp-pop {
        0% { opacity: 0; transform: scale(.8) translateY(20px); }
        60% { transform: scale(1.04); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes vp-rise {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: none; }
      }
      @keyframes vp-glow {
        0%, 100% { opacity: .4; transform: scale(1); }
        50% { opacity: .7; transform: scale(1.06); }
      }
      @keyframes vp-fall {
        0% { transform: translateY(-40px) rotate(0); opacity: 0; }
        10% { opacity: 1; }
        100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
      }
      .vp-pop { animation: vp-pop .6s cubic-bezier(.34,1.4,.5,1) both; }
      .vp-rise { animation: vp-rise .5s ease both; }
      .vp-glow { animation: vp-glow 2.4s ease-in-out infinite; }
      .vp-conf {
        position: absolute; top: 0;
        width: 9px; height: 9px; border-radius: 2px;
        animation: vp-fall linear infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .vp-pop, .vp-rise, .vp-glow, .vp-bob { animation: none !important; }
        .vp-conf { display: none !important; }
      }
    `}</style>
  )
}
