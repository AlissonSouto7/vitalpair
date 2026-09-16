import { describe, expect, it } from 'vitest'

import { flashCopy, weeklyCopy } from './missionCopy'

import i18n from '@/i18n'
import type { FlashMission, WeeklyMission } from '@/types/missions'

/**
 * Os payloads são os que a API local devolveu em 15/09/2026, e não inventados: é o texto
 * gravado em pt-BR nas migrations V13 e V15 que estes testes existem para cobrir.
 *
 * Tipados como a API os entrega, e não como objetos soltos: se o contrato mudar, o
 * compilador acusa aqui em vez de o teste seguir passando sobre uma forma que não existe
 * mais.
 */
const FLASH: FlashMission = {
  code: 'FLASH_THREE_MEALS',
  title: 'Registre 3 refeições hoje',
  description: 'Não pula refeição',
  reward: 30,
  expiresAt: '2026-09-16T02:59:59Z',
  accepted: false,
}

const WEEKLY: WeeklyMission = {
  code: 'MEAL_DAYS_5',
  title: 'Registre refeições em 5 dias',
  subtitle: 'Sem pular nenhum dia',
  reward: 40,
  target: 5,
  icon: 'MEAL',
  scope: 'SELF',
  current: 0,
  partnerName: null,
  partnerCurrent: null,
  completed: false,
}

describe('flashCopy', () => {
  it('translates the mission the server sends in Portuguese', async () => {
    await i18n.changeLanguage('en')

    expect(flashCopy(FLASH, i18n.t)).toEqual({
      title: 'Log 3 meals today',
      description: 'No skipping meals',
    })

    await i18n.changeLanguage('pt')
    expect(flashCopy(FLASH, i18n.t).title).toBe('Registre 3 refeições hoje')
  })

  it('falls back to the server text for a mission it does not know yet', async () => {
    // Sem o defaultValue a tela mostraria "missions.mission.FLASH_SUNRISE.title" ao usuário.
    await i18n.changeLanguage('en')

    expect(
      flashCopy(
        { ...FLASH, code: 'FLASH_SUNRISE', title: 'Acorde às 5h', description: 'Conta dobrado' },
        i18n.t,
      ),
    ).toEqual({ title: 'Acorde às 5h', description: 'Conta dobrado' })

    await i18n.changeLanguage('pt')
  })

  it('carries no support line when the server sends none', () => {
    // O card só desenha a linha quando ela existe: devolver string vazia acenderia um
    // parágrafo em branco embaixo do título.
    expect(flashCopy({ ...FLASH, description: null }, i18n.t).description).toBe(null)
  })
})

describe('weeklyCopy', () => {
  it('reads the support line from subtitle, which is where the weekly table keeps it', async () => {
    // As duas tabelas nomeiam o mesmo campo de formas diferentes. Ler o campo errado faria
    // a linha de apoio das semanais sumir da tela em vez de aparecer traduzida.
    await i18n.changeLanguage('en')

    expect(weeklyCopy(WEEKLY, i18n.t)).toEqual({
      title: 'Log meals on 5 days',
      description: 'Without skipping a day',
    })

    await i18n.changeLanguage('pt')
    expect(weeklyCopy(WEEKLY, i18n.t).description).toBe('Sem pular nenhum dia')
  })

  it('falls back to the server text for a mission it does not know yet', async () => {
    await i18n.changeLanguage('en')

    expect(
      weeklyCopy(
        { ...WEEKLY, code: 'SLEEP_8H', title: 'Durma 8h', subtitle: 'Toda noite' },
        i18n.t,
      ),
    ).toEqual({ title: 'Durma 8h', description: 'Toda noite' })

    await i18n.changeLanguage('pt')
  })

  it('carries no support line when the server sends none', () => {
    expect(weeklyCopy({ ...WEEKLY, subtitle: null }, i18n.t).description).toBe(null)
  })
})
