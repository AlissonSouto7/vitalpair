import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getProgress, recordWeight } from '../../api/progress'
import type { CalorieDay, MacroAverage, ProgressView, WeightPoint } from '../../types/progress'

/**
 * Progresso — peso, calorias e macros ao longo do tempo (dados reais).
 * Lei das cores: laranja = você/peso/proteína, dourado = carbo, verde = saúde/dentro da meta.
 */

type Tab = 'peso' | 'calorias' | 'macros'

export function ProgressPage() {
  const { t } = useTranslation()
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
      .catch(() => setError(t('progress.loadError')))
      .finally(() => setLoading(false))
  }, [load, t])

  if (loading) return <p className="font-bold text-muted">{t('common.loading')}</p>
  if (error) return <p className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">{t('progress.title')}</h1>
        <p className="mt-1 text-sm font-semibold text-muted">{t('progress.subtitle')}</p>
      </header>

      <Tabs tab={tab} onChange={setTab} />

      {tab === 'peso' && <PainelPeso weights={data.weights} onLogged={load} />}
      {tab === 'calorias' && <PainelCalorias calories={data.calories} targetKcal={data.targetKcal} />}
      {tab === 'macros' && <PainelMacros macros={data.macros} />}
    </div>
  )
}

function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const { t } = useTranslation()
  const items: { id: Tab; label: string }[] = [
    { id: 'peso', label: t('progress.tabWeight') },
    { id: 'calorias', label: t('progress.tabCalories') },
    { id: 'macros', label: t('progress.tabMacros') },
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
  const { t } = useTranslation()
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
      setErro(t('progress.weightSaveError'))
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
                {fmtKg(weights[0].weightKg)} {t('progress.weightUnit')}
              </span>
              <p className="text-sm font-semibold text-muted">{t('progress.firstWeightText')}</p>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-ink">{t('progress.noWeightTitle')}</h2>
              <p className="text-sm font-semibold text-muted">{t('progress.noWeightText')}</p>
            </>
          )}
        </section>
      )}

      {/* registrar peso de hoje */}
      <form onSubmit={registrar} className="card flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label">{t('progress.logTodayLabel')}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step="0.1"
              inputMode="decimal"
              placeholder={t('progress.weightPlaceholder')}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="input"
            />
            <span className="text-sm font-extrabold text-muted">{t('progress.weightUnit')}</span>
          </div>
        </div>
        <button type="submit" disabled={salvando || !valor} className="btn-primary disabled:opacity-60">
          {salvando ? t('common.saving') : t('progress.logButton')}
        </button>
      </form>
      {erro && <p className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">{erro}</p>}
    </div>
  )
}

function WeightChart({ weights }: { weights: WeightPoint[] }) {
  const { t } = useTranslation()
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
        <span className="font-display text-[32px] font-semibold leading-none text-ink">
          {fmtKg(atual)} {t('progress.weightUnit')}
        </span>
        {Math.abs(delta) >= 0.05 && (
          <span className={`text-sm font-extrabold ${perdeu ? 'text-success-ink' : 'text-brand-ink'}`}>
            {t('progress.deltaSince', {
              delta: `${perdeu ? '−' : '+'}${fmtKg(Math.abs(delta))}`,
              date: fmtDate(weights[0].date),
            })}
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full overflow-visible" role="img" aria-label={t('progress.chartAria')}>
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
        <span>{t('progress.today')}</span>
      </div>
    </section>
  )
}

/* ---------- Calorias ---------- */

function PainelCalorias({ calories, targetKcal }: { calories: CalorieDay[]; targetKcal: number | null }) {
  const { t } = useTranslation()
  const maxKcal = Math.max(targetKcal ?? 0, ...calories.map((d) => d.kcal), 1)
  const teto = maxKcal * 1.05
  const metaPct = targetKcal ? (targetKcal / teto) * 100 : 0

  return (
    <section className="card !rounded-[18px] !p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold text-muted">{t('progress.caloriesVsGoal')}</span>
        {targetKcal != null && (
          <span className="text-[13px] font-extrabold text-ink">
            {t('progress.kcalPerDay', { kcal: targetKcal.toLocaleString('pt-BR') })}
          </span>
        )}
      </div>

      <div className="relative h-[150px]">
        {targetKcal != null && (
          <div className="absolute inset-x-0 z-10 border-t-2 border-dashed border-success/60" style={{ bottom: `${metaPct}%` }}>
            <span className="absolute -top-4 right-0 text-[10px] font-extrabold text-success-ink">{t('progress.goalLine')}</span>
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
        <Legenda cor="bg-success" texto={t('progress.legendWithinGoal')} classeTexto="text-success-ink" />
        <Legenda cor="bg-brand" texto={t('progress.legendOver')} classeTexto="text-brand-ink" />
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
  const { t } = useTranslation()
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
                {m.targetG != null
                  ? t('progress.macrosAvgTarget', { avg: m.avgG, target: m.targetG })
                  : t('progress.macrosAvg', { avg: m.avgG })}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-md bg-track">
              <div className={`h-full rounded-md ${barCls[m.key]}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
      <p className="text-[12.5px] font-semibold text-muted">{t('progress.macrosFootnote')}</p>
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
