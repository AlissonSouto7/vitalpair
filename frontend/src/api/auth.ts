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

/** Ends the session server-side. The refresh cookie identifies it and is cleared in the response. */
export async function logout(): Promise<void> {
  await api.post('/auth/logout')
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

/**
 * Re-issues the access token so it reflects a change the server made, such as the tenant
 * id after joining a pair. The refresh token travels in the cookie, so there is nothing to
 * read or send here.
 */
export async function refreshSession(): Promise<void> {
  const res = await api.post<ApiResponse<TokenResponse>>('/auth/refresh')
  const data = res.data.data
  useAuthStore.getState().setSession({ accessToken: data.accessToken, userId: data.userId })
}
