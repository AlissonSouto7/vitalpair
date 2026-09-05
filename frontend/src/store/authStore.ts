import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Session {
  accessToken: string
  refreshToken: string
  userId: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  setSession: (session: Session) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      setSession: ({ accessToken, refreshToken, userId }) =>
        set({ accessToken, refreshToken, userId }),
      clear: () => set({ accessToken: null, refreshToken: null, userId: null }),
    }),
    { name: 'vitalpair-auth' },
  ),
)
