import type { TFunction } from 'i18next'

import type { Goal } from '@/types/profile'
/**
 * How the workout goal is worded.
 *
 * Apart from the components because a file exporting both stops hot reload from working.
 */

const KNOWN = [
  'LOSE_WEIGHT',
  'GAIN_MUSCLE',
  'MAINTAIN',
  'IMPROVE_FITNESS',
] as const satisfies readonly Goal[]

/** Whether the server's free-text goal is one the translations know about. */
function isGoal(value: string): value is Goal {
  return (KNOWN as readonly string[]).includes(value)
}

export function goalLabel(t: TFunction, goal: string): string {
  return isGoal(goal) ? t(`profile.goalLabel.${goal}`).toLowerCase() : goal.toLowerCase()
}
