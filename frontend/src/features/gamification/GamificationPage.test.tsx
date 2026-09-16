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

  it('names the family on each medal, without a heading for every one', async () => {
    /*
      O agrupamento por seção vinha de um catálogo imaginado com vinte medalhas. São cinco,
      espalhadas em cinco famílias: cada seção abria uma linha de grade inteira para pôr uma
      medalha nela, e dois terços de cada faixa ficavam vazios. Medido: a página caiu de
      1074px para 708px quando a família passou para dentro do cartão.
    */
    theServerAnswers()

    renderWithProviders(<GamificationPage />)
    await screen.findByText('Primeira refeição')

    expect(screen.getByText(i18n.t('gamification.category.NUTRITION'))).toBeInTheDocument()
    expect(screen.getByText(i18n.t('gamification.category.SOCIAL'))).toBeInTheDocument()
    // E nenhum cabeçalho de seção por família, que era o que custava a linha.
    expect(
      screen.queryByRole('heading', { name: i18n.t('gamification.category.NUTRITION') }),
    ).not.toBeInTheDocument()
  })

  it('puts what the person already earned in front', async () => {
    // A tela é sobre o que a pessoa fez: com as bloqueadas no meio, quem tinha três medalhas
    // precisava caçar quais eram as verdes.
    server.use(
      http.get(path('/gamification/streaks'), () => ok([])),
      http.get(path('/gamification/badges'), () =>
        ok([{ badge: CATALOG[1], earnedAt: '2026-09-16T00:00:00Z' }]),
      ),
      http.get(path('/gamification/badges/catalog'), () => ok(CATALOG)),
    )

    const { container } = renderWithProviders(<GamificationPage />)
    await screen.findByText('Dupla formada')

    // Pelos nomes das medalhas, na ordem em que a grade os desenha.
    const nomes = CATALOG.map((b) => screen.getByText(b.name))
    const posicoes = nomes.map((el) => [...container.querySelectorAll('*')].indexOf(el))
    const primeira = CATALOG[posicoes.indexOf(Math.min(...posicoes))]
    expect(primeira.name).toBe('Dupla formada')
  })
})
