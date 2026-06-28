export type NotificationType =
  | 'PARTNER_MEAL'
  | 'PARTNER_ACTIVITY'
  | 'PAIR_FORMED'
  | 'RIVAL_OVERTOOK'
  | 'FLASH_MISSION'
  | 'LOG_REMINDER'

export interface NotificationPrefs {
  notifyRival: boolean
  notifyFlash: boolean
  notifyReminder: boolean
}

export interface AppNotification {
  id: string
  type: NotificationType
  actorName: string | null
  refText: string | null
  amount: number | null
  read: boolean
  createdAt: string
}

export interface NotificationFeed {
  unreadCount: number
  items: AppNotification[]
}
