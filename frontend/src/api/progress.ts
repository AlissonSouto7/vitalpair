import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { ProgressView } from '../types/progress'

export async function getProgress(): Promise<ProgressView> {
  const res = await api.get<ApiResponse<ProgressView>>('/progress')
  return res.data.data
}

export async function recordWeight(weightKg: number): Promise<void> {
  await api.post('/progress/weight', { weightKg })
}
