import type { ActivityLog, ActivitySummary } from '@/types/activity'
import type { Entitlement } from '@/types/entitlement'
import type { DailySummary, FavoriteFood, FoodLog, FoodProduct } from '@/types/nutrition'
import type { Pair } from '@/types/pair'
import type { Tdee, UserProfile } from '@/types/profile'
import type { ProgressView } from '@/types/progress'
import type { SeasonView } from '@/types/season'

/**
 * Data the fake backend answers with.
 *
 * Shapes follow the API types exactly, so a field the backend renames breaks the type
 * check here rather than a screen in production. Values are plain and Brazilian on
 * purpose: they are what a person would see, and a test that reads "Ana Souza" is
 * easier to follow than one that reads "user1".
 */

export const profileFixture: UserProfile = {
  id: 'u1',
  email: 'ana@example.com',
  emailVerified: true,
  name: 'Ana Souza',
  birthDate: '1995-05-10',
  sex: 'MALE',
  heightCm: 175,
  weightKg: 78,
  goal: 'LOSE_WEIGHT',
  activityLevel: 'MODERATE',
  dailyCalorieTarget: 2100,
  proteinTargetG: 140,
  carbTargetG: 220,
  fatTargetG: 70,
  timeZone: 'America/Sao_Paulo',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

export const tdeeFixture: Tdee = {
  bmr: 1700,
  tdee: 2500,
  dailyCalorieTarget: 2100,
  proteinTargetG: 140,
  carbTargetG: 220,
  fatTargetG: 70,
}

export const progressFixture: ProgressView = {
  weights: [
    { date: '2026-09-01', weightKg: 79 },
    { date: '2026-09-07', weightKg: 78 },
  ],
  targetKcal: 2100,
  calories: [],
  macros: [],
}

export const seasonFixture: SeasonView = {
  number: 1,
  day: 3,
  total: 14,
  daysLeft: 11,
  stake: 'Jantar',
  hasPartner: true,
  you: { name: 'Ana', score: 120 },
  rival: { name: 'Bruno', score: 90 },
  days: [],
  breakdown: [],
  history: [],
}

/** A pair still waiting for the second person, which is the screen with the join form. */
export const pairPendingFixture: Pair = {
  id: 'p1',
  pairName: null,
  status: 'PENDING',
  relationshipType: 'PAIR',
  inviteCode: 'ABCD2345',
  members: [{ userId: 'u1', name: 'Ana Souza', email: 'ana@example.com', avatarUrl: null }],
}

/** A formed pair, which is the screen with the relationship card and the leave button. */
export const pairActiveFixture: Pair = {
  id: 'p1',
  pairName: 'Ana & Bruno',
  status: 'ACTIVE',
  relationshipType: 'PAIR',
  inviteCode: 'ABCD2345',
  members: [
    { userId: 'u1', name: 'Ana Souza', email: 'ana@example.com', avatarUrl: null },
    { userId: 'u2', name: 'Bruno Lima', email: 'bruno@example.com', avatarUrl: null },
  ],
}

export const dailySummaryFixture: DailySummary = {
  date: '2026-09-08',
  consumedCalories: 890,
  consumedProteinG: 45,
  consumedCarbG: 100,
  consumedFatG: 30,
  targetCalories: 2100,
  targetProteinG: 140,
  targetCarbG: 220,
  targetFatG: 70,
  remainingCalories: 1210,
  mealCount: 2,
}

export const foodLogsFixture: FoodLog[] = [
  {
    id: 'f1',
    foodName: 'Banana',
    barcode: null,
    quantityG: 120,
    caloriesKcal: 107,
    proteinG: 1.3,
    carbG: 27,
    fatG: 0.4,
    mealType: 'BREAKFAST',
    source: 'MANUAL',
    loggedAt: '2026-09-08T09:00:00Z',
  },
]

export const favoriteFoodsFixture: FavoriteFood[] = [
  {
    foodName: 'Ovo mexido',
    quantityG: 100,
    caloriesKcal: 155,
    proteinG: 13,
    carbG: 1.1,
    fatG: 11,
    count: 7,
  },
]

export const foodProductsFixture: FoodProduct[] = [
  {
    name: 'Iogurte natural',
    barcode: '7891000100103',
    caloriesPer100g: 61,
    proteinPer100g: 3.5,
    carbPer100g: 4.7,
    fatPer100g: 3.3,
  },
]

export const activitySummaryFixture: ActivitySummary = {
  date: '2026-09-08',
  totalCaloriesBurned: 0,
  totalSteps: 0,
  activityCount: 0,
}

export const activityLogsFixture: ActivityLog[] = []

/** A free account, which is every account until someone pays: the AI features are closed. */
export const freeEntitlementFixture: Entitlement = { plan: 'FREE', aiAccess: false }

/** An account with the AI features open, through its own plan or a partner's. */
export const premiumEntitlementFixture: Entitlement = { plan: 'PREMIUM', aiAccess: true }
