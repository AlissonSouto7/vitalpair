import type { ReactNode } from 'react'

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

export function Macro({
  label,
  value,
  target,
  tone,
}: {
  label: string
  value: number
  target: number | null
  tone: 'brand' | 'carb' | 'success'
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0
  const bar = tone === 'brand' ? 'bg-brand' : tone === 'carb' ? 'bg-carb' : 'bg-success'
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-bold text-ink">{label}</span>
        <span className="font-bold text-muted">
          {Math.round(value)}
          {target != null ? ` / ${target} g` : ' g'}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-track">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Dot({ tone }: { tone: 'brand' | 'carb' | 'success' }) {
  const bg = tone === 'brand' ? 'bg-brand' : tone === 'carb' ? 'bg-carb' : 'bg-success'
  return <span className={`h-2 w-2 rounded-full ${bg}`} aria-hidden="true" />
}
