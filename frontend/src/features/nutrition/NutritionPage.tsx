import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AxiosError } from 'axios'
import {
  analyzePhoto,
  deleteLog,
  getFavorites,
  getLogs,
  getSummary,
  logMeal,
  searchFoods,
} from '../../api/nutrition'
import type {
  DailySummary,
  DetectedFood,
  FavoriteFood,
  FoodLog,
  FoodProduct,
  FoodSource,
  MealType,
} from '../../types/nutrition'
import { CalorieRing } from '../../components/ui/CalorieRing'
import { Points } from '../../components/ui/Badge'
import { MealDetailModal } from './MealDetailModal'

const MEALS: { value: MealType; label: string }[] = [
  { value: 'BREAKFAST', label: 'Café' },
  { value: 'LUNCH', label: 'Almoço' },
  { value: 'DINNER', label: 'Janta' },
  { value: 'SNACK', label: 'Lanche' },
]

const mealLabel = (m: MealType) => MEALS.find((x) => x.value === m)?.label ?? m

type Tab = 'foto' | 'buscar' | 'favoritos'

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

// Converte valores totais de uma porção (gramas + kcal/macros daquela porção) para o
// formato por-100g que o editor usa, mantendo o mesmo total ao recalcular.
function per100(value: number, grams: number) {
  return grams > 0 ? round(value / (grams / 100)) : round(value)
}

function fileToImage(file: File): Promise<{ base64: string; mediaType: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const comma = result.indexOf(',')
      resolve({
        base64: result.slice(comma + 1),
        mediaType: file.type || 'image/jpeg',
        dataUrl: result,
      })
    }
    reader.onerror = () => reject(new Error('Não rolou ler a foto.'))
    reader.readAsDataURL(file)
  })
}

export function NutritionPage() {
  const [tab, setTab] = useState<Tab>('foto')
  const [meal, setMeal] = useState<MealType>('LUNCH')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<FoodLog | null>(null)

  // Favoritos
  const [favorites, setFavorites] = useState<FavoriteFood[] | null>(null)
  const [favLoading, setFavLoading] = useState(false)
  const [addingFav, setAddingFav] = useState<string | null>(null)

  // Foto-IA
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoData, setPhotoData] = useState<{ base64: string; mediaType: string } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [detected, setDetected] = useState<DetectedFood[] | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [logsData, summaryData] = await Promise.all([getLogs(), getSummary()])
    setLogs(logsData)
    setSummary(summaryData)
  }, [])

  useEffect(() => {
    refresh().catch(() => setError('Não rolou carregar suas refeições agora. Tenta de novo daqui a pouco.'))
  }, [refresh])

  // Busca (debounce)
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

  // Favoritos: carrega na primeira vez que abre a aba
  useEffect(() => {
    if (tab !== 'favoritos' || favorites !== null || favLoading) return
    setFavLoading(true)
    getFavorites()
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setFavLoading(false))
  }, [tab, favorites, favLoading])

  function startFromProduct(p: FoodProduct) {
    setDraft({
      name: p.name,
      barcode: p.barcode,
      kcalPer100: p.caloriesPer100g != null ? String(p.caloriesPer100g) : '',
      proteinPer100: p.proteinPer100g != null ? String(p.proteinPer100g) : '',
      carbPer100: p.carbPer100g != null ? String(p.carbPer100g) : '',
      fatPer100: p.fatPer100g != null ? String(p.fatPer100g) : '',
      grams: '100',
      mealType: meal,
      isPrivate: false,
      source: 'OPEN_FOOD_FACTS',
    })
  }

  // Abre o editor pré-preenchido a partir de valores totais (Foto-IA).
  function startFromDetected(d: DetectedFood) {
    const grams = round(d.quantityG) || 100
    setDraft({
      name: d.foodName,
      barcode: null,
      kcalPer100: String(per100(d.caloriesKcal, grams)),
      proteinPer100: String(per100(d.proteinG, grams)),
      carbPer100: String(per100(d.carbG, grams)),
      fatPer100: String(per100(d.fatG, grams)),
      grams: String(grams),
      mealType: meal,
      isPrivate: false,
      source: 'MANUAL',
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
      mealType: meal,
      isPrivate: false,
      source: 'MANUAL',
    })
  }

  // Favorito: registra na hora (1 toque), sem abrir editor.
  async function addFavorite(f: FavoriteFood) {
    setAddingFav(f.foodName)
    setError(null)
    try {
      await logMeal({
        foodName: f.foodName,
        barcode: null,
        quantityG: f.quantityG,
        caloriesKcal: f.caloriesKcal,
        proteinG: f.proteinG,
        carbG: f.carbG,
        fatG: f.fatG,
        mealType: meal,
        source: 'MANUAL',
        isPrivate: false,
      })
      await refresh()
    } catch {
      setError('Não rolou adicionar agora. Tenta de novo.')
    } finally {
      setAddingFav(null)
    }
  }

  async function onPickPhoto(file: File | undefined) {
    if (!file) return
    setPhotoError(null)
    setDetected(null)
    try {
      const img = await fileToImage(file)
      setPhotoPreview(img.dataUrl)
      setPhotoData({ base64: img.base64, mediaType: img.mediaType })
    } catch {
      setPhotoError('Não rolou abrir essa foto. Tenta outra.')
    }
  }

  function resetPhoto() {
    setPhotoPreview(null)
    setPhotoData(null)
    setDetected(null)
    setPhotoError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function runAnalysis() {
    if (!photoData) return
    setAnalyzing(true)
    setPhotoError(null)
    setDetected(null)
    try {
      const res = await analyzePhoto(photoData.base64, photoData.mediaType)
      setDetected(res.items)
      if (res.items.length === 0) {
        setPhotoError('A IA não achou comida nessa foto. Tenta uma mais de pertinho do prato.')
      }
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      setPhotoError(message ?? 'A IA não respondeu agora. Tenta de novo ou usa a busca.')
    } finally {
      setAnalyzing(false)
    }
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
      setError(message ?? 'Não rolou salvar agora. Confere os números e tenta de novo.')
    } finally {
      setSaving(false)
    }
  }

  async function removeLog(id: string) {
    setSelected((cur) => (cur?.id === id ? null : cur))
    await deleteLog(id)
    await refresh()
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Cabeçalho */}
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">Comeu o quê?</h1>
        <p className="mt-1 text-sm font-semibold text-muted">
          Foto é o jeito mais rápido. Mas tem busca e favoritos também.
        </p>
      </header>

      {/* Resumo do dia */}
      {summary && (
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Hoje no prato</h2>
            <span className="text-sm font-bold text-muted">
              {summary.remainingCalories != null
                ? summary.remainingCalories >= 0
                  ? `faltam ${summary.remainingCalories} kcal`
                  : `${-summary.remainingCalories} kcal acima`
                : `${summary.mealCount} ${summary.mealCount === 1 ? 'refeição' : 'refeições'}`}
            </span>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <CalorieRing current={summary.consumedCalories} goal={summary.targetCalories ?? 2000} />
            <div className="w-full flex-1 space-y-4">
              <Macro label="Proteína" value={summary.consumedProteinG} target={summary.targetProteinG} tone="brand" />
              <Macro label="Carboidrato" value={summary.consumedCarbG} target={summary.targetCarbG} tone="carb" />
              <Macro label="Gordura" value={summary.consumedFatG} target={summary.targetFatG} tone="success" />
            </div>
          </div>

          {summary.targetCalories == null && (
            <p className="mt-5 text-xs font-bold text-muted">
              Sem meta ainda. Termina o perfil que o anel ganha um alvo pra fechar.
            </p>
          )}
        </section>
      )}

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>
      )}

      {/* Tipo de refeição */}
      <div>
        <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-wide text-muted">
          Pra qual refeição
        </span>
        <div className="flex gap-2">
          {MEALS.map((m) => {
            const active = meal === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMeal(m.value)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${
                  active
                    ? 'border-brand bg-brand-soft text-brand-ink'
                    : 'border-hair bg-surface text-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Abas: Foto / Buscar / Favoritos */}
      <section className="card space-y-4">
        <div className="flex gap-1 rounded-xl bg-track p-1">
          <TabButton active={tab === 'foto'} onClick={() => setTab('foto')} icon={<CameraIcon />} label="Foto" />
          <TabButton active={tab === 'buscar'} onClick={() => setTab('buscar')} icon={<SearchIcon />} label="Buscar" />
          <TabButton active={tab === 'favoritos'} onClick={() => setTab('favoritos')} icon={<StarIcon />} label="Favoritos" />
        </div>

        {/* --- Aba Foto --- */}
        {tab === 'foto' && (
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPickPhoto(e.target.files?.[0])}
            />

            {!photoPreview ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-hair bg-canvas px-6 py-10 text-center transition hover:border-brand"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <CameraIcon big />
                </span>
                <span className="font-display text-base font-semibold text-ink">Tira ou joga a foto aqui</span>
                <span className="text-sm font-semibold text-muted">A IA olha o prato e adivinha o que é</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-hair">
                  <img src={photoPreview} alt="Foto do prato" className="max-h-64 w-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="btn-primary flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {analyzing ? 'A IA tá olhando...' : detected ? 'Olhar de novo' : 'Analisar foto'}
                  </button>
                  <button type="button" onClick={resetPhoto} className="btn-ghost">
                    Trocar foto
                  </button>
                </div>
              </div>
            )}

            {photoError && (
              <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{photoError}</p>
            )}

            {detected && detected.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-extrabold text-ink">A IA achou isso aqui, confere pra mim?</p>
                <ul className="space-y-2">
                  {detected.map((d, i) => (
                    <li
                      key={`${d.foodName}-${i}`}
                      className="flex items-center gap-3 rounded-xl border border-hair bg-surface px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-ink">{d.foodName}</p>
                        <p className="text-[11.5px] font-semibold text-muted">
                          ~{round(d.quantityG)}g · {round(d.caloriesKcal)} kcal
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startFromDetected(d)}
                        aria-label={`Conferir e adicionar ${d.foodName}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition hover:brightness-105"
                      >
                        <PlusIcon />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-[11.5px] font-semibold text-muted">
                  É um chute esperto da IA. Toca pra conferir a porção antes de salvar.
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- Aba Buscar --- */}
        {tab === 'buscar' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-brand bg-canvas px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-brand/30">
              <SearchIcon />
              <input
                type="text"
                placeholder="Procura aí: frango grelhado, pão na chapa..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent font-bold text-ink placeholder-faint outline-none"
              />
            </div>

            {searching && <p className="text-sm font-semibold text-muted">Procurando...</p>}

            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <p className="text-sm font-semibold text-muted">Nada com esse nome. Bora cadastrar na mão?</p>
            )}

            {results.length > 0 && (
              <ul className="space-y-2">
                {results.map((p, i) => (
                  <li
                    key={`${p.barcode ?? p.name}-${i}`}
                    className="flex items-center gap-3 rounded-xl border border-hair bg-surface px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-ink">{p.name}</p>
                      <p className="text-[11.5px] font-semibold text-muted">
                        {p.caloriesPer100g != null ? `por 100g · Open Food Facts` : 'sem info nutricional · Open Food Facts'}
                      </p>
                    </div>
                    {p.caloriesPer100g != null && (
                      <span className="shrink-0 font-display text-sm font-semibold text-muted">
                        {p.caloriesPer100g} kcal
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startFromProduct(p)}
                      aria-label={`Adicionar ${p.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition hover:brightness-105"
                    >
                      <PlusIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={startManual}
              className="w-full rounded-xl border border-dashed border-hair py-3 text-sm font-bold text-muted transition hover:border-brand hover:text-brand-ink"
            >
              Não achei, vou colocar na mão
            </button>
          </div>
        )}

        {/* --- Aba Favoritos --- */}
        {tab === 'favoritos' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted">O que você mais registra. Toca pra jogar no prato na hora.</p>

            {favLoading && <p className="text-sm font-semibold text-muted">Buscando seus favoritos...</p>}

            {!favLoading && favorites && favorites.length === 0 && (
              <div className="rounded-xl border border-dashed border-hair bg-surface px-5 py-8 text-center">
                <p className="text-sm font-bold text-ink">Ainda sem favoritos</p>
                <p className="mt-1 text-sm font-semibold text-muted">
                  Registra umas refeições que as que mais voltam aparecem aqui pra 1 toque.
                </p>
              </div>
            )}

            {favorites && favorites.length > 0 && (
              <ul className="space-y-2">
                {favorites.map((f, i) => (
                  <li
                    key={`${f.foodName}-${i}`}
                    className="flex items-center gap-3 rounded-xl border border-hair bg-surface px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-ink">{f.foodName}</p>
                      <p className="text-[11.5px] font-semibold text-muted">
                        {round(f.quantityG)}g · {round(f.caloriesKcal)} kcal
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addFavorite(f)}
                      disabled={addingFav === f.foodName}
                      aria-label={`Adicionar ${f.foodName}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition hover:brightness-105 disabled:opacity-60"
                    >
                      {addingFav === f.foodName ? <span className="text-[11px] font-extrabold">...</span> : <PlusIcon />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Editor do item */}
      {draft && computed && (
        <section className="card border-brand/40">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <h2 className="text-sm font-extrabold text-brand-ink">
              {draft.source === 'MANUAL' ? 'Confere e ajeita' : 'Confere e ajeita a porção'}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">O que foi</label>
              <input
                type="text"
                placeholder="Nome da comida"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <NumField label="kcal /100g" value={draft.kcalPer100} onChange={(v) => setDraft({ ...draft, kcalPer100: v })} />
              <NumField label="Prot /100g" value={draft.proteinPer100} onChange={(v) => setDraft({ ...draft, proteinPer100: v })} />
              <NumField label="Carb /100g" value={draft.carbPer100} onChange={(v) => setDraft({ ...draft, carbPer100: v })} />
              <NumField label="Gord /100g" value={draft.fatPer100} onChange={(v) => setDraft({ ...draft, fatPer100: v })} />
              <NumField label="Gramas" value={draft.grams} onChange={(v) => setDraft({ ...draft, grams: v })} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {MEALS.map((m) => {
                const active = draft.mealType === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, mealType: m.value })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                      active ? 'bg-brand-soft text-brand-ink' : 'bg-track text-muted hover:text-ink'
                    }`}
                  >
                    {m.label}
                  </button>
                )
              })}
              <label className="ml-auto flex items-center gap-2 text-sm font-bold text-muted">
                <input
                  type="checkbox"
                  checked={draft.isPrivate}
                  onChange={(e) => setDraft({ ...draft, isPrivate: e.target.checked })}
                  className="h-4 w-4 accent-brand"
                />
                Só pra mim
              </label>
            </div>

            {/* Resumo macros do item */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl bg-canvas px-4 py-3 text-sm font-bold">
              <span className="font-display text-lg font-semibold text-ink">{computed.calories} kcal</span>
              <Dot tone="brand" />
              <span className="text-muted">P {computed.protein}g</span>
              <Dot tone="carb" />
              <span className="text-muted">C {computed.carb}g</span>
              <Dot tone="success" />
              <span className="text-muted">G {computed.fat}g</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving || !draft.name}
                className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
              <button type="button" onClick={() => setDraft(null)} className="btn-ghost">
                Deixa pra lá
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Refeições de hoje */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Refeições de hoje</h2>
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hair bg-surface px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
              <ForkIcon />
            </div>
            <p className="font-display text-base font-semibold text-ink">Prato vazio por enquanto</p>
            <p className="mt-1 text-sm font-semibold text-muted">
              Registra a primeira de hoje. A Célia já tá comendo na frente.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-3 rounded-2xl border border-hair bg-surface px-4 py-3 transition hover:border-brand/40"
              >
                <button
                  type="button"
                  onClick={() => setSelected(log)}
                  aria-label={`Ver detalhe de ${log.foodName}`}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                    <ForkIcon small />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-ink">{log.foodName}</span>
                    <span className="block text-[11.5px] font-semibold text-muted">
                      {mealLabel(log.mealType)} · {log.quantityG}g · {log.caloriesKcal} kcal
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeLog(log.id)}
                  aria-label={`Remover ${log.foodName}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition hover:bg-danger-soft hover:text-danger"
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Barra fixa "vai entrar" */}
      {draft && computed && computed.calories > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-arena-border bg-canvas/95 px-4 py-3 backdrop-blur md:left-64">
          <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl bg-arena px-4 py-3 shadow-[0_10px_30px_rgba(70,45,20,0.12)] md:px-8">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-arena-muted">Vai entrar</p>
              <p className="font-display text-xl font-semibold leading-tight text-arena-text">
                {computed.calories} kcal{' '}
                <span className="text-sm font-bold text-arena-muted">no {mealLabel(draft.mealType).toLowerCase()}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving || !draft.name}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Registrar'}
              <Points value={10} />
            </button>
          </div>
        </div>
      )}

      {selected && (
        <MealDetailModal meal={selected} onClose={() => setSelected(null)} onDelete={removeLog} />
      )}
    </div>
  )
}

function TabButton({
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
        active ? 'bg-surface text-ink shadow-[0_1px_4px_rgba(0,0,0,0.08)]' : 'text-muted hover:text-ink'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function Macro({
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

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min={0}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input px-2.5 py-2 text-sm font-bold"
      />
    </div>
  )
}

function Dot({ tone }: { tone: 'brand' | 'carb' | 'success' }) {
  const bg = tone === 'brand' ? 'bg-brand' : tone === 'carb' ? 'bg-carb' : 'bg-success'
  return <span className={`h-2 w-2 rounded-full ${bg}`} aria-hidden="true" />
}

function CameraIcon({ big }: { big?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={big ? 'h-7 w-7' : 'h-4 w-4'} fill="currentColor" aria-hidden="true">
      <path d="M9 3l-1.5 2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.5L15 3H9zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-muted" fill="currentColor" aria-hidden="true">
      <path d="M10 3a7 7 0 105.3 11.6l4 4 1.7-1.7-4-4A7 7 0 0010 3zm0 2.4a4.6 4.6 0 110 9.2 4.6 4.6 0 010-9.2z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.9 5.9 19.4 7.4 12.9l-5-4.3L9 8z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
    </svg>
  )
}

function ForkIcon({ small }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={small ? 'h-5 w-5 text-brand' : 'h-7 w-7 text-brand'} fill="currentColor" aria-hidden="true">
      <path d="M7 2v7a3 3 0 0 0 2 2.83V22h2V11.83A3 3 0 0 0 13 9V2h-2v6H9.5V2h-1.5v6H7zM17 2c-1.7 0-3 2.2-3 5 0 2.4 1 4.3 2 4.8V22h2V2z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12H7zm3 2v8h2v-8zm4 0v8h2v-8z" />
    </svg>
  )
}
