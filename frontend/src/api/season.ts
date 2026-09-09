import type { ApiResponse } from '../types/api'
import type { SeasonView } from '../types/season'

import { api } from './client'

export async function getSeason(): Promise<SeasonView> {
  const res = await api.get<ApiResponse<SeasonView>>('/season')
  return res.data.data
}
