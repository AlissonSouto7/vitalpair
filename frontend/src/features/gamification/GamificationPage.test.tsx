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

describe('GamificationPage: when each badge was earned', () => {
  /**
   * The API has always sent `earnedAt` with every badge, and the screen threw it away: it
   * reduced the list to a set of codes, so a tile knew it was unlocked and not when. A
   * badge without its date is a fact with no story; "9 Sept" is what makes it a memory.
   */
  function theServerAnswersWithDate(earnedAt: string) {
    server.use(
      http.get(path('/gamification/streaks'), () => ok([])),
      http.get(path('/gamification/badges'), () => ok([{ badge: CATALOG[1], earnedAt }])),
      http.get(path('/gamification/badges/catalog'), () => ok(CATALOG)),
    )
  }

  it('shows the day an earned badge was earned', async () => {
    theServerAnswersWithDate('2026-09-16T13:45:00Z')
    renderWithProviders(<GamificationPage />)

    await screen.findByText('Dupla formada')
    expect(screen.getByText(/16 de set\./)).toBeInTheDocument()
  })

  it('says nothing about a date on a badge nobody has yet', async () => {
    // A locked tile has no date to show, and inventing one ("not yet") adds a line of
    // nothing to every card on the grid.
    theServerAnswersWithDate('2026-09-16T13:45:00Z')
    renderWithProviders(<GamificationPage />)

    await screen.findByText('Primeira refeição')
    // Only one date on the screen: the earned badge's.
    expect(screen.getAllByText(/de set\./)).toHaveLength(1)
  })

  it('reads the date in the reader own calendar order', async () => {
    theServerAnswersWithDate('2026-09-16T13:45:00Z')
    renderWithProviders(<GamificationPage />)
    await screen.findByText('Dupla formada')

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    expect(screen.getByText(/Sep 16/)).toBeInTheDocument()
  })
})

describe('GamificationPage: the streak about to break', () => {
  const base = { type: 'NUTRITION_LOG' as const, longestCount: 9, lastActivityDate: '2026-10-13' }

  function theServerAnswersWithStreak(streak: unknown) {
    server.use(
      http.get(path('/gamification/streaks'), () => ok([streak])),
      http.get(path('/gamification/badges'), () => ok([])),
      http.get(path('/gamification/badges/catalog'), () => ok(CATALOG)),
    )
  }

  it('warns the person on the day their streak would end', async () => {
    // The whole point of a streak is the fear of losing it, and the app knew the streak was
    // one day from zero and said nothing. The API has sent lastActivityDate from the start.
    theServerAnswersWithStreak({
      ...base,
      currentCount: 5,
      recordedToday: false,
      breaksToday: true,
    })
    renderWithProviders(<GamificationPage />)

    expect(await screen.findByText(i18n.t('gamification.breaksToday'))).toBeInTheDocument()
  })

  it('says nothing once the day is already recorded', async () => {
    theServerAnswersWithStreak({
      ...base,
      currentCount: 6,
      recordedToday: true,
      breaksToday: false,
    })
    renderWithProviders(<GamificationPage />)

    await screen.findByText(i18n.t('gamification.streakLabel.NUTRITION_LOG'))
    expect(screen.queryByText(i18n.t('gamification.breaksToday'))).not.toBeInTheDocument()
  })

  it('says nothing about a streak that is already gone', async () => {
    // currentCount at zero: there is nothing left to lose, and "it breaks today" would be
    // a warning about something that already happened.
    theServerAnswersWithStreak({
      ...base,
      currentCount: 0,
      recordedToday: false,
      breaksToday: false,
    })
    renderWithProviders(<GamificationPage />)

    await screen.findByText(i18n.t('gamification.streakLabel.NUTRITION_LOG'))
    expect(screen.queryByText(i18n.t('gamification.breaksToday'))).not.toBeInTheDocument()
  })
})

describe('GamificationPage: the weeks already played', () => {
  /**
   * A tabela competition_scores acumulava uma linha por semana desde que a feature subiu e
   * só a semana corrente era lida: toda semana fechada era gravada e jogada fora. Medido no
   * banco local antes da correção: 30 linhas em 5 semanas distintas, nenhuma visível.
   *
   * O servidor manda cada semana já do lado de quem pediu (`yours`, `theirs`, `outcome`),
   * porque a linha gravada guarda user1/user2, que são posições do par e não pessoas.
   */
  const HISTORY = [
    { weekStart: '2026-10-05', yours: 120, theirs: 80, outcome: 'WON' as const },
    { weekStart: '2026-09-28', yours: 60, theirs: 95, outcome: 'LOST' as const },
    { weekStart: '2026-09-21', yours: 70, theirs: 70, outcome: 'TIED' as const },
  ]

  function theServerAnswersWithHistory(history: typeof HISTORY) {
    server.use(
      http.get(path('/gamification/streaks'), () => ok([])),
      http.get(path('/gamification/badges'), () => ok([])),
      http.get(path('/gamification/badges/catalog'), () => ok(CATALOG)),
      http.get(path('/gamification/competition'), () =>
        ok({
          weekStart: '2026-10-12',
          user1Score: 40,
          user2Score: 25,
          winnerId: null,
          history,
        }),
      ),
    )
  }

  it('shows every closed week with both scores', async () => {
    theServerAnswersWithHistory(HISTORY)
    renderWithProviders(<GamificationPage />)

    await screen.findByText(i18n.t('gamification.weekHistory'))

    /*
     * Cada número do SEU lado, não só presente na tela.
     *
     * A primeira versão deste teste só procurava "120" e "80" em qualquer lugar, e passava
     * igual com os dois trocados: foi a sabotagem que mostrou isso. Como trocar os lados é
     * exatamente o defeito que o histórico vindo do servidor veio evitar, o teste tem de
     * olhar a cor, que é o que diz de quem é o número.
     */
    const meu = screen.getByText('120')
    const dele = screen.getByText('80')
    expect(meu).toHaveClass('text-you-ink')
    expect(dele).toHaveClass('text-pair-ink')

    // E a de 21/09, empatada, que não é derrota.
    expect(screen.getByText(i18n.t('gamification.weekTied'))).toBeInTheDocument()
  })

  it('says who won each week from the reader own side', async () => {
    theServerAnswersWithHistory(HISTORY)
    renderWithProviders(<GamificationPage />)

    await screen.findByText(i18n.t('gamification.weekHistory'))
    expect(screen.getByText(i18n.t('gamification.weekWon'))).toBeInTheDocument()
    expect(screen.getByText(i18n.t('gamification.weekLost'))).toBeInTheDocument()
  })

  it('says nothing at all when there is no week to show yet', async () => {
    // Semana um: a seção inteira sai, em vez de um cabeçalho sobre uma lista vazia.
    theServerAnswersWithHistory([])
    renderWithProviders(<GamificationPage />)

    await screen.findByText(i18n.t('gamification.badges'))
    expect(screen.queryByText(i18n.t('gamification.weekHistory'))).not.toBeInTheDocument()
  })
})
