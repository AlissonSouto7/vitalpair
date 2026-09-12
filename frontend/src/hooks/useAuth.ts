import * as authApi from '../api/auth'
import { useAuthStore } from '../store/authStore'
import type { LoginPayload, RegisterPayload } from '../types/auth'

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = useAuthStore((s) => s.userId)
  const setSession = useAuthStore((s) => s.setSession)
  const clear = useAuthStore((s) => s.clear)

  async function login(payload: LoginPayload) {
    const token = await authApi.login(payload)
    setSession({ accessToken: token.accessToken, userId: token.userId })
  }

  /**
   * Starts a registration. No session follows: the account is created unverified and the
   * link in the e-mail is what activates it, so that registration can answer the same way
   * for an address that already has an account.
   */
  async function register(payload: RegisterPayload) {
    await authApi.register(payload)
  }

  async function logout() {
    try {
      // The server reads the cookie and clears it; the client has nothing to hand over.
      await authApi.logout()
    } catch {
      // ignora falha de logout remoto; limpa a sessão local de qualquer forma
    }
    clear()
  }

  return { isAuthenticated: !!accessToken, userId, login, register, logout }
}
