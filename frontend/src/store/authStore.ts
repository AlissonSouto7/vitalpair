import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Session {
  accessToken: string
  userId: string
}

interface AuthState {
  accessToken: string | null
  userId: string | null
  /** False until the app has asked the server whether a session exists. */
  bootstrapped: boolean
  setSession: (session: Session) => void
  setBootstrapped: () => void
  clear: () => void
}

/**
 * Session state.
 *
 * <p>The refresh token is deliberately absent: it lives in an HttpOnly cookie the browser
 * attaches on its own, where script cannot read it. Previously both tokens sat in
 * localStorage, so any injected script could take a credential that renews itself for
 * thirty days.
 *
 * <p>Only `userId` is persisted. The access token is kept in memory, so it does not survive
 * a reload; the app calls /auth/refresh on startup and the cookie restores the session. An
 * access token in localStorage would be readable by the same script the cookie protects
 * against, for the sake of skipping one request.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      userId: null,
      bootstrapped: false,
      setSession: ({ accessToken, userId }) => set({ accessToken, userId, bootstrapped: true }),
      setBootstrapped: () => set({ bootstrapped: true }),
      clear: () => set({ accessToken: null, userId: null, bootstrapped: true }),
    }),
    {
      name: 'vitalpair-auth',
      // Nothing security-sensitive reaches storage. userId is kept so the UI can render
      // before the refresh call returns.
      partialize: (state) => ({ userId: state.userId }),
    },
  ),
)
