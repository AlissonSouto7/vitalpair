import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { FlashMission, WeeklyMission } from '../types/missions'

export async function getWeeklyMissions(): Promise<WeeklyMission[]> {
  const res = await api.get<ApiResponse<WeeklyMission[]>>('/missions/weekly')
  return res.data.data
}

export async function getFlashMission(): Promise<FlashMission | null> {
  const res = await api.get<ApiResponse<FlashMission | null>>('/missions/flash')
  return res.data.data
}

export async function acceptFlashMission(): Promise<FlashMission> {
  const res = await api.post<ApiResponse<FlashMission>>('/missions/flash/accept')
  return res.data.data
}
