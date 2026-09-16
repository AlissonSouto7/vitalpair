import { act, screen, within } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { DashboardPage } from './DashboardPage'

import i18n from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { ok, path } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import type { Dashboard, DayProgress } from '@/types/dashboard'

const ME = 'user-1'
const PARTNER = 'user-2'

function day(over: Partial<DayProgress> = {}): DayProgress {
  return {
    calorieTarget: 2211,
    consumedCalories: 1220,
    burnedCalories: 730,
    netCalories: 490,
    remainingCalories: 1721,
    consumedProteinG: 102,
    consumedCarbG: 108,
    consumedFatG: 41,
    proteinTargetG: 156,
    carbTargetG: 257,
    fatTargetG: 62,
    steps: 8400,
    mealCount: 3,
    ...over,
  }
}

function dashboard(over: Partial<DayProgress> = {}): Dashboard {
  return {
    date: '2026-09-15',
    me: day(over),
    partner: {
      userId: PARTNER,
      name: 'Bel',
      avatarUrl: null,
      calorieTarget: 2000,
      consumedCalories: 900,
      burnedCalories: 200,
      netCalories: 700,
    },
  }
}

/**
 * The eight endpoints the screen asks for.
 *
 * Six of them are enrichment: the page renders without them, so they answer with empty
 * shapes rather than being left to fail. Only the dashboard and the pair decide whether the
 * screen can draw at all.
 */
function theServerAnswers(dash: Dashboard = dashboard()) {
  server.use(
    http.get(path('/dashboard'), () => ok(dash)),
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
    http.get(path('/gamification/competition'), () =>
      ok({ user1Score: 25, user2Score: 25, weekStart: '2026-09-15' }),
    ),
    http.get(path('/gamification/streaks'), () => ok([])),
    http.get(path('/activity/logs'), () => ok([])),
    http.get(path('/pair/feed'), () => ok({ content: [], page: 0, size: 4, totalElements: 0 })),
    http.get(path('/missions/flash'), () => ok(null)),
    http.get(path('/season'), () => ok(null)),
  )
}

/**
 * Números desenhados em tamanho de destaque, e não os que moram dentro de uma frase.
 *
 * Medido por tamanho de fonte e não por classe: o jsdom não aplica o CSS do Tailwind, então
 * a leitura vem do `style` que o componente define, que é onde o Stat decide o peso. Uma
 * versão anterior deste helper contava qualquer `.font-display`, o que incluía as três
 * estatísticas do rodapé e dava sete onde o navegador mostra quatro.
 */
function spotlightNumbers(container: HTMLElement): string[] {
  const isNumber = (text: string) => /^[\d.,]+$/.test(text)
  return [...container.querySelectorAll('[class*="text-[40px]"], [class*="text-2xl"]')]
    .map((el) => el.textContent?.trim() ?? '')
    .filter(isNumber)
}

describe('DashboardPage', () => {
  it('leads with what happened today, not with the time of day', async () => {
    // Era "Boa noite, Alisson": simpático, e sem ajudar ninguém a decidir o que fazer.
    useAuthStore.setState({ userId: ME })
    theServerAnswers()

    renderWithProviders(<DashboardPage />)

    expect(
      await screen.findByRole('heading', { name: i18n.t('dashboard.headlineSome', { count: 3 }) }),
    ).toBeInTheDocument()
  })

  it('says nothing is logged when nothing is', async () => {
    useAuthStore.setState({ userId: ME })
    theServerAnswers(dashboard({ mealCount: 0 }))

    renderWithProviders(<DashboardPage />)

    expect(
      await screen.findByRole('heading', { name: i18n.t('dashboard.headlineNone') }),
    ).toBeInTheDocument()
  })

  it('gives the spotlight to one number, the balance for the day', async () => {
    // A tela mostrava vinte e um números do mesmo peso na primeira dobra: um painel de
    // controle, não um ponto de partida. Agora um só é grande, e é o que decide a próxima
    // ação. Os demais continuam na tela, um degrau abaixo.
    useAuthStore.setState({ userId: ME })
    theServerAnswers()

    const { container } = renderWithProviders(<DashboardPage />)
    await screen.findByRole('heading', { level: 1 })

    const hero = container.querySelector('[class*="text-[40px]"]')
    expect(hero).toHaveTextContent('1.721')
    expect(spotlightNumbers(container).filter((n) => n === '1.721')).toHaveLength(1)
  })

  it('offers one action even when there is a mission to take', async () => {
    // Registrar refeição era laranja e "Topar missão" verde sólido, lado a lado: duas
    // chamadas do mesmo peso obrigavam a pessoa a escolher entre elas.
    //
    // Com missão de verdade, e não a ausência dela: sem missão o card mostra o estado
    // vazio e não há segundo botão nenhum, então o teste passaria sem exercitar nada.
    useAuthStore.setState({ userId: ME })
    theServerAnswers()
    server.use(
      http.get(path('/missions/flash'), () =>
        ok({
          id: 'm1',
          title: 'Registre 3 refeições hoje',
          description: 'Não pula refeição',
          reward: 30,
          accepted: false,
          expiresAt: '2026-09-16T00:00:00Z',
        }),
      ),
    )

    const { container } = renderWithProviders(<DashboardPage />)
    await screen.findByRole('button', { name: i18n.t('dashboard.acceptMission') })

    const filled = [...container.querySelectorAll('a, button')].filter((el) =>
      el.className.includes('bg-act'),
    )
    expect(filled).toHaveLength(1)
    expect(filled[0]).toHaveTextContent(i18n.t('dashboard.logMeal'))
  })

  it('formats numbers in the language the interface is in', async () => {
    // Era toLocaleString('pt-BR') fixo, então 8.400 aparecia com ponto para quem lia em
    // inglês, ao lado de outros números formatados com vírgula na mesma tela.
    //
    // A troca acontece depois de renderizar porque renderWithProviders fixa pt, e é
    // também a ordem real: o seletor de idioma fica em outra tela, então a pessoa chega
    // aqui e troca com a tela já montada.
    useAuthStore.setState({ userId: ME })
    theServerAnswers()

    renderWithProviders(<DashboardPage />)
    expect(await screen.findByText('8.400')).toBeInTheDocument()

    await i18n.changeLanguage('en')

    expect(await screen.findByText('8,400')).toBeInTheDocument()
    await i18n.changeLanguage('pt')
  })

  it('shows the balance as neutral while there is room, and amber once it is past', async () => {
    // A cor do saldo é informação, não ação: laranja o faria disputar com o botão.
    useAuthStore.setState({ userId: ME })
    theServerAnswers(dashboard({ remainingCalories: -180 }))

    const { container } = renderWithProviders(<DashboardPage />)
    await screen.findByRole('heading', { level: 1 })

    const over = within(container).getByText('180')
    expect(over.className).toContain('text-carb-ink')
    expect(over.className).not.toContain('text-act')
  })

  it('still renders when the enrichment calls fail', async () => {
    // Seis das oito chamadas são enriquecimento. Uma falha ali não pode apagar a tela,
    // que é o que aconteceria se todas fossem tratadas como obrigatórias.
    useAuthStore.setState({ userId: ME })
    theServerAnswers()
    server.use(
      http.get(path('/gamification/competition'), () => new Response(null, { status: 500 })),
      http.get(path('/season'), () => new Response(null, { status: 500 })),
    )

    renderWithProviders(<DashboardPage />)

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  })
  it('shows the mission card in the interface language, not the database one', async () => {
    // O card da home lê o mesmo catálogo em pt-BR da tela de Missões, então numa interface
    // em inglês ele mostrava "Registre 3 refeições hoje" logo abaixo do título traduzido.
    useAuthStore.setState({ userId: ME })
    theServerAnswers()
    server.use(
      http.get(path('/missions/flash'), () =>
        ok({
          id: 'm1',
          code: 'FLASH_THREE_MEALS',
          title: 'Registre 3 refeições hoje',
          description: 'Não pula refeição',
          reward: 30,
          accepted: false,
          expiresAt: '2099-01-01T00:00:00Z',
        }),
      ),
    )

    renderWithProviders(<DashboardPage />)
    expect(await screen.findByText('Registre 3 refeições hoje')).toBeInTheDocument()

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    expect(await screen.findByText('Log 3 meals today')).toBeInTheDocument()
    // A linha de apoio vive dentro da frase da recompensa, então é ali que ela aparece.
    expect(screen.getByText(/No skipping meals/)).toBeInTheDocument()
    expect(screen.queryByText('Registre 3 refeições hoje')).not.toBeInTheDocument()

    await i18n.changeLanguage('pt')
  })

  it('leaves out the reward detail when the mission has no support line', async () => {
    // Sem a descrição o card usa a frase curta: interpolar um texto vazio deixaria o
    // separador "·" solto no fim da linha.
    useAuthStore.setState({ userId: ME })
    theServerAnswers()
    server.use(
      http.get(path('/missions/flash'), () =>
        ok({
          id: 'm1',
          code: 'FLASH_THREE_MEALS',
          title: 'Registre 3 refeições hoje',
          description: null,
          reward: 30,
          accepted: false,
          expiresAt: '2099-01-01T00:00:00Z',
        }),
      ),
    )

    renderWithProviders(<DashboardPage />)

    expect(
      await screen.findByText(i18n.t('dashboard.missionReward', { reward: 30 })),
    ).toBeInTheDocument()
  })
})
