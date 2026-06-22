import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { Badge, Competition, EarnedBadge, Streak } from '../types/gamification'

export async function getStreaks(): Promise<Streak[]> {
  const res = await api.get<ApiResponse<Streak[]>>('/gamification/streaks')
  return res.data.data
}

export async function getCompetition(): Promise<Competition> {
  const res = await api.get<ApiResponse<Competition>>('/gamification/competition')
  return res.data.data
}

export async function getBadges(): Promise<EarnedBadge[]> {
  const res = await api.get<ApiResponse<EarnedBadge[]>>('/gamification/badges')
  return res.data.data
}

export async function getBadgeCatalog(): Promise<Badge[]> {
  const res = await api.get<ApiResponse<Badge[]>>('/gamification/badges/catalog')
  return res.data.data
}
