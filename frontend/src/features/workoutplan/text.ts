/**
 * How the workout goal is worded.
 *
 * Apart from the components because a file exporting both stops hot reload from working.
 */

export function goalLabel(t: (k: string) => string, goal: string): string {
  const known = ['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN', 'IMPROVE_FITNESS']
  return known.includes(goal) ? t(`profile.goalLabel.${goal}`).toLowerCase() : goal.toLowerCase()
}
