import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { SeasonView } from '../types/season'

export async function getSeason(): Promise<SeasonView> {
  const res = await api.get<ApiResponse<SeasonView>>('/season')
  return res.data.data
}
