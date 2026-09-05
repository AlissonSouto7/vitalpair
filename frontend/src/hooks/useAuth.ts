import { useAuthStore } from '../store/authStore'
import * as authApi from '../api/auth'
import type { LoginPayload, RegisterPayload } from '../types/auth'

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = useAuthStore((s) => s.userId)
  const setSession = useAuthStore((s) => s.setSession)
  const clear = useAuthStore((s) => s.clear)

  async function login(payload: LoginPayload) {
    const token = await authApi.login(payload)
    setSession({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      userId: token.userId,
    })
  }

  async function register(payload: RegisterPayload) {
    const token = await authApi.register(payload)
    setSession({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      userId: token.userId,
    })
  }

  async function logout() {
    const refreshToken = useAuthStore.getState().refreshToken
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // ignora falha de logout remoto; limpa a sessão local de qualquer forma
    }
    clear()
  }

  return { isAuthenticated: !!accessToken, userId, login, register, logout }
}
