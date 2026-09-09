/**
 * The icons the onboarding steps use.
 *
 * Copied out of OnboardingPage verbatim: the page was 834 lines and these are the part
 * that never changes with the flow. Hand-drawn rather than from a library because the
 * design's colour law wants shapes that match the product, not generic glyphs.
 */

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

export function IconPair({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 7a3 3 0 116 0 3 3 0 01-6 0zm9 1.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM3 19c0-3 2.7-5 8-5s8 2 8 5v1H3z" />
    </svg>
  )
}

export function IconSolo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z" />
    </svg>
  )
}
