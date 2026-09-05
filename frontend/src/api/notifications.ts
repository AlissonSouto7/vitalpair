import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { NotificationFeed, NotificationPrefs } from '../types/notification'

export async function listNotifications(): Promise<NotificationFeed> {
  const res = await api.get<ApiResponse<NotificationFeed>>('/notifications')
  return res.data.data
}

export async function markNotificationsRead(): Promise<void> {
  await api.put('/notifications/read')
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const res = await api.get<ApiResponse<NotificationPrefs>>('/me/notification-prefs')
  return res.data.data
}

export async function updateNotificationPrefs(
  prefs: NotificationPrefs,
): Promise<NotificationPrefs> {
  const res = await api.put<ApiResponse<NotificationPrefs>>('/me/notification-prefs', prefs)
  return res.data.data
}
