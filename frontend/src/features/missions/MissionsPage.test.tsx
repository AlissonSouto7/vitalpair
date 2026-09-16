import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { MissionsPage } from './MissionsPage'

import i18n from '@/i18n'
import { ok, path } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import type { FlashMission, WeeklyMission } from '@/types/missions'

/**
 * Os payloads são os que a API local devolveu em 15/09/2026: é o texto gravado em pt-BR nas
 * migrations V13 e V15 que estes testes existem para cobrir.
 */
const FLASH: FlashMission = {
  code: 'FLASH_THREE_MEALS',
  title: 'Registre 3 refeições hoje',
  description: 'Não pula refeição',
  reward: 30,
  expiresAt: '2099-01-01T00:00:00Z',
  accepted: false,
}

function weekly(over: Partial<WeeklyMission> = {}): WeeklyMission {
  return {
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
    ...over,
  }
}

const PAIR = weekly({
  code: 'PAIR_WORKOUTS_3',
  title: 'Treinem 3x essa semana, os dois',
  subtitle: 'Só vale se os dois fizerem a parte',
  icon: 'USERS',
  scope: 'PAIR',
  target: 3,
  partnerName: 'Bel',
  partnerCurrent: 1,
})

const DONE = weekly({
  code: 'WORKOUTS_3',
  title: 'Treine 3x essa semana',
  subtitle: 'Bora suar a camisa',
  icon: 'WORKOUT',
  target: 3,
  current: 3,
  completed: true,
})

function theServerAnswers(flash: FlashMission | null, list: WeeklyMission[]) {
  server.use(
    http.get(path('/missions/flash'), () => ok(flash)),
    http.get(path('/missions/weekly'), () => ok(list)),
    http.post(path('/missions/flash/accept'), () => ok({ ...FLASH, accepted: true })),
  )
}

afterEach(async () => {
  await i18n.changeLanguage('pt')
})

describe('MissionsPage', () => {
  it('shows every mission in the interface language, not the one in the database', async () => {
    // O catálogo é texto fixo em pt-BR no banco, e a missão é o conteúdo principal desta
    // tela: em inglês ela aparecia inteira em português. Cobre os quatro cartões de uma
    // vez, porque cada um passa por um componente diferente.
    theServerAnswers(FLASH, [weekly(), PAIR, DONE])

    renderWithProviders(<MissionsPage />)
    expect(await screen.findByText('Registre 3 refeições hoje')).toBeInTheDocument()

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    expect(await screen.findByText('Log 3 meals today')).toBeInTheDocument()
    expect(screen.getByText('No skipping meals')).toBeInTheDocument()
    expect(screen.getByText('Log meals on 5 days')).toBeInTheDocument()
    expect(screen.getByText('Without skipping a day')).toBeInTheDocument()
    expect(screen.getByText('Both of you train 3x this week')).toBeInTheDocument()
    expect(screen.getByText('Train 3x this week')).toBeInTheDocument()
    expect(screen.queryByText('Registre 3 refeições hoje')).not.toBeInTheDocument()
  })

  it('files each mission under the section it belongs to', async () => {
    // Três filtros decidem onde cada missão cai, e um deles exige partnerName além do
    // escopo. Uma missão de par sem par cairia em lugar nenhum, silenciosamente.
    theServerAnswers(FLASH, [weekly(), PAIR, DONE])

    renderWithProviders(<MissionsPage />)

    const thisWeek = (
      await screen.findByRole('heading', { name: i18n.t('missions.sectionThisWeek') })
    ).parentElement!
    expect(within(thisWeek).getByText('Registre refeições em 5 dias')).toBeInTheDocument()
    expect(within(thisWeek).queryByText('Treine 3x essa semana')).not.toBeInTheDocument()

    const doneSection = screen.getByRole('heading', {
      name: i18n.t('missions.sectionDone'),
    }).parentElement!
    expect(within(doneSection).getByText('Treine 3x essa semana')).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: i18n.t('missions.sectionPair', { partner: 'Bel' }) }),
    ).toBeInTheDocument()
  })

  it('hides a pair mission while there is no partner to share it with', async () => {
    // O filtro exige partnerName, e não só o escopo: um cartão "Você e seu par" para quem
    // está sozinho cobra uma pessoa que não existe.
    theServerAnswers(FLASH, [weekly(), { ...PAIR, partnerName: null }])

    renderWithProviders(<MissionsPage />)
    await screen.findByRole('heading', { level: 1 })

    expect(screen.queryByText('Treinem 3x essa semana, os dois')).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t('missions.sectionPairHint'))).not.toBeInTheDocument()
  })

  it('marks the flash mission as taken without a reload', async () => {
    // O aceite escreve no cache que o card da home também lê, então o botão tem de virar
    // estado na hora: um "Topar" que continua clicável depois de aceito convida ao clique
    // duplo.
    theServerAnswers(FLASH, [weekly()])

    renderWithProviders(<MissionsPage />)
    await userEvent.click(
      await screen.findByRole('button', { name: i18n.t('missions.flashAccept') }),
    )

    expect(await screen.findByText(i18n.t('missions.flashAccepted'))).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: i18n.t('missions.flashAccept') }),
    ).not.toBeInTheDocument()
  })

  it('says there is nothing on when the week is empty', async () => {
    theServerAnswers(null, [])

    renderWithProviders(<MissionsPage />)

    expect(await screen.findByText(i18n.t('missions.emptyTitle'))).toBeInTheDocument()
  })
})
