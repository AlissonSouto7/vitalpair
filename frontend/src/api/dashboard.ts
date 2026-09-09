import type { ApiResponse } from '../types/api'
import type { Dashboard } from '../types/dashboard'

import { api } from './client'

export async function getDashboard(): Promise<Dashboard> {
  const res = await api.get<ApiResponse<Dashboard>>('/dashboard')
  return res.data.data
}
