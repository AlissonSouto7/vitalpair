/**
 * The icons the activity screen uses.
 *
 * Moved out of ActivityPage verbatim, paths and classes included, so the decomposition
 * cannot change what is drawn.
 */

export function IconDumbbell({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${className}`}>
      <path d="M3 11h2V9a1.5 1.5 0 013 0v6a1.5 1.5 0 01-3 0v-1H3zm18 0h-2V9a1.5 1.5 0 00-3 0v6a1.5 1.5 0 003 0v-1h2zM7.5 11h9v2h-9z" />
    </svg>
  )
}

export function IconShoe({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${className}`}>
      <path d="M2 16a1 1 0 011-1h3l2.2-3.3a1 1 0 011.5-.2l1.5 1.2 1.1-1.5a1 1 0 011.5-.1l1.2 1.1 2.3.6A3 3 0 0122 15.8V18a1 1 0 01-1 1H3a1 1 0 01-1-1zm3-3v2h2l-1.4-2.1z" />
    </svg>
  )
}

export function IconRun({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${className}`}>
      <path d="M13.5 5.5a2 2 0 11-4 0 2 2 0 014 0zM6.8 14l1.7-3 2 1.3-.7 2.5 2.7 2.4.9 4.3-2 .4-.8-3.6-2.8-2.5L6.5 19l-1.8-.9 2-3.6zm6.1-4.7 1.7 1.2 2.1-.2.2 2-3 .3-2.5-1.8z" />
    </svg>
  )
}

export function IconBike({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${className}`}>
      <path d="M5.5 14.5a3 3 0 100 6 3 3 0 000-6zm0 1.6a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8zM18.5 14.5a3 3 0 100 6 3 3 0 000-6zm0 1.6a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8zM14 5a1 1 0 100 2h1.2l.9 1.6-3.3 3.4-2-3H13a1 1 0 100-2H8.5a1 1 0 00-.85 1.53L9.4 12 8 15.4l1.5.6 1.6-3.8 2.3 3.3.8-.6-.05-.07L17 11.3l.6 1a1 1 0 00.9.5l-.5-1-1.6-2.9L15.7 5z" />
    </svg>
  )
}

export function IconPlug({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] fill-current ${className}`}>
      <path d="M9 2a1 1 0 011 1v4h4V3a1 1 0 112 0v4h1a1 1 0 110 2h-1v2a5 5 0 01-4 4.9V21a1 1 0 11-2 0v-3.1A5 5 0 016 13v-2H5a1 1 0 110-2h1V3a1 1 0 011-1z" />
    </svg>
  )
}

export function IconPlus({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] fill-current ${className}`}>
      <path d="M11 5a1 1 0 112 0v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6z" />
    </svg>
  )
}

export function IconSpark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-current ${className}`}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  )
}

export function IconEmpty({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-8 w-8 fill-current ${className}`}>
      <path d="M13.5 5.5a2 2 0 11-4 0 2 2 0 014 0zM6.8 14l1.7-3 2 1.3-.7 2.5 2.7 2.4.9 4.3-2 .4-.8-3.6-2.8-2.5L6.5 19l-1.8-.9 2-3.6zm6.1-4.7 1.7 1.2 2.1-.2.2 2-3 .3-2.5-1.8z" />
    </svg>
  )
}
