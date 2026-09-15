import type { Goal } from '@/types/profile'

/**
 * Whether a weight change is going the way the person wants.
 *
 * The premise of this product is a pair with opposite goals, one cutting and one bulking. So a
 * fixed rule is necessarily wrong for one of them, always: the screens used to paint any loss
 * green and any gain orange, which told somebody who had just gained the muscle they were
 * training for that their progress was a problem. The profile knows the goal; nothing was
 * asking it.
 *
 * Returns the direction of travel relative to the goal, not a value judgement about the person.
 * MAINTAIN is its own case: there, either direction is drift, and holding steady is the win.
 */
export type WeightVerdict = 'toward' | 'away' | 'steady'

/** Below this, the change is noise: a scale reads differently morning to evening. */
const STEADY_KG = 0.3

export function weightVerdict(deltaKg: number, goal: Goal | null | undefined): WeightVerdict {
  if (Math.abs(deltaKg) < STEADY_KG) return 'steady'

  switch (goal) {
    case 'LOSE_WEIGHT':
      return deltaKg < 0 ? 'toward' : 'away'
    case 'GAIN_MUSCLE':
      return deltaKg > 0 ? 'toward' : 'away'
    case 'MAINTAIN':
      // Any real movement is away from the goal, in both directions.
      return 'away'
    default:
      // IMPROVE_FITNESS, or no goal set yet. The app has not been told which way is better, so
      // it does not guess: the number is shown without a verdict rather than praising or
      // warning at random.
      return 'steady'
  }
}

/** The text colour for a verdict, using the tokens whose contrast is pinned by the theme test. */
export function weightVerdictClass(verdict: WeightVerdict): string {
  switch (verdict) {
    case 'toward':
      return 'text-success-ink'
    case 'away':
      // Amber, not the brand orange: this is "keep an eye on it", and orange is the colour of
      // the primary action everywhere else, which made a gain look like something to tap.
      return 'text-carb-ink'
    case 'steady':
      return 'text-muted'
  }
}
