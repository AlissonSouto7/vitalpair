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

/**
 * Sets the profile photo and returns the opaque name it was stored under.
 *
 * Sends base64 in a JSON body rather than multipart, which is the convention this API already
 * uses for the meal photo and keeps the answer in the standard envelope. The 90 second timeout
 * is generous on purpose: the request carries a whole image over whatever connection the person
 * happens to be on, and the default would fail a slow upload that was about to succeed.
 */
export async function setAvatar(imageBase64: string): Promise<string> {
  const res = await api.put<ApiResponse<{ avatarUrl: string }>>(
    '/users/me/avatar',
    { imageBase64 },
    { timeout: 90_000 },
  )
  return res.data.data.avatarUrl
}

/** Clears the photo and deletes the stored file. */
export async function removeAvatar(): Promise<void> {
  await api.delete('/users/me/avatar')
}
