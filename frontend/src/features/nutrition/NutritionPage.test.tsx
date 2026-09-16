import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { NutritionPage } from './NutritionPage'

import type { TranslationBundle } from '@/locales'
import {
  dailySummaryFixture,
  favoriteFoodsFixture,
  foodLogsFixture,
  foodProductsFixture,
  freeEntitlementFixture,
  pairActiveFixture,
  premiumEntitlementFixture,
} from '@/test/fixtures'
import { fail, ok, path, recording } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'
import type { Entitlement } from '@/types/entitlement'

/** The keys under a namespace whose value is a string, which is what a test asserts on. */
type LeafKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T]

const loose = i18n.t as unknown as (key: string, vars?: Record<string, string>) => string
const n = (key: LeafKeys<TranslationBundle['nutrition']>, vars?: Record<string, string>) =>
  loose(`nutrition.${key}`, vars)

/**
 * The reads the screen always makes: the day, the pair (the empty plate names the partner),
 * and the entitlement the photo tab (the default tab) asks before offering the camera. Tabs
 * add their own on top.
 */
function mount(entitlement: Entitlement = premiumEntitlementFixture) {
  server.use(
    http.get(path('/nutrition/logs'), () => ok(foodLogsFixture)),
    http.get(path('/nutrition/summary'), () => ok(dailySummaryFixture)),
    http.get(path('/pair'), () => ok(pairActiveFixture)),
    http.get(path('/entitlements/me'), () => ok(entitlement)),
  )
  return renderWithProviders(<NutritionPage />)
}

describe('NutritionPage photo tab and the paid plan', () => {
  it('shows the paid-plan notice instead of the camera to a free account', async () => {
    mount(freeEntitlementFixture)

    expect(await screen.findByTestId('premium-callout')).toBeInTheDocument()
    expect(screen.queryByText(n('photoDropTitle'))).not.toBeInTheDocument()
  })

  it('offers the camera to an account with access', async () => {
    mount(premiumEntitlementFixture)

    expect(await screen.findByText(n('photoDropTitle'))).toBeInTheDocument()
    expect(screen.queryByTestId('premium-callout')).not.toBeInTheDocument()
  })
})

describe('NutritionPage', () => {
  it('shows the day and its meals', async () => {
    // O saldo do dia numa linha, e não o painel que repetia o Início. Quem abre esta tela
    // veio registrar, e já sabe quanto comeu.
    mount()

    expect(await screen.findByText(n('remainingKcal', { kcal: '1210' }))).toBeInTheDocument()
    expect(await screen.findByText('Banana')).toBeInTheDocument()
  })

  it('keeps the summary to a line, without repeating the home screen', async () => {
    // Aqui havia uma cópia do painel do Início: o mesmo anel de calorias e as mesmas três
    // barras de macro, ocupando a primeira dobra de uma tela cuja função é registrar.
    const { container } = mount()
    await screen.findByText(n('remainingKcal', { kcal: '1210' }))

    expect(screen.queryByText(n('proteinLabel'))).not.toBeInTheDocument()
    expect(container.querySelector('svg circle')).toBeNull()
  })

  it('says so when the day cannot be loaded', async () => {
    server.use(
      http.get(path('/nutrition/logs'), () => fail(500, 'Erro interno')),
      http.get(path('/nutrition/summary'), () => fail(500, 'Erro interno')),
      http.get(path('/pair'), () => ok(pairActiveFixture)),
      http.get(path('/entitlements/me'), () => ok(premiumEntitlementFixture)),
    )
    renderWithProviders(<NutritionPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(n('loadError'))
  })

  it('shows the failure when removing a meal does not work', async () => {
    // The delete had no catch at all: a failed removal left the meal on screen with no
    // explanation, and the person could only tell by reloading.
    server.use(
      http.get(path('/nutrition/logs'), () => ok(foodLogsFixture)),
      http.get(path('/nutrition/summary'), () => ok(dailySummaryFixture)),
      http.get(path('/pair'), () => ok(pairActiveFixture)),
      http.delete(path('/nutrition/logs/:id'), () => fail(500, 'Erro interno')),
      http.get(path('/entitlements/me'), () => ok(premiumEntitlementFixture)),
    )
    const { user } = renderWithProviders(<NutritionPage />)

    await user.click(await screen.findByLabelText(n('removeAria', { name: 'Banana' })))
    // Remover pergunta antes: a ação leva junto a linha do feed e os pontos.
    await user.click(await screen.findByRole('button', { name: n('deleteConfirm') }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno')
  })

  it('asks before deleting, and says what goes with it', async () => {
    /*
      Era um clique só, sem volta. A refeição saía do dia, da linha do feed da dupla e levava
      os pontos que rendeu, e quem errasse o alvo só descobria depois.
    */
    server.use(
      http.get(path('/nutrition/logs'), () => ok(foodLogsFixture)),
      http.get(path('/nutrition/summary'), () => ok(dailySummaryFixture)),
      http.get(path('/pair'), () => ok(pairActiveFixture)),
      http.get(path('/entitlements/me'), () => ok(premiumEntitlementFixture)),
    )
    const { user } = renderWithProviders(<NutritionPage />)

    await user.click(await screen.findByLabelText(n('removeAria', { name: 'Banana' })))

    const box = await screen.findByRole('dialog')
    expect(box).toHaveAccessibleName(n('deleteTitle', { name: 'Banana' }))
    expect(box).toHaveAccessibleDescription(n('deleteText'))
  })

  it('keeps the meal when the person backs out', async () => {
    // A metade que importa mais: desistir não pode apagar nada.
    const removals: string[] = []
    server.use(
      http.get(path('/nutrition/logs'), () => ok(foodLogsFixture)),
      http.get(path('/nutrition/summary'), () => ok(dailySummaryFixture)),
      http.get(path('/pair'), () => ok(pairActiveFixture)),
      http.get(path('/entitlements/me'), () => ok(premiumEntitlementFixture)),
      http.delete(path('/nutrition/logs/:id'), ({ params }) => {
        removals.push(String(params.id))
        return ok(null)
      }),
    )
    const { user } = renderWithProviders(<NutritionPage />)

    await user.click(await screen.findByLabelText(n('removeAria', { name: 'Banana' })))
    await user.click(await screen.findByRole('button', { name: n('deleteCancel') }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // E nenhuma chamada saiu: a tela sem o item provaria só o render, não o pedido retido.
    expect(removals).toEqual([])
  })
})

describe('NutritionPage favourites tab', () => {
  it('loads favourites only once the tab is opened', async () => {
    let reads = 0
    server.use(
      http.get(path('/nutrition/favorites'), () => {
        reads++
        return ok(favoriteFoodsFixture)
      }),
    )
    const { user } = mount()
    await screen.findByText(n('remainingKcal', { kcal: '1210' }))

    // The old effect fetched on mount regardless; the query is enabled by the tab.
    expect(reads).toBe(0)

    await user.click(screen.getByRole('button', { name: new RegExp(n('tabFavorites')) }))

    await waitFor(() => expect(reads).toBe(1))
    expect(await screen.findByText('Ovo mexido')).toBeInTheDocument()
  })

  it('logs a favourite in one tap and refreshes the day', async () => {
    const { handler, calls } = recording<{ foodName: string }>('post', '/nutrition/logs', () =>
      ok(foodLogsFixture[0]),
    )
    let summaryReads = 0
    server.use(
      http.get(path('/nutrition/logs'), () => ok(foodLogsFixture)),
      http.get(path('/nutrition/summary'), () => {
        summaryReads++
        return ok(dailySummaryFixture)
      }),
      http.get(path('/pair'), () => ok(pairActiveFixture)),
      http.get(path('/nutrition/favorites'), () => ok(favoriteFoodsFixture)),
      handler,
    )
    const { user } = renderWithProviders(<NutritionPage />)

    await user.click(await screen.findByRole('button', { name: new RegExp(n('tabFavorites')) }))
    await user.click(await screen.findByLabelText(n('addAria', { name: 'Ovo mexido' })))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].foodName).toBe('Ovo mexido')
    // One read to paint, one after the write: the totals cannot be left stale.
    await waitFor(() => expect(summaryReads).toBe(2))
  })

  it('says so when the favourites cannot be loaded', async () => {
    server.use(
      http.get(path('/nutrition/logs'), () => ok(foodLogsFixture)),
      http.get(path('/nutrition/summary'), () => ok(dailySummaryFixture)),
      http.get(path('/pair'), () => ok(pairActiveFixture)),
      http.get(path('/nutrition/favorites'), () => fail(500, 'Erro interno')),
    )
    const { user } = renderWithProviders(<NutritionPage />)

    await user.click(await screen.findByRole('button', { name: new RegExp(n('tabFavorites')) }))

    // A failed load used to leave the tab silently empty forever, because the null check
    // that meant "not loaded yet" was also the guard against loading again.
    expect(await screen.findByRole('alert')).toHaveTextContent(n('favoritesLoadError'))
  })
})

describe('NutritionPage search tab', () => {
  it('gives each result a quieter add button than the one that saves', async () => {
    // Uma busca devolve dez resultados, e dez botões em cor de ação são dez chamadas
    // competindo com a única que de fato grava a refeição. O "+" fica no tom suave; o
    // cheio pertence à barra que confirma o registro.
    server.use(http.get(path('/nutrition/foods/search'), () => ok(foodProductsFixture)))
    const { user, container } = mount()

    await user.click(await screen.findByRole('button', { name: new RegExp(n('tabSearch')) }))
    await user.type(screen.getByPlaceholderText(n('searchInputPlaceholder')), 'iogurte')
    await screen.findByText('Iogurte natural')

    const filled = [...container.querySelectorAll('button')].filter(
      (el) => el.className.includes('bg-act') && !el.className.includes('bg-act-soft'),
    )
    expect(filled).toHaveLength(0)
  })

  it('does not search on one letter', async () => {
    let searches = 0
    server.use(
      http.get(path('/nutrition/foods/search'), () => {
        searches++
        return ok(foodProductsFixture)
      }),
    )
    const { user } = mount()

    await user.click(await screen.findByRole('button', { name: new RegExp(n('tabSearch')) }))
    await user.type(screen.getByPlaceholderText(n('searchInputPlaceholder')), 'i')

    await waitFor(() => expect(searches).toBe(0), { timeout: 1200 })
  })

  it('searches once the term is long enough, and shows what came back', async () => {
    server.use(http.get(path('/nutrition/foods/search'), () => ok(foodProductsFixture)))
    const { user } = mount()

    await user.click(await screen.findByRole('button', { name: new RegExp(n('tabSearch')) }))
    await user.type(screen.getByPlaceholderText(n('searchInputPlaceholder')), 'iogurte')

    expect(await screen.findByText('Iogurte natural')).toBeInTheDocument()
  })
})
