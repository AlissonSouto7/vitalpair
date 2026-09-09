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
} from '@/test/fixtures'
import { fail, ok, path, recording } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'

/** The keys under a namespace whose value is a string, which is what a test asserts on. */
type LeafKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T]

const loose = i18n.t as unknown as (key: string, vars?: Record<string, string>) => string
const n = (key: LeafKeys<TranslationBundle['nutrition']>, vars?: Record<string, string>) =>
  loose(`nutrition.${key}`, vars)

/** The two reads the screen always makes. Tabs add their own on top. */
function mount() {
  server.use(
    http.get(path('/nutrition/logs'), () => ok(foodLogsFixture)),
    http.get(path('/nutrition/summary'), () => ok(dailySummaryFixture)),
  )
  return renderWithProviders(<NutritionPage />)
}

describe('NutritionPage', () => {
  it('shows the day and its meals', async () => {
    mount()

    expect(await screen.findByText(n('todayTitle'))).toBeInTheDocument()
    expect(await screen.findByText('Banana')).toBeInTheDocument()
  })

  it('says so when the day cannot be loaded', async () => {
    server.use(
      http.get(path('/nutrition/logs'), () => fail(500, 'Erro interno')),
      http.get(path('/nutrition/summary'), () => fail(500, 'Erro interno')),
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
      http.delete(path('/nutrition/logs/:id'), () => fail(500, 'Erro interno')),
    )
    const { user } = renderWithProviders(<NutritionPage />)

    await user.click(await screen.findByLabelText(n('removeAria', { name: 'Banana' })))

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno')
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
    await screen.findByText(n('todayTitle'))

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
