import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import { http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { RequireOnboarding } from './RequireOnboarding'

import { fail, ok, path } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import type { UserProfile } from '@/types/profile'

/** A profile as the server sends it, empty where onboarding would have filled it in. */
function profile(over: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'u1',
    email: 'quem@vitalpair.app',
    emailVerified: true,
    name: 'Quem',
    birthDate: null,
    sex: null,
    heightCm: null,
    weightKg: null,
    goal: null,
    activityLevel: null,
    dailyCalorieTarget: null,
    proteinTargetG: null,
    carbTargetG: null,
    fatTargetG: null,
    avatarUrl: null,
    mascot: null,
    timeZone: 'America/Sao_Paulo',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...over,
  }
}

/** The two screens the guard chooses between, standing in for the real ones. */
function routes() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderWith(queryClient)
}

function renderWith(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/onboarding" element={<p>onboarding</p>} />
          <Route element={<RequireOnboarding />}>
            <Route path="/dashboard" element={<p>painel</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RequireOnboarding', () => {
  it('sends an account that never finished onboarding back to it', async () => {
    // Registration stopped signing people in, so everyone arrives through the sign-in
    // screen, which goes to the dashboard. Without this an account with no goal lands on
    // a dashboard with no calorie target and no season.
    server.use(http.get(path('/users/me'), () => ok(profile())))

    routes()

    expect(await screen.findByText('onboarding')).toBeInTheDocument()
    expect(screen.queryByText('painel')).not.toBeInTheDocument()
  })

  it('lets an account that finished onboarding through', async () => {
    server.use(http.get(path('/users/me'), () => ok(profile({ goal: 'LOSE_WEIGHT' }))))

    routes()

    expect(await screen.findByText('painel')).toBeInTheDocument()
  })

  it('does not redirect when the profile could not be read', async () => {
    // A failure is not proof the profile is empty. Redirecting on a server error would
    // bounce someone who did finish onboarding, and the screens below report their own.
    server.use(http.get(path('/users/me'), () => fail(500, 'pane')))

    routes()

    expect(await screen.findByText('painel')).toBeInTheDocument()
  })

  it('waits for the refetch it triggered instead of bouncing the person back', async () => {
    /*
      O loop que este guard quase causou.

      Ao terminar o onboarding a tela grava o perfil, invalida a query e navega para o
      painel. Entre a invalidação e a resposta, o estado do react-query ainda é "success"
      carregando o perfil vazio lido na entrada: decidir sobre ele devolveria ao primeiro
      passo quem acabou de concluir. Daí o guard esperar por `isFetching`, e não só por
      `isPending`.

      O cache entra semeado com o perfil vazio e o servidor já responde preenchido, que é
      exatamente o estado do app no instante em que o onboarding termina.
    */
    server.use(http.get(path('/users/me'), () => ok(profile({ goal: 'LOSE_WEIGHT' }))))

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['profile'], profile())
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    })

    renderWith(queryClient)

    expect(await screen.findByText('painel')).toBeInTheDocument()
    expect(screen.queryByText('onboarding')).not.toBeInTheDocument()
  })
})
