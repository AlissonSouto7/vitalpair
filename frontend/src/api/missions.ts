import type { ApiResponse } from '../types/api'
import type { FlashMission, WeeklyMission } from '../types/missions'

import { api } from './client'

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

/**
 * Devolve a missão de hoje, para quem topou e mudou de ideia.
 *
 * Topar era mão única: quem clicasse por engano carregava a missão até o dia virar. O
 * servidor responde com a missão de hoje não aceita, e topar de novo continua possível.
 */
export async function cancelFlashMission(): Promise<FlashMission> {
  const res = await api.post<ApiResponse<FlashMission>>('/missions/flash/cancel')
  return res.data.data
}
