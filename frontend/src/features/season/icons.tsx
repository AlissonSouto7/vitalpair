/**
 * The icons the season screen draws.
 *
 * Moved out of SeasonPage verbatim, paths and classes included, so the decomposition cannot
 * change what is drawn.
 */
/* ---------- ícones ---------- */

export function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 4h10v2h3v3a4 4 0 01-4 4 5 5 0 01-3 2v2h3v3H8v-3h3v-2a5 5 0 01-3-2 4 4 0 01-4-4V6h3zm0 4H6v1a2 2 0 002 2zm10 0v3a2 2 0 002-2V8z" />
    </svg>
  )
}

export function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px] fill-current" aria-hidden="true">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.7-4-2.3z" />
    </svg>
  )
}

export function MedalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px] fill-current" aria-hidden="true">
      <path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9z" />
    </svg>
  )
}

export function DishIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px] fill-current" aria-hidden="true">
      <path d="M12 5a8 8 0 00-7.9 7h15.8A8 8 0 0012 5zM3 14h18v2H3zm-1 4h20v2H2z" />
    </svg>
  )
}

export function ForkKnifeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 2v7a2 2 0 01-1 1.7V22H8v-11.3A2 2 0 017 9V2zm2 0v6h1.5V2zm-4 0v6h1.5V2zM16 2c-1.7 0-3 2.5-3 5.5 0 2.4.9 4 2 4.5V22h2V2z" />
    </svg>
  )
}

export function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 10.5h2V9a1.5 1.5 0 013 0v6a1.5 1.5 0 01-3 0v-1.5H3zm18 0h-2V9a1.5 1.5 0 00-3 0v6a1.5 1.5 0 003 0v-1.5h2zM7.5 11h9v2h-9z" />
    </svg>
  )
}

export function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2c1 3-1 4-2 6s-2 3 .5 5c0-1.5 1-2.5 1.5-3 .5 2 2.5 2.5 2.5 5a4 4 0 11-8 0c0-4 4-5 2.5-9C11 9 13 6 12 2z" />
    </svg>
  )
}

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9z" />
    </svg>
  )
}

/* ---------- helpers ---------- */
