import type { ReactNode } from 'react'

import { fmtKg } from './format'
import { type TFn } from './profileForm'

import { WeightForm } from '@/features/progress/WeightForm'
import type { WeightPoint } from '@/types/progress'

/**
 * The cards the profile screen is built from.
 *
 * Moved out of ProfilePage verbatim, markup untouched.
 */

export function WeightCard({
  weights,
  currentWeight,
  onLogged,
  t,
}: {
  weights: WeightPoint[]
  currentWeight: number | null
  onLogged: () => Promise<void>
  t: TFn
}) {
  const delta = weights.length >= 2 ? weights[weights.length - 1].weightKg - weights[0].weightKg : 0
  const perdeu = delta < 0

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
            {t('profile.todayWeight')}
          </p>
          <p className="font-display text-[32px] font-semibold leading-none text-ink">
            {currentWeight != null ? `${fmtKg(currentWeight)} kg` : '--'}
          </p>
          {Math.abs(delta) >= 0.05 && (
            <p
              className={`mt-1 text-[13px] font-extrabold ${perdeu ? 'text-success-ink' : 'text-brand-ink'}`}
            >
              {perdeu
                ? t('profile.weightDown', { kg: fmtKg(Math.abs(delta)) })
                : t('profile.weightUp', { kg: fmtKg(Math.abs(delta)) })}
            </p>
          )}
        </div>
        {weights.length >= 2 && <Sparkline weights={weights} />}
      </div>

      <WeightForm
        label={t('profile.updateWeight')}
        submitLabel={t('common.save')}
        placeholder={t('profile.weightPlaceholder')}
        onLogged={onLogged}
        className="mt-4 border-t border-hair pt-4"
      />
    </section>
  )
}

export function Sparkline({ weights }: { weights: WeightPoint[] }) {
  const values = weights.slice(-8).map((w) => w.weightKg)
  const W = 120
  const H = 44
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map(
      (v, i) =>
        `${((i / (values.length - 1)) * W).toFixed(1)},${(H - ((v - min) / span) * (H - 6) - 3).toFixed(1)}`,
    )
    .join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-11 w-[120px] shrink-0" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        className="stroke-brand"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ---------- formulário de edição (recolhido) ---------- */

/* ---------- subcomponentes ---------- */

export function GoalCard({
  active,
  label,
  hint,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  hint: string
  icon: ReactNode
  onClick: () => void
}) {
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
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand text-white' : 'bg-brand-soft text-brand'}`}
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
      <div className={`font-display text-2xl font-semibold ${color}`}>{Math.round(grams)}g</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
    </div>
  )
}
