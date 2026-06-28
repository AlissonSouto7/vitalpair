import { api } from './client'
import { useAuthStore } from '../store/authStore'
import type { ApiResponse } from '../types/api'
import type { LoginPayload, RegisterPayload, TokenResponse } from '../types/auth'

export async function register(payload: RegisterPayload): Promise<TokenResponse> {
  const res = await api.post<ApiResponse<TokenResponse>>('/auth/register', payload)
  return res.data.data
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await api.post<ApiResponse<TokenResponse>>('/auth/login', payload)
  return res.data.data
}

export async function googleLogin(idToken: string): Promise<TokenResponse> {
  const res = await api.post<ApiResponse<TokenResponse>>('/auth/oauth2/google', { idToken })
  return res.data.data
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken })
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token, newPassword })
}

export async function verifyEmail(token: string): Promise<void> {
  await api.post('/auth/verify-email', { token })
}

export async function resendVerification(email: string): Promise<void> {
  await api.post('/auth/resend-verification', { email })
}

/** Reemite os tokens para refletir mudanças (ex: tenant após formar o par). */
export async function refreshSession(): Promise<void> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return
  const res = await api.post<ApiResponse<TokenResponse>>('/auth/refresh', { refreshToken })
  const data = res.data.data
  useAuthStore.getState().setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userId: data.userId,
  })
}
