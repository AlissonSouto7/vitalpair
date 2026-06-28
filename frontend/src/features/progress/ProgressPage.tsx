import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { getProgress, recordWeight } from '../../api/progress'
import type { CalorieDay, MacroAverage, ProgressView, WeightPoint } from '../../types/progress'

/**
 * Progresso — peso, calorias e macros ao longo do tempo (dados reais).
 * Lei das cores: laranja = você/peso/proteína, dourado = carbo, verde = saúde/dentro da meta.
 */

type Tab = 'peso' | 'calorias' | 'macros'

export function ProgressPage() {
  const [tab, setTab] = useState<Tab>('peso')
  const [data, setData] = useState<ProgressView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const view = await getProgress()
    setData(view)
  }, [])

  useEffect(() => {
    load()
      .catch(() => setError('Não rolou carregar seu progresso agora. Tenta de novo daqui a pouco.'))
      .finally(() => setLoading(false))
  }, [load])

  if (loading) return <p className="font-bold text-muted">Carregando...</p>
  if (error) return <p className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">Seu progresso</h1>
        <p className="mt-1 text-sm font-semibold text-muted">Dá pra ver de longe que você tá indo bem.</p>
      </header>

      <Tabs tab={tab} onChange={setTab} />

      {tab === 'peso' && <PainelPeso weights={data.weights} onLogged={load} />}
      {tab === 'calorias' && <PainelCalorias calories={data.calories} targetKcal={data.targetKcal} />}
      {tab === 'macros' && <PainelMacros macros={data.macros} />}
    </div>
  )
}

function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string }[] = [
    { id: 'peso', label: 'Peso' },
    { id: 'calorias', label: 'Calorias' },
    { id: 'macros', label: 'Macros' },
  ]
  return (
    <div className="flex max-w-[340px] gap-1.5 rounded-2xl bg-track p-1">
      {items.map((it) => {
        const active = tab === it.id
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            aria-pressed={active}
            className={`flex-1 rounded-xl px-3 py-2 text-sm transition ${
              active
                ? 'bg-surface font-extrabold text-ink shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                : 'font-bold text-muted hover:text-ink'
            }`}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Peso ---------- */

function PainelPeso({ weights, onLogged }: { weights: WeightPoint[]; onLogged: () => Promise<void> }) {
  const [valor, setValor] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function registrar(e: FormEvent) {
    e.preventDefault()
    const kg = Number(valor.replace(',', '.'))
    if (!kg || kg <= 0) return
    setSalvando(true)
    setErro(null)
    try {
      await recordWeight(kg)
      setValor('')
      await onLogged()
    } catch {
      setErro('Não rolou registrar o peso. Tenta de novo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4">
      {weights.length >= 2 ? (
        <WeightChart weights={weights} />
      ) : (
        <section className="card flex flex-col items-center gap-2 !rounded-[18px] py-10 text-center">
          {weights.length === 1 ? (
            <>
              <span className="font-display text-[32px] font-semibold leading-none text-ink">
                {fmtKg(weights[0].weightKg)} kg
              </span>
              <p className="text-sm font-semibold text-muted">
                Esse é seu peso de agora. Registra de novo daqui uns dias que a linha começa a desenhar.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-ink">Sem peso registrado ainda</h2>
              <p className="text-sm font-semibold text-muted">Joga seu peso aí embaixo que o gráfico nasce.</p>
            </>
          )}
        </section>
      )}

      {/* registrar peso de hoje */}
      <form onSubmit={registrar} className="card flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label">Registrar peso de hoje</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step="0.1"
              inputMode="decimal"
              placeholder="ex: 78.0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="input"
            />
            <span className="text-sm font-extrabold text-muted">kg</span>
          </div>
        </div>
        <button type="submit" disabled={salvando || !valor} className="btn-primary disabled:opacity-60">
          {salvando ? 'Salvando...' : 'Registrar'}
        </button>
      </form>
      {erro && <p className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">{erro}</p>}
    </div>
  )
}

function WeightChart({ weights }: { weights: WeightPoint[] }) {
  const values = weights.map((w) => w.weightKg)
  const inicio = values[0]
  const atual = values[values.length - 1]
  const delta = atual - inicio
  const perdeu = delta < 0

  const W = 600
  const H = 200
  const padTop = 24
  const padBottom = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const usableH = H - padTop - padBottom

  const pontos = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = padTop + (1 - (v - min) / span) * usableH
    return { x, y }
  })
  const polyline = pontos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const ultimo = pontos[pontos.length - 1]
  const area = `${polyline} ${W},${H - padBottom} 0,${H - padBottom}`

  return (
    <section className="card !rounded-[18px] !p-6">
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-[32px] font-semibold leading-none text-ink">{fmtKg(atual)} kg</span>
        {Math.abs(delta) >= 0.05 && (
          <span className={`text-sm font-extrabold ${perdeu ? 'text-success-ink' : 'text-brand-ink'}`}>
            {perdeu ? '−' : '+'}
            {fmtKg(Math.abs(delta))} kg desde {fmtDate(weights[0].date)}
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full overflow-visible" role="img" aria-label="Linha do seu peso">
        {[40, 100, 160].map((y) => (
          <line key={y} x1={0} y1={y} x2={W} y2={y} className="stroke-hair" strokeWidth={1} />
        ))}
        <polygon points={area} className="fill-brand/10" />
        <polyline
          points={polyline}
          fill="none"
          className="stroke-brand"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={ultimo.x} cy={ultimo.y} r={6} className="fill-brand stroke-surface" strokeWidth={3} />
      </svg>

      <div className="mt-2.5 flex justify-between text-[11px] font-bold text-muted">
        <span>{fmtDate(weights[0].date)}</span>
        <span>hoje</span>
      </div>
    </section>
  )
}

/* ---------- Calorias ---------- */

function PainelCalorias({ calories, targetKcal }: { calories: CalorieDay[]; targetKcal: number | null }) {
  const maxKcal = Math.max(targetKcal ?? 0, ...calories.map((d) => d.kcal), 1)
  const teto = maxKcal * 1.05
  const metaPct = targetKcal ? (targetKcal / teto) * 100 : 0

  return (
    <section className="card !rounded-[18px] !p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold text-muted">Consumo vs. meta, últimos 7 dias</span>
        {targetKcal != null && (
          <span className="text-[13px] font-extrabold text-ink">{targetKcal.toLocaleString('pt-BR')} kcal/dia</span>
        )}
      </div>

      <div className="relative h-[150px]">
        {targetKcal != null && (
          <div className="absolute inset-x-0 z-10 border-t-2 border-dashed border-success/60" style={{ bottom: `${metaPct}%` }}>
            <span className="absolute -top-4 right-0 text-[10px] font-extrabold text-success-ink">meta</span>
          </div>
        )}

        <div className="flex h-full items-end gap-3.5">
          {calories.map((d, i) => {
            const h = (d.kcal / teto) * 100
            const cor = d.kcal === 0 ? 'bg-track' : d.withinGoal ? 'bg-success' : 'bg-brand'
            return (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-1.5 text-[10px] font-extrabold text-muted">
                  {d.kcal > 0 ? `${(d.kcal / 1000).toFixed(1)}k` : '—'}
                </span>
                <div className={`w-3/5 rounded-t-md transition-all ${cor}`} style={{ height: `${Math.max(h, 1)}%` }} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-3.5">
        {calories.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[11px] font-extrabold text-muted">
            {d.label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11.5px] font-extrabold">
        <Legenda cor="bg-success" texto="dentro da meta" classeTexto="text-success-ink" />
        <Legenda cor="bg-brand" texto="passou um pouco" classeTexto="text-brand-ink" />
      </div>
    </section>
  )
}

function Legenda({ cor, texto, classeTexto }: { cor: string; texto: string; classeTexto: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${classeTexto}`}>
      <span className={`h-2.5 w-2.5 rounded-[3px] ${cor}`} />
      {texto}
    </span>
  )
}

/* ---------- Macros ---------- */

function PainelMacros({ macros }: { macros: MacroAverage[] }) {
  const barCls: Record<MacroAverage['key'], string> = {
    PROTEIN: 'bg-brand',
    CARB: 'bg-carb',
    FAT: 'bg-success',
  }
  return (
    <section className="card flex flex-col gap-[18px] !rounded-[18px] !p-6">
      {macros.map((m) => {
        const pct = m.targetG ? Math.min(100, Math.round((m.avgG / m.targetG) * 100)) : m.avgG > 0 ? 100 : 0
        return (
          <div key={m.key}>
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span className="font-extrabold text-ink">{m.label}</span>
              <span className="font-bold text-muted">
                média {m.avgG}g{m.targetG != null ? ` / alvo ${m.targetG}g` : ''} / dia
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-md bg-track">
              <div className={`h-full rounded-md ${barCls[m.key]}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
      <p className="text-[12.5px] font-semibold text-muted">
        Média dos últimos 7 dias. Vai registrando que isso aqui fica cada vez mais com a sua cara.
      </p>
    </section>
  )
}

/* ---------- helpers ---------- */

function fmtKg(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
