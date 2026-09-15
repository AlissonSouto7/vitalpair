import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { api } from './client'

import { server } from '@/test/msw/server'

/**
 * What a 401 means depends on which route answered it.
 *
 * On an ordinary endpoint it means the access token expired, and the right move is to refresh
 * and retry. On the sign-in routes it is the answer itself: the password was wrong. The
 * interceptor used to treat both the same, so signing in with a wrong password tried to
 * refresh a session that never existed, and the person read "Sessão expirada. Faça login
 * novamente." on the login screen while the server's own "Credenciais inválidas" was
 * discarded on the way.
 */
describe('a 401 from the API', () => {
  it("keeps the server's reason when the login itself is refused", async () => {
    const refreshCalls = vi.fn()
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(
          { success: false, message: 'Credenciais inválidas', data: null },
          { status: 401 },
        ),
      ),
      http.post('*/auth/refresh', () => {
        refreshCalls()
        return HttpResponse.json(
          { success: false, message: 'no session', data: null },
          { status: 401 },
        )
      }),
    )

    const error = await api
      .post('/auth/login', { email: 'a@b.com', password: 'wrong' })
      .then(() => null)
      .catch((e: unknown) => e)

    // The message the person needs is the one naming what went wrong.
    expect((error as { response?: { data?: { message?: string } } }).response?.data?.message).toBe(
      'Credenciais inválidas',
    )
    // And no attempt was made to refresh a session that does not exist.
    expect(refreshCalls).not.toHaveBeenCalled()
  })

  it('does not try to refresh when signing in with Google is refused', async () => {
    const refreshCalls = vi.fn()
    server.use(
      http.post('*/auth/oauth2/google', () =>
        HttpResponse.json(
          { success: false, message: 'Token inválido', data: null },
          { status: 401 },
        ),
      ),
      http.post('*/auth/refresh', () => {
        refreshCalls()
        return HttpResponse.json(
          { success: false, message: 'no session', data: null },
          { status: 401 },
        )
      }),
    )

    await api.post('/auth/oauth2/google', { credential: 'bad' }).catch(() => null)

    expect(refreshCalls).not.toHaveBeenCalled()
  })

  it('still refreshes and retries when an ordinary endpoint says the token expired', async () => {
    let profileCalls = 0
    server.use(
      http.get('*/users/me', ({ request }) => {
        profileCalls += 1
        if (profileCalls === 1) {
          return HttpResponse.json(
            { success: false, message: 'expired', data: null },
            { status: 401 },
          )
        }
        // The retry must carry the token the refresh handed back, or the whole mechanism is
        // refreshing for nothing.
        return HttpResponse.json({
          success: true,
          message: 'ok',
          data: { auth: request.headers.get('Authorization') },
        })
      }),
      http.post('*/auth/refresh', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: { accessToken: 'fresh-token', userId: 'u1' },
        }),
      ),
    )

    const response = await api.get<{ data: { auth: string } }>('/users/me')

    expect(profileCalls).toBe(2)
    expect(response.data.data.auth).toBe('Bearer fresh-token')
  })
})
