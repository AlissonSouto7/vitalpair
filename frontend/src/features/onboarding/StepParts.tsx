import type { ReactNode } from 'react'

/**
 * The pieces each onboarding step is built from.
 *
 * Copied out of OnboardingPage verbatim, markup untouched, so the screens render exactly
 * as before. The page was 834 lines; these are presentational and carry no flow state,
 * which makes them the part that can leave without the steps having to be untangled first.
 */

export function StepWrap({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

export function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[27px] font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-sm font-semibold text-muted">{subtitle}</p>
    </div>
  )
}

export type GoalTone = 'brand' | 'rival' | 'success' | 'carb'

const GOAL_TONE_CLS: Record<GoalTone, { soft: string; fg: string }> = {
  brand: { soft: 'bg-brand-soft', fg: 'text-brand' },
  rival: { soft: 'bg-rival-soft', fg: 'text-rival' },
  success: { soft: 'bg-success-soft', fg: 'text-success' },
  carb: { soft: 'bg-carb/15', fg: 'text-carb-ink' },
}

export function GoalCard({
  active,
  label,
  hint,
  icon,
  tone,
  onClick,
}: {
  active: boolean
  label: string
  hint: string
  icon: ReactNode
  tone: GoalTone
  onClick: () => void
}) {
  const toneCls = GOAL_TONE_CLS[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
        active ? 'border-brand bg-brand-soft' : 'border-hair bg-surface hover:border-brand/50'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneCls.soft} ${toneCls.fg}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-ink">{label}</span>
        <span className="block truncate text-xs font-semibold text-muted">{hint}</span>
      </span>
    </button>
  )
}

export function ActivityRow({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
        active ? 'border-brand bg-brand-soft' : 'border-hair bg-surface hover:border-brand/50'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-ink">{label}</span>
        <span className="block text-xs font-semibold text-muted">{hint}</span>
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          active ? 'bg-brand' : 'border-2 border-track'
        }`}
      >
        {active && <span className="h-1.5 w-1.5 rounded-full bg-surface" />}
      </span>
    </button>
  )
}

export function ModeCard({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean
  onClick: () => void
  tone: 'brand' | 'rival'
  children: ReactNode
}) {
  const activeBorder =
    tone === 'rival' ? 'border-rival bg-rival-soft' : 'border-brand bg-brand-soft'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`block w-full rounded-2xl border p-4 text-left transition ${
        active ? activeBorder : 'border-hair bg-surface hover:border-brand/50'
      }`}
    >
      {children}
    </button>
  )
}

export function MacroCell({
  label,
  grams,
  tone,
}: {
  label: string
  grams: number
  tone: 'brand' | 'carb' | 'success'
}) {
  const color =
    tone === 'brand' ? 'text-brand-ink' : tone === 'carb' ? 'text-carb-ink' : 'text-success-ink'
  return (
    <div className="bg-surface px-3 py-4 text-center">
      <div className={`font-display text-xl font-semibold ${color}`}>{Math.round(grams)}g</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
    </div>
  )
}

export function Unit({ unit, children }: { unit: string; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-faint">
        {unit}
      </span>
    </div>
  )
}
