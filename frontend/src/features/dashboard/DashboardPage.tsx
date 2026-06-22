import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/dashboard'
import type { Dashboard } from '../../types/dashboard'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { Bar } from '../../components/ui/Bar'

export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError('Não foi possível carregar o dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted">Carregando...</p>
  if (error) return <p className="rounded-lg bg-red-500/10 px-3 py-2 text-red-500">{error}</p>
  if (!data) return null

  const me = data.me
  const over = me.remainingCalories != null && me.remainingCalories < 0
  const ringColor = over ? '#f87171' : '#a3e635'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Hoje</h1>
        <p className="text-sm text-faint">{formatDate(data.date)}</p>
      </div>

      {me.calorieTarget == null && (
        <Link to="/profile" className="block rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-warn hover:bg-amber-500/20">
          ⚡ Complete seu perfil para liberar suas metas e o placar →
        </Link>
      )}

      {/* Hero: anel de calorias */}
      <div className="card flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <ProgressRing value={me.consumedCalories} max={me.calorieTarget} color={ringColor}>
            <span className="text-2xl font-extrabold" style={{ color: ringColor }}>
              {me.consumedCalories}
            </span>
            <span className="text-xs text-faint">
              {me.calorieTarget != null ? `de ${me.calorieTarget}` : 'kcal'}
            </span>
          </ProgressRing>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-faint">Restante</p>
            <p className="text-3xl font-extrabold" style={{ color: ringColor }}>
              {me.remainingCalories != null ? `${me.remainingCalories}` : '—'}
              <span className="text-base font-medium text-faint"> kcal</span>
            </p>
            <p className="text-xs text-faint">
              consumido {me.consumedCalories} · gasto {me.burnedCalories} · saldo {me.netCalories}
            </p>
          </div>
        </div>

        {data.partner && (
          <div className="w-full rounded-xl border border-line bg-surface2/40 p-3 sm:w-44">
            <p className="text-xs text-faint">Parceiro</p>
            <p className="font-semibold text-info">{data.partner.name}</p>
            <p className="mt-1 text-sm text-ink">
              saldo <span className="font-bold">{data.partner.netCalories}</span> kcal
            </p>
            <p className="text-xs text-faint">
              {data.partner.consumedCalories} consumido · {data.partner.burnedCalories} gasto
            </p>
          </div>
        )}
      </div>

      {/* Macros */}
      <div className="card">
        <h2 className="mb-4 text-sm font-semibold text-ink">Macros</h2>
        <div className="space-y-4">
          <Macro label="Proteína" value={me.consumedProteinG} target={me.proteinTargetG} color="bg-lime-400" />
          <Macro label="Carboidrato" value={me.consumedCarbG} target={me.carbTargetG} color="bg-cyan-400" />
          <Macro label="Gordura" value={me.consumedFatG} target={me.fatTargetG} color="bg-amber-400" />
        </div>
        <p className="mt-4 text-xs text-faint">
          {me.mealCount} refeição(ões) · {me.steps} passos
        </p>
      </div>
    </div>
  )
}

function Macro({
  label,
  value,
  target,
  color,
}: {
  label: string
  value: number
  target: number | null
  color: string
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="text-faint">
          {value}
          {target != null ? ` / ${target} g` : ' g'}
        </span>
      </div>
      <Bar value={value} max={target} color={color} />
    </div>
  )
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
