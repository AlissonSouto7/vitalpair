/**
 * The icons the missions screen draws.
 *
 * Moved out of MissionsPage verbatim, paths and classes included.
 */

export function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
    </svg>
  )
}

export function ForkKnifeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 2v7a2 2 0 002 2v11h2V11a2 2 0 002-2V2h-1.5v6h-1V2h-1v6h-1V2zm9 0c-1.7 0-3 2-3 5s1.3 4.5 2 4.5V22h2V2z" />
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

export function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M8 7a3 3 0 116 0 3 3 0 01-6 0zm9 1.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM3 19c0-3 2.7-5 8-5s8 2 8 5v1H3zm16.5-1H21v-1c0-2-1-3.4-2.8-4.2 2 .6 3 2 3 4.2v1z" />
    </svg>
  )
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  )
}
