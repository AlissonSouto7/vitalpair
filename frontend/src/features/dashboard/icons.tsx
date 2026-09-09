/**
 * The icons the dashboard draws.
 *
 * Moved out of DashboardPage verbatim, paths and classes included, so the decomposition
 * cannot change what is drawn.
 */
export function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2c1 3-1.5 4-1.5 7A1.5 1.5 0 0012 10c.8-1.6 2.5-1.4 2.5.5 0 1-.7 1.5-.7 2.5 2-1 3-3 2.7-5.5C19 10 20 12.5 20 15a8 8 0 01-16 0c0-4 3-5.5 4-8 .8 1.6 2.5 2 4 1.5C15 7 13 4 12 2z" />
    </svg>
  )
}

export function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M9 4h6l1.2 2H20a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2.8zm3 4.5A4.2 4.2 0 1012 17a4.2 4.2 0 000-8.5z" />
    </svg>
  )
}

export function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M13 2 4.5 13.5h5.5L9 22l8.5-12H12z" />
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
