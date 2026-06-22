export type FeedItemType = 'MEAL_LOGGED' | 'ACTIVITY_LOGGED'
export type ReactionType = 'FIRE' | 'EYE' | 'STRENGTH'

export interface FeedItem {
  id: string
  userId: string
  actorName: string
  type: FeedItemType
  title: string
  isPrivate: boolean
  createdAt: string
  reactionCounts: Partial<Record<ReactionType, number>>
  myReactions: ReactionType[]
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
