import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { NotificationFeed } from '../types/notification'

export async function listNotifications(): Promise<NotificationFeed> {
  const res = await api.get<ApiResponse<NotificationFeed>>('/notifications')
  return res.data.data
}

export async function markNotificationsRead(): Promise<void> {
  await api.put('/notifications/read')
}
