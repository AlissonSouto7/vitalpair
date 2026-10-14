import type { ApiResponse } from '../types/api'
import type { ProgressDays, ProgressView } from '../types/progress'

import { api } from './client'

export async function getProgress(days: ProgressDays = 7): Promise<ProgressView> {
  const res = await api.get<ApiResponse<ProgressView>>('/progress', { params: { days } })
  return res.data.data
}

export async function recordWeight(weightKg: number): Promise<void> {
  await api.post('/progress/weight', { weightKg })
}
