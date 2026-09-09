import type { ApiResponse } from '../types/api'
import type { Tdee, UpdateProfilePayload, UserProfile } from '../types/profile'

import { api } from './client'

export async function getProfile(): Promise<UserProfile> {
  const res = await api.get<ApiResponse<UserProfile>>('/users/me')
  return res.data.data
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const res = await api.put<ApiResponse<UserProfile>>('/users/me', payload)
  return res.data.data
}

/**
 * Closes the account. There is no undo.
 *
 * The person's own records are deleted; what describes a competition they took part in is
 * kept with their identity stripped out, because the season history is summed from the
 * point ledger and removing those rows would rewrite who won a season the partner played.
 */
export async function closeAccount(): Promise<void> {
  await api.delete('/users/me')
}

export async function getTdee(): Promise<Tdee> {
  const res = await api.get<ApiResponse<Tdee>>('/users/me/tdee')
  return res.data.data
}
