import { describe, expect, it } from 'vitest'

import { mealForHour } from './mealForHour'

describe('mealForHour', () => {
  it('picks the meal somebody is actually logging at that hour', () => {
    // Era 'LUNCH' fixo: quem registrava o jantar às nove da noite encontrava "Almoço"
    // marcado, e o erro caro é o silencioso, registrar no lugar errado sem reparar.
    expect(mealForHour(7)).toBe('BREAKFAST')
    expect(mealForHour(10)).toBe('BREAKFAST')
    expect(mealForHour(12)).toBe('LUNCH')
    expect(mealForHour(15)).toBe('LUNCH')
    expect(mealForHour(21)).toBe('DINNER')
  })

  it('covers every hour of the day and never guesses snack', () => {
    // As bordas das faixas e a madrugada, que é onde um `if` mal fechado deixa um buraco.
    // E nenhuma hora resolve para SNACK de propósito: lanche é escolha, nunca palpite,
    // porque uma refeição marcada como lanche por engano não bate com nada.
    const all = Array.from({ length: 24 }, (_, h) => mealForHour(h))

    expect(all).toHaveLength(24)
    expect(all.every((m) => m === 'BREAKFAST' || m === 'LUNCH' || m === 'DINNER')).toBe(true)
    expect(all).not.toContain('SNACK')
    expect(mealForHour(0)).toBe('BREAKFAST')
    expect(mealForHour(11)).toBe('LUNCH')
    expect(mealForHour(16)).toBe('DINNER')
    expect(mealForHour(23)).toBe('DINNER')
  })
})
