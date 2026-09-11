import { api } from './client'

import type { ApiResponse } from '@/types/api'
import type { Entitlement } from '@/types/entitlement'

export async function getMyEntitlement(): Promise<Entitlement> {
  const res = await api.get<ApiResponse<Entitlement>>('/entitlements/me')
  return res.data.data
}
