import type { ReactNode } from 'react'

import { MACRO_TONES, type MacroTone } from '@/components/ui/macroTone'

/**
 * The small pieces the nutrition screen is assembled from.
 *
 * Moved out of NutritionPage verbatim, markup untouched. They carry no state and no data
 * fetching, which makes them the part that can leave without changing how anything behaves.
 */

export function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-extrabold transition ${
        active
          ? 'bg-surface text-ink shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
          : 'text-muted hover:text-ink'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

export function Dot({ tone }: { tone: MacroTone }) {
  return <span className={`h-2 w-2 rounded-full ${MACRO_TONES[tone].bg}`} aria-hidden="true" />
}
