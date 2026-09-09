/**
 * The icons and the goal wording the workout screen uses.
 *
 * Moved out of WorkoutPlanPage verbatim, markup untouched.
 */

/* ---------- ícones (SVG preenchidos) ---------- */

export function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[15px] w-[15px] fill-current ${className}`}>
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  )
}

export function IconSpark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <path d="M12 2l1.9 4.6L18.5 8 14 9.8 12.4 14.5 10.6 9.9 6 8.4l4.6-1.7zM6 14l.9 2.3L9 17l-2.1.9L6 20l-.9-2.1L3 17l2.1-.7zm12 1 .7 1.8L20 18l-1.3.6-.7 1.6-.7-1.6L16 18l1.3-.7z" />
    </svg>
  )
}

export function IconFlame({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] fill-current ${className}`}>
      <path d="M13 2c.5 3-1.5 4.4-2.8 5.8C9 9 8 10.2 8 12a4 4 0 002 3.5C9.4 14.7 9.4 13.6 10 13c0 2 1.4 2.7 2.2 3.4.9.8 1.3 1.6 1.3 2.6a3.5 3.5 0 003-3.5c0-2.4-1.4-4-2.6-5.4C12.6 8.6 12 7.4 13 2z" />
    </svg>
  )
}

export function IconRest({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm-1 3a1 1 0 012 0v4.6l3.3 2a1 1 0 01-1 1.7l-3.8-2.3a1 1 0 01-.5-.9z" />
    </svg>
  )
}
