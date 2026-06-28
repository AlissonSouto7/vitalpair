import { useTranslation } from 'react-i18next'
import { Avatar } from '../../components/ui/Avatar'
import { Points } from '../../components/ui/Badge'

/**
 * Fim de temporada — a ÚNICA tela de celebração do app.
 * Confete nas 3 cores da marca (laranja=você, roxo=Célia, verde=vitória),
 * troféu com aura, placar final, aposta a pagar e recompensas.
 * Renderiza só o conteúdo: o Layout (sidebar etc.) já vem por fora.
 *
 * Lei das cores: laranja = você · roxo = Célia · verde = pontos/vitória · dourado = carb.
 * Tudo via tokens; só as partículas de confete usam var(--brand|rival|success).
 */

// TODO: ligar backend — buscar resultado real da temporada (vencedor, placar, aposta, recompensas).
const SEASON = {
  number: 1,
  youName: 'Você',
  youInitial: 'A',
  youScore: 980,
  rivalName: 'Célia',
  rivalInitial: 'C',
  rivalScore: 920,
  stake: 'A Célia te paga o jantar. Combinado é combinado.',
  rewards: [
    { points: 320, label: 'Streak de 21 dias seguidos' },
    { points: 180, label: 'Bateu a meta de calorias 26 vezes' },
    { points: 120, label: 'Venceu 4 missões relâmpago' },
  ],
}

export function SeasonEndPage() {
  const { t } = useTranslation()
  const youWon = SEASON.youScore >= SEASON.rivalScore
  const lead = Math.abs(SEASON.youScore - SEASON.rivalScore)
  const totalRewards = SEASON.rewards.reduce((sum, r) => sum + r.points, 0)

  return (
    <div className="relative -mx-4 -my-4 min-h-[calc(100vh-6rem)] overflow-hidden sm:-mx-6 sm:-my-6">
      <Confetti />

      <div className="relative z-10 mx-auto flex max-w-[520px] flex-col items-center px-4 py-10 text-center">
        {/* Faixa de abertura */}
        <p className="vp-rise text-xs font-extrabold uppercase tracking-[0.16em] text-brand-ink">
          {t('seasonEnd.banner', { n: String(SEASON.number).padStart(2, '0') })}
        </p>

        {/* Troféu com aura */}
        <div className="vp-pop relative my-2 h-[150px] w-[150px]">
          <div className="vp-glow absolute -inset-3 rounded-full bg-[radial-gradient(circle,var(--brand-soft),transparent_68%)]" />
          <div className="vp-bob relative flex h-[150px] w-[150px] items-center justify-center rounded-[42px] bg-gradient-to-br from-brand to-brand-ink shadow-[0_16px_40px_rgba(255,107,44,0.45)]">
            <TrophyIcon />
          </div>
        </div>

        {/* Título celebrativo */}
        <h1
          className="vp-rise mt-3 font-display text-[38px] font-semibold leading-none tracking-tight text-ink"
          style={{ animationDelay: '0.1s' }}
        >
          {youWon ? t('seasonEnd.youWon') : t('seasonEnd.rivalWon', { rival: SEASON.rivalName })}
        </h1>
        <p
          className="vp-rise mb-6 mt-2 text-[15px] font-bold text-muted"
          style={{ animationDelay: '0.15s' }}
        >
          {youWon
            ? t('seasonEnd.youWonText', { lead, rival: SEASON.rivalName })
            : t('seasonEnd.rivalWonText', { lead, rival: SEASON.rivalName })}
        </p>

        {/* Placar final */}
        <div
          className="vp-rise w-full rounded-[20px] border border-arena-border bg-arena px-6 py-5 shadow-[0_14px_36px_var(--arena-shadow)]"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-center justify-between">
            <ScoreSide
              name={SEASON.youName}
              initial={SEASON.youInitial}
              score={SEASON.youScore}
              tone="you"
              winner={youWon}
            />

            <div className="flex flex-col items-center gap-1 px-2">
              <StarIcon />
              <span className="whitespace-nowrap text-[10px] font-extrabold text-success-ink">
                {t('seasonEnd.lead', { lead })}
              </span>
            </div>

            <ScoreSide
              name={SEASON.rivalName}
              initial={SEASON.rivalInitial}
              score={SEASON.rivalScore}
              tone="rival"
              winner={!youWon}
            />
          </div>
        </div>

        {/* Aposta a pagar */}
        <div
          className="vp-rise mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-carb/30 bg-carb/10 px-5 py-4"
          style={{ animationDelay: '0.25s' }}
        >
          <BowlIcon />
          <span className="text-sm font-extrabold text-ink">{SEASON.stake}</span>
        </div>

        {/* Recompensas da temporada */}
        <div
          className="vp-rise mt-3 w-full rounded-2xl border border-hair bg-surface p-5 text-left"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">{t('seasonEnd.rewardsTitle')}</h2>
            <span className="font-display text-xl font-semibold text-success-ink">{totalRewards}</span>
          </div>
          <ul className="space-y-2.5">
            {SEASON.rewards.map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-ink">{r.label}</span>
                <Points value={r.points} />
              </li>
            ))}
          </ul>
        </div>

        {/* Ações */}
        <button
          className="vp-rise btn-primary mt-6 w-full py-4 text-base shadow-[0_8px_22px_rgba(255,107,44,0.35)]"
          style={{ animationDelay: '0.35s' }}
          onClick={() => {
            // TODO: ligar backend — iniciar nova temporada.
          }}
        >
          {t('seasonEnd.newSeason')}
        </button>
        <button
          className="vp-rise mt-3 text-[13px] font-extrabold text-muted transition hover:text-ink"
          style={{ animationDelay: '0.4s' }}
          onClick={() => {
            // TODO: ligar backend — abrir resumo completo dos 30 dias.
          }}
        >
          {t('seasonEnd.seeSummary')}
        </button>
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
      <div
        className={`text-[11px] font-extrabold uppercase tracking-wide ${
          isYou ? 'text-brand-ink' : 'text-rival-ink'
        }`}
      >
        {name}
      </div>
      <div
        className={`font-display text-[32px] font-semibold leading-none ${
          winner ? 'text-arena-text' : 'text-arena-muted'
        }`}
      >
        {score}
      </div>
    </div>
  )
}

/** Confete nas 3 cores da marca, feito com CSS. Respeita prefers-reduced-motion. */
function Confetti() {
  // posição/cor/timing fixos pra ficar determinístico (sem layout shift).
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
          style={{
            left: p.left,
            background: p.color,
            animationDuration: p.dur,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[74px] w-[74px] fill-white" aria-hidden="true">
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

/**
 * Keyframes locais da celebração. Mantidos aqui pra não tocar arquivos compartilhados.
 * Reusa o vp-bob global; adiciona pop/rise/glow/queda do confete.
 * prefers-reduced-motion: para tudo (inclusive o confete some).
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
