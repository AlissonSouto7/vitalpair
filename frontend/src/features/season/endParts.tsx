/**
 * The celebration screen's own pieces.
 *
 * Moved out of SeasonEndPage verbatim, markup untouched. A note here used to claim its
 * TrophyIcon, StarIcon and initial only looked like duplicates of the ones next door.
 * Measured, one of the three was true: `TrophyIcon` really is a different drawing, a
 * different path and not a copy, so it stays. `StarIcon` had a byte-identical path and the
 * screen now takes it from ./icons, passing in the green this screen fixed by hand; `initial` was the same two lines with 'P'
 * as the fallback, which read as the initial of a person named P, and it comes from
 * shared/format/name with '?'.
 */

import { Avatar } from '@/components/ui/Avatar'

export function ScoreSide({
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
        className={`text-[11px] font-extrabold uppercase tracking-wide ${isYou ? 'text-you-ink' : 'text-pair-ink'}`}
      >
        {name}
      </div>
      <div
        className={`font-display text-[32px] font-semibold leading-none ${winner ? 'text-arena-text' : 'text-arena-muted'}`}
      >
        {score}
      </div>
    </div>
  )
}

/** Confete nas 3 cores da marca, feito com CSS. Respeita prefers-reduced-motion. */
export function Confetti() {
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

export function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M18 2H6v2H3a1 1 0 0 0-1 1v2a4 4 0 0 0 4 4 6 6 0 0 0 5 3.91V18H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-3.09A6 6 0 0 0 18 11a4 4 0 0 0 4-4V5a1 1 0 0 0-1-1h-3V2ZM4 7V6h2v3a2 2 0 0 1-2-2Zm16 0a2 2 0 0 1-2 2V6h2v1ZM7 21a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2H7Z" />
    </svg>
  )
}

export function BowlIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-carb" aria-hidden="true">
      <path d="M3 11h18a1 1 0 0 1 1 1 9 9 0 0 1-5 8.06V21a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-.94A9 9 0 0 1 2 12a1 1 0 0 1 1-1Zm9-9c2.21 0 4 1.34 4 3 0 .67-.3 1.28-.8 1.78.5.4.8.93.8 1.52V9h-2v-.7c0-.3-.4-.55-1-.55s-1 .25-1 .55V9h-2v-.18c0-.59.3-1.12.8-1.52-.5-.5-.8-1.11-.8-1.78 0-1.66 1.79-3 4-3Z" />
    </svg>
  )
}

/* ---------------- helpers ---------------- */

/**
 * Keyframes locais da celebração. prefers-reduced-motion para tudo (confete some).
 */
export function ScopedStyles() {
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
