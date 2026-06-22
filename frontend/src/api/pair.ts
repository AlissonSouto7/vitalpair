import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { Pair, RelationshipType } from '../types/pair'

export async function getPair(): Promise<Pair> {
  const res = await api.get<ApiResponse<Pair>>('/pair')
  return res.data.data
}

export async function generateInvite(): Promise<Pair> {
  const res = await api.post<ApiResponse<Pair>>('/pair/invite')
  return res.data.data
}

export async function joinPair(code: string): Promise<Pair> {
  const res = await api.post<ApiResponse<Pair>>(`/pair/join/${code}`)
  return res.data.data
}

export async function updateRelationshipType(type: RelationshipType): Promise<Pair> {
  const res = await api.put<ApiResponse<Pair>>('/pair/type', { type })
  return res.data.data
}
