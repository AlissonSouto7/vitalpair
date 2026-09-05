export type ActivityType = 'STEPS' | 'RUN' | 'WALK' | 'CYCLE' | 'WORKOUT' | 'OTHER'
export type ActivitySource =
  'WEWARD' | 'GOOGLE_FIT' | 'APPLE_HEALTH' | 'STRAVA' | 'GARMIN' | 'MANUAL'

export interface ActivityLog {
  id: string
  activityType: ActivityType
  steps: number | null
  distanceKm: number | null
  caloriesBurned: number
  durationMinutes: number | null
  source: ActivitySource
  externalId: string | null
  loggedAt: string
}

export interface LogActivityPayload {
  activityType: ActivityType
  steps?: number | null
  distanceKm?: number | null
  caloriesBurned?: number | null
  durationMinutes?: number | null
  source: ActivitySource
}

export interface ActivitySummary {
  date: string
  totalCaloriesBurned: number
  totalSteps: number
  activityCount: number
}
