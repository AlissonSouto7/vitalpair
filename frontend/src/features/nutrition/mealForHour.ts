import type { MealType } from '@/types/nutrition'

/**
 * A refeição que já vem marcada, pela hora em que a pessoa abriu a tela.
 *
 * Era 'LUNCH' fixo, então quem registrava o jantar às nove da noite encontrava "Almoço"
 * marcado e ou desmarcava antes, ou registrava na refeição errada sem perceber, que é o
 * erro pior: o dado entra e ninguém repara.
 *
 * As faixas são as do hábito brasileiro, e nenhuma delas cai em SNACK: lanche é escolha, e
 * nunca o palpite certo, porque uma refeição marcada como lanche por engano não bate com
 * nada que a pessoa comeu.
 */
export function mealForHour(hour: number): MealType {
  if (hour < 11) return 'BREAKFAST'
  if (hour < 16) return 'LUNCH'
  return 'DINNER'
}
