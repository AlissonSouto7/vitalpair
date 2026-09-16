import { describe, expect, it } from 'vitest'

import { stakeText } from './stake'

import i18n from '@/i18n'

describe('stakeText', () => {
  it('translates the value the server writes when nobody chose a stake', async () => {
    // O servidor grava SeasonService.DEFAULT_STAKE em português em toda temporada nova,
    // então a tela em inglês mostrava "Quem perder paga o jantar" entre os cartões.
    await i18n.changeLanguage('en')
    expect(stakeText('Quem perder paga o jantar', i18n.t)).toBe('Loser buys dinner')

    await i18n.changeLanguage('pt')
    expect(stakeText('Quem perder paga o jantar', i18n.t)).toBe('Quem perder paga o jantar')
  })

  it('leaves a stake somebody actually wrote exactly as it was written', async () => {
    // A metade que importa mais. A aposta é o que as duas pessoas combinaram entre si;
    // traduzi-la seria reescrever o combinado, e numa frase que só elas entendem o
    // resultado seria pior que o idioma errado.
    await i18n.changeLanguage('en')

    expect(stakeText('quem perder lava a louça a semana toda', i18n.t)).toBe(
      'quem perder lava a louça a semana toda',
    )
    expect(stakeText('Loser buys dinner', i18n.t)).toBe('Loser buys dinner')

    await i18n.changeLanguage('pt')
  })
})
