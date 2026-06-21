import { useEffect, useState } from 'react'
import { getDashboard } from '../../api/dashboard'
import type { Dashboard } from '../../types/dashboard'

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

  if (loading) return <p className="text-slate-500">Carregando...</p>
  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>
  if (!data) return null

  const me = data.me

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Hoje</h1>
        <p className="text-sm text-slate-500">{data.date}</p>
      </div>

      {me.calorieTarget == null && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Complete seu perfil para calcular suas metas de calorias e macros.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Consumido" value={`${me.consumedCalories} kcal`} color="text-blue-600" />
        <Stat label="Gasto" value={`${me.burnedCalories} kcal`} color="text-amber-600" />
        <Stat label="Saldo" value={`${me.netCalories} kcal`} color="text-slate-700" />
        <Stat
          label="Restante"
          value={me.remainingCalories == null ? '—' : `${me.remainingCalories} kcal`}
          color={
            me.remainingCalories == null
              ? 'text-slate-400'
              : me.remainingCalories >= 0
                ? 'text-emerald-600'
                : 'text-red-600'
          }
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Macros</h2>
        <div className="space-y-3">
          <MacroBar label="Proteína" consumed={me.consumedProteinG} target={me.proteinTargetG} color="bg-emerald-500" />
          <MacroBar label="Carboidrato" consumed={me.consumedCarbG} target={me.carbTargetG} color="bg-amber-500" />
          <MacroBar label="Gordura" consumed={me.consumedFatG} target={me.fatTargetG} color="bg-sky-500" />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {me.mealCount} refeição(ões) · {me.steps} passos
        </p>
      </section>

      {data.partner && <PartnerCard partner={data.partner} />}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}

function MacroBar({
  label,
  consumed,
  target,
  color,
}: {
  label: string
  consumed: number
  target: number | null
  color: string
}) {
  const percent = target && target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>
          {consumed}
          {target != null ? ` / ${target} g` : ' g'}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function PartnerCard({ partner }: { partner: NonNullable<Dashboard['partner']> }) {
  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50 p-4">
      <h2 className="mb-2 text-sm font-semibold text-violet-800">Parceiro: {partner.name}</h2>
      <div className="grid grid-cols-3 gap-3 text-center">
        <PartnerStat label="Consumido" value={partner.consumedCalories} />
        <PartnerStat label="Gasto" value={partner.burnedCalories} />
        <PartnerStat label="Saldo" value={partner.netCalories} />
      </div>
    </section>
  )
}

function PartnerStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-violet-500">{label}</p>
      <p className="font-bold text-violet-800">{value}</p>
    </div>
  )
}
