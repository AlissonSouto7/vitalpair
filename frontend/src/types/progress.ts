export interface WeightPoint {
  date: string
  weightKg: number
}

/** Quantos dias a tela de progresso olha para trás. */
export type ProgressDays = 7 | 30 | 90

export const PROGRESS_WINDOWS: ProgressDays[] = [7, 30, 90]

/**
 * Uma barra do gráfico de calorias: um dia, ou uma semana na janela de 90 dias.
 *
 * Sem rótulo. O servidor mandava a inicial do dia da semana pronta, montada de um vetor em
 * português ("S T Q Q S S D"), que aparecia igual numa tela em inglês; e mesmo em português
 * aquelas iniciais são ambíguas, porque S e Q se repetem. A data é o fato, e a tela escreve
 * a inicial no idioma de quem lê.
 */
export interface CalorieDay {
  date: string
  kcal: number
  withinGoal: boolean
}

export type MacroKey = 'PROTEIN' | 'CARB' | 'FAT'

/** Sem rótulo, pelo mesmo motivo: a tela traduz pela `key`, como já faz com as medalhas. */
export interface MacroAverage {
  key: MacroKey
  avgG: number
  targetG: number | null
}

export interface ProgressView {
  weights: WeightPoint[]
  targetKcal: number | null
  calories: CalorieDay[]
  macros: MacroAverage[]
}
