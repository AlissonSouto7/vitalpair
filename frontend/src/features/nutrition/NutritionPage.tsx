import { useCallback, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { deleteLog, getLogs, getSummary, logMeal, searchFoods } from '../../api/nutrition'
import type { DailySummary, FoodLog, FoodProduct, FoodSource, MealType } from '../../types/nutrition'

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

  // Busca com debounce na Open Food Facts.
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
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Refeições</h1>

      {summary && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <span className="font-semibold text-blue-600">{summary.consumedCalories} kcal</span>
          <span className="text-slate-500">
            {summary.targetCalories != null ? ` de ${summary.targetCalories} kcal` : ''} · {summary.mealCount}{' '}
            refeição(ões)
          </span>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Busca */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar alimento (ex: banana, arroz)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={startManual}
            className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Manual
          </button>
        </div>

        {searching && <p className="mt-2 text-sm text-slate-400">Buscando...</p>}

        {results.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100">
            {results.map((p, i) => (
              <li key={`${p.barcode ?? p.name}-${i}`} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">
                    {p.caloriesPer100g != null ? `${p.caloriesPer100g} kcal/100g` : 'sem info nutricional'}
                  </p>
                </div>
                <button
                  onClick={() => startFromProduct(p)}
                  className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Adicionar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Editor da porção */}
      {draft && computed && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-blue-800">
            {draft.source === 'MANUAL' ? 'Adicionar manualmente' : 'Adicionar refeição'}
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome do alimento"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <LabeledNumber label="kcal/100g" value={draft.kcalPer100} onChange={(v) => setDraft({ ...draft, kcalPer100: v })} />
              <LabeledNumber label="Prot/100g" value={draft.proteinPer100} onChange={(v) => setDraft({ ...draft, proteinPer100: v })} />
              <LabeledNumber label="Carb/100g" value={draft.carbPer100} onChange={(v) => setDraft({ ...draft, carbPer100: v })} />
              <LabeledNumber label="Gord/100g" value={draft.fatPer100} onChange={(v) => setDraft({ ...draft, fatPer100: v })} />
              <LabeledNumber label="Gramas" value={draft.grams} onChange={(v) => setDraft({ ...draft, grams: v })} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={draft.mealType}
                onChange={(e) => setDraft({ ...draft, mealType: e.target.value as MealType })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {MEAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={draft.isPrivate}
                  onChange={(e) => setDraft({ ...draft, isPrivate: e.target.checked })}
                />
                Privada (não aparece no feed do parceiro)
              </label>
            </div>
            <p className="text-sm text-slate-600">
              Total: <span className="font-semibold text-blue-700">{computed.calories} kcal</span> · P{' '}
              {computed.protein}g · C {computed.carb}g · G {computed.fat}g
            </p>
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving || !draft.name}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setDraft(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Lista do dia */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Hoje</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma refeição registrada hoje.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-slate-800">{log.foodName}</p>
                  <p className="text-xs text-slate-400">
                    {MEAL_LABEL[log.mealType]} · {log.quantityG}g · {log.caloriesKcal} kcal
                  </p>
                </div>
                <button
                  onClick={() => removeLog(log.id)}
                  className="text-sm text-slate-400 transition hover:text-red-600"
                  title="Remover"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function LabeledNumber({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input
        type="number"
        min={0}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
      />
    </div>
  )
}
