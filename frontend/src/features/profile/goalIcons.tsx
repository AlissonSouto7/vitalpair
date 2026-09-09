import type { ReactNode } from 'react'

import { IconDown, IconEqual, IconMuscle, IconSpark } from './icons'

import type { Goal } from '@/types/profile'

/**
 * Which icon stands for each goal.
 *
 * A lookup table rather than a component, so it lives apart from the icons themselves: a
 * module that exports both stops hot reload from working.
 */
export const GOAL_ICON: Record<Goal, ReactNode> = {
  LOSE_WEIGHT: <IconDown className="h-5 w-5" />,
  GAIN_MUSCLE: <IconMuscle className="h-5 w-5" />,
  MAINTAIN: <IconEqual className="h-5 w-5" />,
  IMPROVE_FITNESS: <IconSpark className="h-5 w-5" />,
}
