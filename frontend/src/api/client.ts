import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from '../store/authStore'
import type { ApiResponse } from '../types/api'
import type { TokenResponse } from '../types/auth'

import { notifyIfServerFailed } from '@/shared/api/notifyServerFailure'

/**
 * Where the API is, from the browser's point of view.
 *
 * A relative path by default, because on a server the interface and the API answer on the
 * same name: the edge proxy sends /api/ to the backend and everything else to these files.
 * That makes one built image correct for staging and for production, with no rebuild and
 * nothing to configure.
 *
 * The absolute default this used to carry was `http://localhost:8081/api/v1`, which is the
 * developer machine and, in any other browser, that person's own computer. It shipped to
 * the server that way and every call failed with "no connection to the server", because the
 * page really was asking the visitor's laptop for the API. Development still overrides it
 * through VITE_API_URL when the two run on different ports.
 */
const baseURL: string = import.meta.env.VITE_API_URL ?? '/api/v1'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  // The refresh token lives in an HttpOnly cookie, so the browser has to be told to send
  // it. Without this the session silently never renews and users are logged out every
  // fifteen minutes when the access token expires.
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// One shared refresh, so several requests failing with 401 at the same time produce a
// single call rather than a burst that rotates the token repeatedly.
let refreshing: Promise<string> | null = null

/**
 * Exchanges the refresh cookie for a new access token.
 *
 * Sends no body: the token is in the cookie, which client script cannot read by design.
 * Uses bare axios so it does not recurse through this instance's 401 handler.
 */
async function refreshAccessToken(): Promise<string> {
  // Typed rather than left as the response's default any: the two fields below are read
  // straight into the session, so a rename on the backend should break the build here
  // instead of producing an undefined token at runtime.
  const response = await axios.post<ApiResponse<TokenResponse>>(`${baseURL}/auth/refresh`, null, {
    withCredentials: true,
  })
  const data = response.data.data
  useAuthStore.getState().setSession({ accessToken: data.accessToken, userId: data.userId })
  return data.accessToken
}

/**
 * Restores the session on page load.
 *
 * The access token is kept in memory only, so a reload always starts without one. The
 * cookie survives, so a single refresh call brings the session back. A failure here is the
 * normal case for a logged-out visitor, not an error worth showing.
 */
export async function bootstrapSession(): Promise<void> {
  try {
    await refreshAccessToken()
  } catch {
    useAuthStore.getState().clear()
  } finally {
    useAuthStore.getState().setBootstrapped()
  }
}

/**
 * Routes where a 401 is the answer itself, not an expired session.
 *
 * Signing in with the wrong password answers 401 with "Credenciais inválidas", and the
 * interceptor below used to treat every 401 the same way: try to refresh, fail because there
 * is no session to refresh, and reject with the refresh error. So the person read "Sessão
 * expirada. Faça login novamente." while standing on the login screen, having never had a
 * session, and the message naming the actual problem was thrown away on the way.
 *
 * These are the routes reached by somebody who is not signed in, which is exactly when the
 * real message matters most. `/auth/refresh` is here too: a 401 from it means the session is
 * gone, and refreshing a refresh is the loop `_retry` exists to stop.
 */
const SESSIONLESS_ROUTES = ['/auth/login', '/auth/oauth2/google', '/auth/refresh']

function isSessionlessRoute(url: string | undefined): boolean {
  return url != null && SESSIONLESS_ROUTES.some((route) => url.includes(route))
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    // No refreshToken check any more: script cannot see the cookie, so the only way to
    // know whether a session exists is to ask. _retry stops an endless loop when the
    // refresh itself comes back 401.
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isSessionlessRoute(original.url)
    ) {
      original._retry = true
      try {
        if (!refreshing) {
          refreshing = refreshAccessToken().finally(() => {
            refreshing = null
          })
        }
        const newToken = await refreshing
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        useAuthStore.getState().clear()
        // Rejected with an Error rather than with whatever was caught: a caller doing
        // `catch (e) { e.message }` on a rejected string gets undefined, and the reason
        // the session ended disappears.
        return Promise.reject(
          refreshError instanceof Error ? refreshError : new Error(String(refreshError)),
        )
      }
    }
    notifyIfServerFailed(error)
    return Promise.reject(error)
  },
)
