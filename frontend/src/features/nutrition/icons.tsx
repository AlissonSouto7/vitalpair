/**
 * The icons the nutrition screens share.
 *
 * Their own module because three tabs, the meal list and the editor all draw from the same
 * set, and duplicating a path per file is how two of them end up subtly different. Moved
 * here unchanged, paths and classes included, so the decomposition cannot alter what is
 * drawn.
 */

export function CameraIcon({ big }: { big?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={big ? 'h-7 w-7' : 'h-4 w-4'}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 3l-1.5 2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.5L15 3H9zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-muted"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 3a7 7 0 105.3 11.6l4 4 1.7-1.7-4-4A7 7 0 0010 3zm0 2.4a4.6 4.6 0 110 9.2 4.6 4.6 0 010-9.2z" />
    </svg>
  )
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.9 5.9 19.4 7.4 12.9l-5-4.3L9 8z" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
    </svg>
  )
}

export function ForkIcon({ small }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={small ? 'h-5 w-5 text-brand' : 'h-7 w-7 text-brand'}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 2v7a3 3 0 0 0 2 2.83V22h2V11.83A3 3 0 0 0 13 9V2h-2v6H9.5V2h-1.5v6H7zM17 2c-1.7 0-3 2.2-3 5 0 2.4 1 4.3 2 4.8V22h2V2z" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12H7zm3 2v8h2v-8zm4 0v8h2v-8z" />
    </svg>
  )
}
