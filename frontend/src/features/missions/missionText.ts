import type { ReactNode } from 'react'

import { DumbbellIcon, ForkKnifeIcon, UsersIcon } from './icons'

import type { WeeklyMissionIcon } from '@/types/missions'

/**
 * The lookup and the countdown formatting, apart from the components.
 *
 * A file that exports both a component and a plain value stops hot reload from working, so
 * these live here rather than beside the icons they point at.
 */

export const WEEKLY_ICON: Record<WeeklyMissionIcon, (props: { className?: string }) => ReactNode> =
  {
    MEAL: ForkKnifeIcon,
    WORKOUT: DumbbellIcon,
    USERS: UsersIcon,
  }

/** "1h 20min" while there is an hour left, "04:35" once there is not. */
export function formatRemaining(totalSeconds: number): string {
  if (totalSeconds >= 3600) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    return `${h}h ${m}min`
  }
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Which encouragement to show, by how close the person is. */
export function progressLabelKey(current: number, target: number) {
  if (current >= target) return 'missions.progressDone'
  if (target - current === 1) return 'missions.progressAlmost'
  if (current === 0) return 'missions.progressStart'
  return 'missions.progressGoing'
}

/** Just the first name, so a mission card does not wrap on someone's full name. */
export function firstName(name?: string | null): string {
  return (name ?? '').trim().split(/\s+/)[0] || 'Par'
}
