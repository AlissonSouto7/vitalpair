import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

/* =====================================================================
   Plano alimentar semanal (shell visual).
   NÃO há backend de IA ainda — todo o conteúdo abaixo é DADO FICTÍCIO,
   só pra montar o visual. Quando o backend chegar, troca SAMPLE_WEEK
   por dados reais e liga o botão "Gerar com IA".
   ===================================================================== */

type MealKind = 'CAFE' | 'ALMOCO' | 'LANCHE' | 'JANTA'

interface Meal {
  kind: MealKind
  name: string
  kcal: number
  protein: number // g
  carb: number // g
  fat: number // g
}

interface Day {
  weekday: string // SEG, TER...
  date: number
  meals: Meal[]
}

// Chave i18n do dia da semana (SÁB tem acento; normaliza pra SAB).
const weekdayKey = (w: string) => (w === 'SÁB' ? 'SAB' : w)

// DADOS FICTÍCIOS — plano de exemplo (7 dias). Macros e kcal inventados.
const SAMPLE_WEEK: Day[] = [
  {
    weekday: 'SEG',
    date: 24,
    meals: [
      { kind: 'CAFE', name: 'Ovos mexidos, pão integral e mamão', kcal: 420, protein: 28, carb: 45, fat: 14 },
      { kind: 'ALMOCO', name: 'Frango grelhado, arroz, feijão e salada', kcal: 620, protein: 48, carb: 62, fat: 16 },
      { kind: 'LANCHE', name: 'Iogurte natural com granola e banana', kcal: 280, protein: 18, carb: 38, fat: 8 },
      { kind: 'JANTA', name: 'Omelete de legumes com queijo', kcal: 380, protein: 30, carb: 12, fat: 24 },
    ],
  },
  {
    weekday: 'TER',
    date: 25,
    meals: [
      { kind: 'CAFE', name: 'Tapioca com queijo e suco de laranja', kcal: 390, protein: 16, carb: 58, fat: 10 },
      { kind: 'ALMOCO', name: 'Patinho moído, purê de batata e brócolis', kcal: 640, protein: 46, carb: 55, fat: 22 },
      { kind: 'LANCHE', name: 'Vitamina de banana com aveia', kcal: 260, protein: 12, carb: 42, fat: 6 },
      { kind: 'JANTA', name: 'Salmão assado com legumes no vapor', kcal: 410, protein: 34, carb: 14, fat: 26 },
    ],
  },
  {
    weekday: 'QUA',
    date: 26,
    meals: [
      { kind: 'CAFE', name: 'Crepioca recheada com frango desfiado', kcal: 430, protein: 32, carb: 30, fat: 18 },
      { kind: 'ALMOCO', name: 'Tilápia grelhada, arroz integral e legumes', kcal: 580, protein: 44, carb: 60, fat: 14 },
      { kind: 'LANCHE', name: 'Pão de queijo e café com leite', kcal: 300, protein: 14, carb: 36, fat: 12 },
      { kind: 'JANTA', name: 'Sopa de carne com mandioquinha', kcal: 360, protein: 26, carb: 34, fat: 10 },
    ],
  },
  {
    weekday: 'QUI',
    date: 27,
    meals: [
      { kind: 'CAFE', name: 'Aveia cozida com pasta de amendoim e morango', kcal: 410, protein: 18, carb: 50, fat: 16 },
      { kind: 'ALMOCO', name: 'Strogonoff de frango light com arroz', kcal: 650, protein: 45, carb: 64, fat: 20 },
      { kind: 'LANCHE', name: 'Mix de castanhas e uma maçã', kcal: 250, protein: 8, carb: 26, fat: 14 },
      { kind: 'JANTA', name: 'Wrap integral de atum com salada', kcal: 400, protein: 32, carb: 36, fat: 14 },
    ],
  },
  {
    weekday: 'SEX',
    date: 28,
    meals: [
      { kind: 'CAFE', name: 'Panqueca de banana com mel e canela', kcal: 380, protein: 14, carb: 60, fat: 9 },
      { kind: 'ALMOCO', name: 'Bife acebolado, arroz, feijão e couve', kcal: 660, protein: 47, carb: 58, fat: 24 },
      { kind: 'LANCHE', name: 'Iogurte proteico com chia', kcal: 220, protein: 22, carb: 18, fat: 5 },
      { kind: 'JANTA', name: 'Frango xadrez com arroz integral', kcal: 470, protein: 36, carb: 48, fat: 14 },
    ],
  },
  {
    weekday: 'SÁB',
    date: 29,
    meals: [
      { kind: 'CAFE', name: 'Pão na chapa, ovo e suco verde', kcal: 360, protein: 18, carb: 40, fat: 12 },
      { kind: 'ALMOCO', name: 'Macarrão integral à bolonhesa caseira', kcal: 690, protein: 38, carb: 78, fat: 22 },
      { kind: 'LANCHE', name: 'Smoothie de frutas vermelhas', kcal: 240, protein: 10, carb: 44, fat: 4 },
      { kind: 'JANTA', name: 'Pizza fit de frigideira com frango', kcal: 480, protein: 34, carb: 40, fat: 20 },
    ],
  },
  {
    weekday: 'DOM',
    date: 30,
    meals: [
      { kind: 'CAFE', name: 'Cuscuz com ovo e queijo coalho', kcal: 440, protein: 22, carb: 52, fat: 16 },
      { kind: 'ALMOCO', name: 'Picanha magra, arroz, vinagrete e farofa', kcal: 720, protein: 50, carb: 60, fat: 30 },
      { kind: 'LANCHE', name: 'Açaí na tigela com granola (porção média)', kcal: 320, protein: 8, carb: 56, fat: 10 },
      { kind: 'JANTA', name: 'Caldo verde leve com torrada integral', kcal: 340, protein: 20, carb: 36, fat: 10 },
    ],
  },
]

// Meta diária fictícia, só pra comparar com o total montado.
const DAILY_GOAL_KCAL = 2080

export function MealPlanPage() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(0)
  const day = SAMPLE_WEEK[selected]

  const totals = useMemo(() => {
    return day.meals.reduce(
      (acc, m) => ({
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein,
        carb: acc.carb + m.carb,
        fat: acc.fat + m.fat,
      }),
      { kcal: 0, protein: 0, carb: 0, fat: 0 },
    )
  }, [day])

  const diff = totals.kcal - DAILY_GOAL_KCAL

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">
            {t('mealplan.title')}
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted">
            {t('mealplan.subtitle')}
          </p>
        </div>

        {/* Botão "Gerar com IA" — visual, sem backend ainda */}
        <button
          type="button"
          disabled
          title={t('mealplan.generateAiTooltip')}
          // TODO: ligar backend de IA (Anthropic) — gerar plano respeitando macros do usuário
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-extrabold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SparkIcon className="h-[18px] w-[18px]" />
          {t('mealplan.generateAi')}
        </button>
      </header>

      {/* Aviso: o plano ainda é exemplo */}
      <div className="flex items-start gap-3 rounded-2xl border border-hair bg-brand-soft px-4 py-3">
        <SparkIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink" />
        <p className="text-sm font-semibold text-brand-ink">{t('mealplan.sampleNotice')}</p>
      </div>

      {/* Seletor de dias */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SAMPLE_WEEK.map((d, i) => {
          const active = i === selected
          return (
            <button
              key={d.weekday}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={active}
              className={`flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 leading-tight transition ${
                active
                  ? 'border-brand bg-brand text-white'
                  : 'border-hair bg-surface text-muted hover:text-ink'
              }`}
            >
              <span className={`text-[10px] font-extrabold tracking-wide ${active ? 'opacity-80' : ''}`}>
                {t(`mealplan.weekday.${weekdayKey(d.weekday)}`)}
              </span>
              <span className="font-display text-base font-semibold">{d.date}</span>
            </button>
          )
        })}
      </div>

      {/* Refeições do dia */}
      <div className="space-y-3">
        {day.meals.map((m) => (
          <MealCard key={m.kind} meal={m} />
        ))}
      </div>

      {/* Total do dia + comparação com a meta */}
      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted">{t('mealplan.dayTotal')}</p>
          <p className="font-display text-2xl font-semibold text-ink">
            {totals.kcal.toLocaleString('pt-BR')} kcal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-bold">
          <MacroPill label={t('mealplan.protein')} value={totals.protein} tone="brand" />
          <MacroPill label={t('mealplan.carb')} value={totals.carb} tone="carb" />
          <MacroPill label={t('mealplan.fat')} value={totals.fat} tone="success" />
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
            Math.abs(diff) <= 80
              ? 'bg-success-soft text-success-ink'
              : diff > 0
                ? 'bg-carb/15 text-carb-ink'
                : 'bg-brand-soft text-brand-ink'
          }`}
        >
          {Math.abs(diff) <= 80
            ? t('mealplan.onTarget')
            : diff > 0
              ? t('mealplan.overTarget', { n: diff })
              : t('mealplan.underTarget', { n: -diff })}
        </span>
      </section>
    </div>
  )
}

function MealCard({ meal }: { meal: Meal }) {
  const { t } = useTranslation()
  return (
    <article className="card p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-ink">
          {t(`mealplan.mealLabel.${meal.kind}`)}
        </span>

        {/* Trocar refeição — visual, sem backend ainda */}
        <button
          type="button"
          disabled
          title={t('mealplan.swapTooltip')}
          // TODO: ligar troca de refeição (IA sugere alternativa na mesma faixa de macros)
          className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-rival-ink transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SwapIcon className="h-[13px] w-[13px]" />
          {t('mealplan.swap')}
        </button>
      </div>

      <p className="text-[15px] font-extrabold text-ink">{meal.name}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-bold">
        <span className="font-display text-sm font-semibold text-ink">{meal.kcal} kcal</span>
        <MacroPill label="P" value={meal.protein} tone="brand" compact />
        <MacroPill label="C" value={meal.carb} tone="carb" compact />
        <MacroPill label="G" value={meal.fat} tone="success" compact />
      </div>
    </article>
  )
}

function MacroPill({
  label,
  value,
  tone,
  compact = false,
}: {
  label: string
  value: number
  tone: 'brand' | 'carb' | 'success'
  compact?: boolean
}) {
  const dot = tone === 'brand' ? 'bg-brand' : tone === 'carb' ? 'bg-carb' : 'bg-success'
  const text = tone === 'brand' ? 'text-brand-ink' : tone === 'carb' ? 'text-carb-ink' : 'text-success-ink'
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      <span className={text}>
        {label} {value}
        {compact ? 'g' : ` g`}
      </span>
    </span>
  )
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2zm6 11l.9 2.6L21 17l-2.1.8L18 21l-.9-2.2L15 17l2.1-.4L18 13zM6 14l.7 2L9 16.7l-2.3.6L6 20l-.7-2.7L3 16.7 5.3 16 6 14z" />
    </svg>
  )
}

function SwapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 5V2L7 7l5 5V8a5 5 0 11-5 5H5a7 7 0 107-8z" />
    </svg>
  )
}
