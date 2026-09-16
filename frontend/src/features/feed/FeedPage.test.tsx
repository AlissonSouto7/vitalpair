import { screen, within } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { FeedPage } from './FeedPage'

import { useAuthStore } from '@/store/authStore'
import { ok, path } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import type { FeedItem } from '@/types/feed'

const ME = 'user-1'
const PARTNER = 'user-2'

function item(over: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'f1',
    userId: ME,
    actorName: 'Alisson',
    type: 'MEAL_LOGGED',
    title: null,
    subtitle: null,
    foodName: 'Arroz, feijão e frango',
    mealType: 'LUNCH',
    activityType: null,
    calories: 620,
    proteinG: 40,
    carbG: 80,
    fatG: 12,
    durationMinutes: null,
    points: 10,
    isPrivate: false,
    createdAt: new Date().toISOString(),
    reactionCounts: {},
    myReactions: [],
    ...over,
  }
}

function theServerAnswers(items: FeedItem[]) {
  server.use(
    http.get(path('/pair/feed'), () =>
      ok({
        content: items,
        page: 0,
        size: 20,
        totalElements: items.length,
        totalPages: 1,
        last: true,
      }),
    ),
    http.get(path('/pair'), () =>
      ok({
        id: 'pair-1',
        pairName: null,
        status: 'ACTIVE',
        relationshipType: 'PAIR',
        inviteCode: null,
        members: [
          { userId: ME, name: 'Alisson', email: 'a@x.app', avatarUrl: null },
          { userId: PARTNER, name: 'Bel', email: 'b@x.app', avatarUrl: null },
        ],
      }),
    ),
  )
}

/** O cartão de um item, achado pelo nome do alimento que ele mostra. */
function card(food: string): HTMLElement {
  return screen.getByText(new RegExp(food)).closest('article, div[class*="rounded"]') as HTMLElement
}

describe('FeedPage', () => {
  it('scores each line in the colour of whoever made it', async () => {
    /*
      O chip de pontos era verde para os dois. Verde no sistema significa concluído, então um
      "+10 pts" verde no item do par dizia "feito" em vez de "dele". Num feed em que as duas
      pessoas aparecem intercaladas, a cor é o que separa quem marcou de quem só leu.
    */
    useAuthStore.setState({ userId: ME })
    theServerAnswers([
      item({ id: 'meu', foodName: 'Arroz, feijão e frango', points: 10 }),
      item({
        id: 'dela',
        userId: PARTNER,
        actorName: 'Bel',
        foodName: 'Salada com atum',
        points: 15,
      }),
    ])

    renderWithProviders(<FeedPage />)

    const mine = await screen.findByText('+10 pts')
    const theirs = screen.getByText('+15 pts')
    expect(mine.className).toContain('text-you-ink')
    expect(theirs.className).toContain('text-pair-ink')
    // E nenhum dos dois em verde, que é a cor de outra coisa.
    expect(mine.className).not.toContain('success')
    expect(theirs.className).not.toContain('success')
  })

  it('shows no points chip for a record that scored nothing', async () => {
    // Só o primeiro registro do dia de cada tipo pontua; os outros vêm com zero. Um chip
    // "+0 pts" diria que a pessoa não ganhou nada, quando o certo é não dizer nada.
    useAuthStore.setState({ userId: ME })
    theServerAnswers([item({ foodName: 'Segundo prato do dia', points: 0 })])

    renderWithProviders(<FeedPage />)
    await screen.findByText(/Segundo prato do dia/)

    expect(screen.queryByText(/\+0 pts/)).not.toBeInTheDocument()
    expect(screen.queryByText(/pts/)).not.toBeInTheDocument()
  })

  it('tells the two people apart by the avatar, not only by the name', async () => {
    // A mesma lei do placar: azul é você, bordô é o par, e o par ainda leva o canto
    // recortado, que é o que sobrevive a uma foto por cima e ao preto e branco.
    useAuthStore.setState({ userId: ME })
    theServerAnswers([
      item({ id: 'meu', foodName: 'Meu almoço' }),
      item({ id: 'dela', userId: PARTNER, actorName: 'Bel', foodName: 'Almoço dela' }),
    ])

    renderWithProviders(<FeedPage />)
    await screen.findByText(/Meu almoço/)

    expect(within(card('Meu almoço')).getByText('A').className).toContain('bg-you')
    expect(within(card('Almoço dela')).getByText('B').className).toContain('bg-pair')
  })
})
