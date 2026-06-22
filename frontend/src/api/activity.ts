import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { ActivityLog, ActivitySummary, LogActivityPayload } from '../types/activity'

export async function logActivity(payload: LogActivityPayload): Promise<ActivityLog> {
  const res = await api.post<ApiResponse<ActivityLog>>('/activity/logs', payload)
  return res.data.data
}

export async function getActivities(date?: string): Promise<ActivityLog[]> {
  const res = await api.get<ApiResponse<ActivityLog[]>>('/activity/logs', {
    params: date ? { date } : undefined,
  })
  return res.data.data
}

export async function getActivitySummary(date?: string): Promise<ActivitySummary> {
  const res = await api.get<ApiResponse<ActivitySummary>>('/activity/summary', {
    params: date ? { date } : undefined,
  })
  return res.data.data
}
