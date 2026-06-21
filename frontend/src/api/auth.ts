import { api } from './client'
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

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken })
}
