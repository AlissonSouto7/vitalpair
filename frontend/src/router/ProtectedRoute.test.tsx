import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { ProtectedRoute } from './ProtectedRoute'

import { useAuthStore } from '@/store/authStore'

/** The two screens the guard chooses between, standing in for the real ones. */
function routes(startAt: string) {
  return (
    <MemoryRouter initialEntries={[startAt]}>
      <Routes>
        <Route path="/login" element={<p>tela de login</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>tela protegida</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

afterEach(() => {
  useAuthStore.getState().clear()
})

describe('ProtectedRoute', () => {
  it('lets a signed-in person through', () => {
    useAuthStore.setState({ accessToken: 'a-token' })

    render(routes('/dashboard'))

    expect(screen.getByText('tela protegida')).toBeInTheDocument()
  })

  it('sends an anonymous visitor to the login screen', () => {
    render(routes('/dashboard'))

    // The whole point of the guard. Without it every screen behind it renders for a moment
    // with no data and then fails its own requests, which looks like the app being broken
    // rather than the person being logged out.
    expect(screen.getByText('tela de login')).toBeInTheDocument()
    expect(screen.queryByText('tela protegida')).not.toBeInTheDocument()
  })

  it('shuts the door the moment the session ends', () => {
    // The axios interceptor clears the store when a refresh fails, and the person may be
    // sitting on a protected screen when that happens. The guard reads the store on every
    // render, so they are moved out rather than left on a screen whose every request 401s.
    useAuthStore.setState({ accessToken: 'a-token' })
    const { rerender } = render(routes('/dashboard'))
    expect(screen.getByText('tela protegida')).toBeInTheDocument()

    useAuthStore.getState().clear()
    rerender(routes('/dashboard'))

    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })
})
