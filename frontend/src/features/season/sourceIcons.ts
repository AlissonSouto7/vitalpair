import type { ReactNode } from 'react'

import { DumbbellIcon, FlameIcon, ForkKnifeIcon, StarIcon } from './icons'

/**
 * Which icon stands for each kind of point.
 *
 * A lookup table rather than a component, so it lives apart from the icons themselves: a
 * module that exports both stops hot reload from working.
 */
export const SOURCE_ICONS: Record<string, (props: { className?: string }) => ReactNode> = {
  MEAL: ForkKnifeIcon,
  ACTIVITY: DumbbellIcon,
  STREAK: FlameIcon,
  MISSION: StarIcon,
}
