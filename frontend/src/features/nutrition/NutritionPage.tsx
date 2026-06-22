import { useCallback, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { deleteLog, getLogs, getSummary, logMeal, searchFoods } from '../../api/nutrition'
import type { DailySummary, FoodLog, FoodProduct, FoodSource, MealType } from '../../types/nutrition'
import { Bar } from '../../components/ui/Bar'
import { Select } from '../../components/ui/Select'

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'BREAKFAST', label: 'Café da manhã' },
  { value: 'LUNCH', label: 'Almoço' },
  { value: 'DINNER', label: 'Jantar' },
  { value: 'SNACK', label: 'Lanche' },
]

const MEAL_LABEL: Record<MealType, string> = {
  BREAKFAST: 'Café da manhã',
  LUNCH: 'Almoço',
  DINNER: 'Jantar',
  SNACK: 'Lanche',
}

interface Draft {
  name: string
  barcode: string | null
  kcalPer100: string
  proteinPer100: string
  carbPer100: string
  fatPer100: string
  grams: string
  mealType: MealType
  isPrivate: boolean
  source: FoodSource
}

const num = (v: string) => (v.trim() === '' ? 0 : Number(v))
const round = (v: number) => Math.round(v * 10) / 10

export function NutritionPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    const [logsData, summaryData] = await Promise.all([getLogs(), getSummary()])
    setLogs(logsData)
    setSummary(summaryData)
  }, [])

  useEffect(() => {
    refresh().catch(() => setError('Não foi possível carregar os registros do dia.'))
  }, [refresh])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const timer = setTimeout(() => {
      searchFoods(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  function startFromProduct(p: FoodProduct) {
    setDraft({
      name: p.name,
      barcode: p.barcode,
      kcalPer100: p.caloriesPer100g != null ? String(p.caloriesPer100g) : '',
      proteinPer100: p.proteinPer100g != null ? String(p.proteinPer100g) : '',
      carbPer100: p.carbPer100g != null ? String(p.carbPer100g) : '',
      fatPer100: p.fatPer100g != null ? String(p.fatPer100g) : '',
      grams: '100',
      mealType: 'LUNCH',
      isPrivate: false,
      source: 'OPEN_FOOD_FACTS',
    })
  }

  function startManual() {
    setDraft({
      name: '',
      barcode: null,
      kcalPer100: '',
      proteinPer100: '',
      carbPer100: '',
      fatPer100: '',
      grams: '100',
      mealType: 'LUNCH',
      isPrivate: false,
      source: 'MANUAL',
    })
  }

  const factor = draft ? num(draft.grams) / 100 : 0
  const computed = draft
    ? {
        calories: round(num(draft.kcalPer100) * factor),
        protein: round(num(draft.proteinPer100) * factor),
        carb: round(num(draft.carbPer100) * factor),
        fat: round(num(draft.fatPer100) * factor),
      }
    : null

  async function save() {
    if (!draft || !computed) return
    setSaving(true)
    setError(null)
    try {
      await logMeal({
        foodName: draft.name,
        barcode: draft.barcode,
        quantityG: num(draft.grams),
        caloriesKcal: computed.calories,
        proteinG: computed.protein,
        carbG: computed.carb,
        fatG: computed.fat,
        mealType: draft.mealType,
        source: draft.source,
        isPrivate: draft.isPrivate,
      })
      setDraft(null)
      setQuery('')
      setResults([])
      await refresh()
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      setError(message ?? 'Não foi possível registrar a refeição.')
    } finally {
      setSaving(false)
    }
  }

  async function removeLog(id: string) {
    await deleteLog(id)
    await refresh()
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Refeições</h1>

      {summary && (
        <div className="card">
          <div className="flex items-center justify-between text-sm">
            <span>
              <span className="text-xl font-extrabold text-accent">{summary.consumedCalories}</span>
              <span className="text-faint">
                {summary.targetCalories != null ? ` / ${summary.targetCalories} kcal` : ' kcal'}
              </span>
            </span>
            <span className="text-xs text-faint">{summary.mealCount} refeição(ões)</span>
          </div>
          {summary.targetCalories != null && (
            <div className="mt-3">
              <Bar value={summary.consumedCalories} max={summary.targetCalories} />
            </div>
          )}
        </div>
      )}

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

      <div className="card">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar alimento (ex: banana, arroz)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input"
          />
          <button onClick={startManual} className="btn-ghost whitespace-nowrap">
            Manual
          </button>
        </div>

        {searching && <p className="mt-2 text-sm text-faint">Buscando...</p>}

        {results.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {results.map((p, i) => (
              <li key={`${p.barcode ?? p.name}-${i}`} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-ink">{p.name}</p>
                  <p className="text-xs text-faint">
                    {p.caloriesPer100g != null ? `${p.caloriesPer100g} kcal/100g` : 'sem info nutricional'}
                  </p>
                </div>
                <button onClick={() => startFromProduct(p)} className="btn-primary px-3 py-1 text-sm">
                  Adicionar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {draft && computed && (
        <div className="card border-lime-400/30">
          <h2 className="mb-3 text-sm font-semibold text-accent">
            {draft.source === 'MANUAL' ? 'Adicionar manualmente' : 'Adicionar refeição'}
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome do alimento"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="input"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Num label="kcal/100g" value={draft.kcalPer100} onChange={(v) => setDraft({ ...draft, kcalPer100: v })} />
              <Num label="Prot/100g" value={draft.proteinPer100} onChange={(v) => setDraft({ ...draft, proteinPer100: v })} />
              <Num label="Carb/100g" value={draft.carbPer100} onChange={(v) => setDraft({ ...draft, carbPer100: v })} />
              <Num label="Gord/100g" value={draft.fatPer100} onChange={(v) => setDraft({ ...draft, fatPer100: v })} />
              <Num label="Gramas" value={draft.grams} onChange={(v) => setDraft({ ...draft, grams: v })} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-44">
                <Select value={draft.mealType} onChange={(v) => setDraft({ ...draft, mealType: v })} options={MEAL_OPTIONS} />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={draft.isPrivate}
                  onChange={(e) => setDraft({ ...draft, isPrivate: e.target.checked })}
                  className="accent-lime-400"
                />
                Privada
              </label>
            </div>
            <p className="text-sm text-muted">
              Total: <span className="font-bold text-accent">{computed.calories} kcal</span> · P {computed.protein}g ·
              C {computed.carb}g · G {computed.fat}g
            </p>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving || !draft.name} className="btn-primary text-sm">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setDraft(null)} className="btn-ghost">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Hoje</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-faint">Nenhuma refeição registrada hoje.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface/70">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-ink">{log.foodName}</p>
                  <p className="text-xs text-faint">
                    {MEAL_LABEL[log.mealType]} · {log.quantityG}g · {log.caloriesKcal} kcal
                  </p>
                </div>
                <button onClick={() => removeLog(log.id)} className="text-sm text-faint transition hover:text-red-500">
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Num({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" min={0} step="0.1" value={value} onChange={(e) => onChange(e.target.value)} className="input px-2 py-1.5 text-sm" />
    </div>
  )
}
