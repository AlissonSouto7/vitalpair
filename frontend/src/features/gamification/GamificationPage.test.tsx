import { act, screen } from '@testing-library/react'
import { http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { GamificationPage } from './GamificationPage'

import i18n from '@/i18n'
import { ok, path } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

/**
 * O catálogo como o servidor manda: nome e descrição gravados em pt-BR no banco, com um
 * `code` estável. O payload é o que a API local devolveu de verdade em 15/09/2026, e não um
 * inventado, porque é justamente o texto fixo dele que o teste existe para cobrir.
 */
const CATALOG = [
  {
    code: 'FIRST_MEAL',
    name: 'Primeira refeição',
    description: 'Registrou a primeira refeição',
    icon: 'fa-utensils',
    category: 'NUTRITION',
  },
  {
    code: 'PAIR_FORMED',
    name: 'Dupla formada',
    description: 'Formou um par no VitalPair',
    icon: 'fa-users',
    category: 'SOCIAL',
  },
]

function theServerAnswers(catalog: unknown[] = CATALOG) {
  server.use(
    http.get(path('/gamification/streaks'), () => ok([])),
    http.get(path('/gamification/badges'), () => ok([])),
    http.get(path('/gamification/badges/catalog'), () => ok(catalog)),
  )
}

afterEach(async () => {
  await i18n.changeLanguage('pt')
})

describe('GamificationPage', () => {
  it('names the medals in the interface language, not the one stored in the database', async () => {
    // O catálogo é texto fixo em pt-BR no banco, então uma tela em inglês mostrava
    // "Primeira refeição" no meio dela. A tradução acontece pelo `code`, que é estável.
    theServerAnswers()

    renderWithProviders(<GamificationPage />)
    expect(await screen.findByText('Primeira refeição')).toBeInTheDocument()

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    expect(await screen.findByText('First meal')).toBeInTheDocument()
    expect(await screen.findByText('Logged your first meal')).toBeInTheDocument()
    expect(screen.queryByText('Primeira refeição')).not.toBeInTheDocument()
  })

  it('falls back to the server text for a medal it does not know yet', async () => {
    // O servidor pode ganhar uma medalha antes deste bundle. Sem o defaultValue a tela
    // mostraria a chave crua, "gamification.badge.MOON_WALK.name", para o usuário.
    theServerAnswers([
      {
        code: 'MOON_WALK',
        name: 'Caminhou na lua',
        description: 'Deu 384.400 km de passos',
        icon: 'fa-moon',
        category: 'WORKOUT',
      },
    ])

    renderWithProviders(<GamificationPage />)

    expect(await screen.findByText('Caminhou na lua')).toBeInTheDocument()
    expect(screen.queryByText(/gamification\.badge/)).not.toBeInTheDocument()
  })

  it('groups the medals by family instead of one long wall', async () => {
    theServerAnswers()

    renderWithProviders(<GamificationPage />)

    expect(
      await screen.findByRole('heading', { name: i18n.t('gamification.category.NUTRITION') }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: i18n.t('gamification.category.SOCIAL') }),
    ).toBeInTheDocument()
  })
})
