/**
 * The icons the profile screen draws.
 *
 * Moved out of ProfilePage verbatim, paths and classes included.
 */
/* ---------- ícones SVG preenchidos ---------- */

export function IconTarget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3a9 9 0 109 9h-2a7 7 0 11-7-7zm0 4l5 5-5 5z" />
    </svg>
  )
}

export function IconDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11 4h2v9.2l3.3-3.3 1.4 1.4L12 17 6.3 11.3l1.4-1.4L11 13.2z" />
    </svg>
  )
}

export function IconMuscle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 11h2V9a1.5 1.5 0 013 0v6a1.5 1.5 0 01-3 0v-1H3zm18 0h-2V9a1.5 1.5 0 00-3 0v6a1.5 1.5 0 003 0v-1h2zM7.5 11h9v2h-9z" />
    </svg>
  )
}

export function IconEqual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4 8h16v2.4H4zm0 5.6h16V16H4z" />
    </svg>
  )
}

export function IconSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}
