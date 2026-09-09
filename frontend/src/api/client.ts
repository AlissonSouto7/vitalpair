import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from '../store/authStore'
import type { ApiResponse } from '../types/api'
import type { TokenResponse } from '../types/auth'

import { notifyIfServerFailed } from '@/shared/api/notifyServerFailure'

const baseURL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8081/api/v1'

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

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    // No refreshToken check any more: script cannot see the cookie, so the only way to
    // know whether a session exists is to ask. _retry stops an endless loop when the
    // refresh itself comes back 401.
    if (error.response?.status === 401 && original && !original._retry) {
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
