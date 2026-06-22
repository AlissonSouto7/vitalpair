import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { Tdee, UpdateProfilePayload, UserProfile } from '../types/profile'

export async function getProfile(): Promise<UserProfile> {
  const res = await api.get<ApiResponse<UserProfile>>('/users/me')
  return res.data.data
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const res = await api.put<ApiResponse<UserProfile>>('/users/me', payload)
  return res.data.data
}

export async function getTdee(): Promise<Tdee> {
  const res = await api.get<ApiResponse<Tdee>>('/users/me/tdee')
  return res.data.data
}
