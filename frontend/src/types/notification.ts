export type NotificationType = 'PARTNER_MEAL' | 'PARTNER_ACTIVITY' | 'PAIR_FORMED'

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
