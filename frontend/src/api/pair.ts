import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { InvitePreview, Pair, RelationshipType } from '../types/pair'

export async function getPair(): Promise<Pair> {
  const res = await api.get<ApiResponse<Pair>>('/pair')
  return res.data.data
}

// Público: usado na landing de aceitação do convite (a pessoa pode estar deslogada).
export async function getInvitePreview(code: string): Promise<InvitePreview> {
  const res = await api.get<ApiResponse<InvitePreview>>(`/pair/invite/${code}`)
  return res.data.data
}

export async function joinPair(code: string): Promise<Pair> {
  const res = await api.post<ApiResponse<Pair>>(`/pair/join/${code}`)
  return res.data.data
}

/**
 * Ends the pair. Both people come out of it alone, each with a fresh invite code and
 * everything they logged; the seasons and scores stay with the pair that produced them.
 *
 * @returns the caller's new, empty pair
 */
export async function leavePair(): Promise<Pair> {
  const res = await api.delete<ApiResponse<Pair>>('/pair/membership')
  return res.data.data
}

export async function updateRelationshipType(type: RelationshipType): Promise<Pair> {
  const res = await api.put<ApiResponse<Pair>>('/pair/type', { type })
  return res.data.data
}
