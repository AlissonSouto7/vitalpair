export type FeedItemType = 'MEAL_LOGGED' | 'ACTIVITY_LOGGED'
export type ReactionType = 'FIRE' | 'EYE' | 'STRENGTH'

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
export type ActivityKind = 'STEPS' | 'RUN' | 'WALK' | 'CYCLE' | 'WORKOUT'

/**
 * One timeline item.
 *
 * The server sends what was logged and this screen writes the sentence, so the feed reads in
 * the language the person chose. `title` and `subtitle` are the old pre-rendered Portuguese
 * text and are present only on items stored before that change; they are the fallback, not the
 * normal path.
 */
export interface FeedItem {
  id: string
  userId: string
  actorName: string
  type: FeedItemType
  title: string | null
  subtitle: string | null
  foodName: string | null
  mealType: MealType | null
  activityType: ActivityKind | null
  /** Eaten for a meal, burned for an activity. */
  calories: number | null
  proteinG: number | null
  carbG: number | null
  fatG: number | null
  durationMinutes: number | null
  /** Points actually awarded. Zero for every record but the day's first of that type. */
  points: number
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
