import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Plano de treino por objetivo.
 * SHELL VISUAL — sem backend ainda. Tudo aqui embaixo é DADO FICTÍCIO de exemplo.
 * Quando o backend de IA existir, é só trocar PLANOS_FICTICIOS pela resposta da API.
 */

type Objetivo = 'perder' | 'manter' | 'ganhar'

interface ExercicioBase {
  nome: string
  series: number
  reps: string
  descanso: string
}

interface Plano {
  exercicios: ExercicioBase[]
}

// ⚠️ DADOS FICTÍCIOS de exemplo — substituir pela resposta do backend de IA.
// foco/duração/resumo de cada objetivo vivem no i18n (workoutplan.plan.*).
const PLANOS_FICTICIOS: Record<Objetivo, Plano> = {
  perder: {
    exercicios: [
      { nome: 'Agachamento livre', series: 4, reps: '12 reps', descanso: '90s' },
      { nome: 'Leg press', series: 4, reps: '12 reps', descanso: '90s' },
      { nome: 'Cadeira extensora', series: 3, reps: '15 reps', descanso: '60s' },
      { nome: 'Stiff', series: 3, reps: '12 reps', descanso: '60s' },
      { nome: 'Panturrilha em pé', series: 4, reps: '20 reps', descanso: '45s' },
    ],
  },
  manter: {
    exercicios: [
      { nome: 'Supino reto', series: 3, reps: '10 reps', descanso: '75s' },
      { nome: 'Remada curvada', series: 3, reps: '10 reps', descanso: '75s' },
      { nome: 'Agachamento', series: 3, reps: '12 reps', descanso: '90s' },
      { nome: 'Desenvolvimento militar', series: 3, reps: '10 reps', descanso: '60s' },
      { nome: 'Prancha', series: 3, reps: '40s', descanso: '45s' },
    ],
  },
  ganhar: {
    exercicios: [
      { nome: 'Supino reto com barra', series: 4, reps: '8 reps', descanso: '120s' },
      { nome: 'Puxada na frente', series: 4, reps: '10 reps', descanso: '90s' },
      { nome: 'Supino inclinado halteres', series: 3, reps: '10 reps', descanso: '90s' },
      { nome: 'Remada cavalinho', series: 4, reps: '8 reps', descanso: '90s' },
      { nome: 'Crucifixo', series: 3, reps: '12 reps', descanso: '60s' },
      { nome: 'Rosca direta', series: 3, reps: '12 reps', descanso: '60s' },
    ],
  },
}

const OBJETIVOS: Objetivo[] = ['perder', 'manter', 'ganhar']

export function WorkoutPlanPage() {
  const { t } = useTranslation()
  const [objetivo, setObjetivo] = useState<Objetivo>('perder')
  // índices dos exercícios já marcados como feitos
  const [feitos, setFeitos] = useState<Set<number>>(() => new Set([0, 1]))
  const [treinoFeito, setTreinoFeito] = useState(false)

  const plano = PLANOS_FICTICIOS[objetivo]
  const total = plano.exercicios.length
  const concluidos = feitos.size
  const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0
  const tudoFeito = concluidos === total

  function trocarObjetivo(novo: Objetivo) {
    setObjetivo(novo)
    setFeitos(new Set())
    setTreinoFeito(false)
  }

  function toggleExercicio(i: number) {
    setFeitos((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
    setTreinoFeito(false)
  }

  function gerarComIA() {
    // TODO: ligar backend de IA — gerar plano sob medida pro objetivo do usuário.
    // Por enquanto só embaralha de leve a ordem dos exercícios fictícios pra dar feedback visual.
  }

  return (
    <div className="space-y-5 pb-2">
      {/* cabeçalho */}
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{t('workoutplan.title')}</h1>
        <p className="mt-1 text-sm font-semibold text-muted">
          {t('workoutplan.subtitle', {
            focus: t(`workoutplan.plan.${objetivo}.focus`),
            duration: t(`workoutplan.plan.${objetivo}.duration`),
            summary: t(`workoutplan.plan.${objetivo}.summary`),
          })}
        </p>
      </header>

      {/* aviso de dados fictícios */}
      <p className="flex items-start gap-2 rounded-xl bg-carb/10 px-3.5 py-2.5 text-xs font-bold text-carb-ink">
        <IconInfo className="mt-0.5 shrink-0" />
        {t('workoutplan.sampleNotice')}
      </p>

      {/* seletor de objetivo */}
      <div>
        <span className="mb-2 block text-xs font-bold text-muted">{t('workoutplan.goalQuestion')}</span>
        <div className="flex gap-1 rounded-2xl bg-track p-1">
          {OBJETIVOS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => trocarObjetivo(o)}
              className={`flex-1 rounded-xl py-2.5 text-[13px] font-extrabold transition ${
                objetivo === o
                  ? 'bg-surface text-brand-ink shadow-[0_1px_4px_rgba(0,0,0,.08)]'
                  : 'bg-transparent text-muted hover:text-ink'
              }`}
            >
              {t(`workoutplan.goal.${o}`)}
            </button>
          ))}
        </div>
      </div>

      {/* botão gerar com IA */}
      <button
        type="button"
        onClick={gerarComIA}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/40 bg-brand-soft px-4 py-3 font-extrabold text-brand-ink transition hover:brightness-95"
      >
        <IconSpark />
        {t('workoutplan.generateAi')}
      </button>

      {/* progresso do treino (arena) */}
      <div className="flex items-center gap-4 rounded-2xl border border-arena-border bg-arena px-5 py-4 shadow-[0_10px_26px_var(--arena-shadow)]">
        <div className="flex-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-arena-muted">
            {t('workoutplan.youDid')}
          </div>
          <div className="font-display text-xl font-semibold leading-tight text-arena-text">
            {t('workoutplan.exercisesCount', { done: concluidos, total })}
          </div>
        </div>
        <div className="w-[130px]">
          <div className="h-2 overflow-hidden rounded-full bg-arena-track">
            <div
              className="h-full rounded-full bg-success transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* lista de exercícios */}
      <ul className="space-y-2.5">
        {plano.exercicios.map((ex, i) => {
          const done = feitos.has(i)
          return (
            <li
              key={`${objetivo}-${ex.nome}`}
              className={`flex items-center gap-3.5 rounded-2xl border border-hair bg-surface px-4 py-3.5 transition ${
                done ? 'opacity-60' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => toggleExercicio(i)}
                aria-pressed={done}
                aria-label={done ? t('workoutplan.markDone', { name: ex.nome }) : t('workoutplan.markUndone', { name: ex.nome })}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] transition ${
                  done
                    ? 'border-none bg-success text-white'
                    : 'border-2 border-track bg-transparent hover:border-success'
                }`}
              >
                {done && <IconCheck />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-ink">{ex.nome}</div>
                <div className="mt-0.5 text-xs font-bold text-muted">
                  {t('workoutplan.seriesReps', { series: ex.series, reps: ex.reps })}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 font-display text-[13px] font-semibold text-muted">
                <IconRest className="text-faint" />
                {ex.descanso}
              </div>
            </li>
          )
        })}
      </ul>

      {/* CTA: marcar treino como feito */}
      <button
        type="button"
        onClick={() => setTreinoFeito(true)}
        disabled={!tudoFeito || treinoFeito}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-display text-[15px] font-semibold transition ${
          treinoFeito
            ? 'cursor-default bg-success-soft text-success-ink'
            : tudoFeito
              ? 'bg-brand text-white hover:brightness-105'
              : 'cursor-not-allowed bg-track text-faint'
        }`}
      >
        {treinoFeito ? (
          <>
            <IconCheck />
            {t('workoutplan.doneCta')}
          </>
        ) : tudoFeito ? (
          <>
            <IconFlame />
            {t('workoutplan.finishCta')}
          </>
        ) : (
          <>{t('workoutplan.remainingCta', { n: total - concluidos })}</>
        )}
      </button>
    </div>
  )
}

/* ---------- ícones (SVG preenchidos, fill currentColor) ---------- */

function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[15px] w-[15px] fill-current ${className}`}>
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  )
}

function IconSpark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] fill-current ${className}`}>
      <path d="M12 2l1.9 4.6L18.5 8 14 9.8 12.4 14.5 10.6 9.9 6 8.4l4.6-1.7zM6 14l.9 2.3L9 17l-2.1.9L6 20l-.9-2.1L3 17l2.1-.7zm12 1 .7 1.8L20 18l-1.3.6-.7 1.6-.7-1.6L16 18l1.3-.7z" />
    </svg>
  )
}

function IconFlame({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] fill-current ${className}`}>
      <path d="M13 2c.5 3-1.5 4.4-2.8 5.8C9 9 8 10.2 8 12a4 4 0 002 3.5C9.4 14.7 9.4 13.6 10 13c0 2 1.4 2.7 2.2 3.4.9.8 1.3 1.6 1.3 2.6a3.5 3.5 0 003-3.5c0-2.4-1.4-4-2.6-5.4C12.6 8.6 12 7.4 13 2z" />
    </svg>
  )
}

function IconRest({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-current ${className}`}>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm-1 3a1 1 0 012 0v4.6l3.3 2a1 1 0 01-1 1.7l-3.8-2.3a1 1 0 01-.5-.9z" />
    </svg>
  )
}

function IconInfo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-current ${className}`}>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4.5a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8zM10.6 11h2.2v6.5h-2.2z" />
    </svg>
  )
}
