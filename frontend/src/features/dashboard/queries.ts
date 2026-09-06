import { queryOptions } from '@tanstack/react-query'

import { getActivities } from '@/api/activity'
import { getDashboard } from '@/api/dashboard'
import { getFeed } from '@/api/feed'
import { getCompetition, getStreaks } from '@/api/gamification'
import { getFlashMission } from '@/api/missions'
import { getPair } from '@/api/pair'

/** Today, as the API expects it. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * The dashboard's data, as seven independent queries.
 *
 * They used to be one Promise.all inside a useEffect, which meant the slowest call decided
 * when anything appeared, a failure in any of them blanked the whole screen, and coming
 * back to the dashboard refetched all seven. As separate queries each one caches on its
 * own, the cheap ones paint immediately, and the optional ones can fail without taking the
 * page with them.
 *
 * The keys are what other screens invalidate: logging a meal marks the dashboard summary
 * stale, so the number is right when the user navigates back instead of a reload later.
 */
export const dashboardQueries = {
  summary: () =>
    queryOptions({
      queryKey: ['dashboard', 'summary', today()],
      queryFn: getDashboard,
    }),

  pair: () =>
    queryOptions({
      queryKey: ['pair'],
      queryFn: getPair,
      // The pair changes when someone accepts an invite, which is rare and always
      // accompanied by a navigation, so this can be cached far longer than the rest.
      staleTime: 5 * 60_000,
    }),

  competition: () =>
    queryOptions({
      queryKey: ['gamification', 'competition'],
      queryFn: getCompetition,
    }),

  streaks: () =>
    queryOptions({
      queryKey: ['gamification', 'streaks'],
      queryFn: getStreaks,
    }),

  todaysActivities: () =>
    queryOptions({
      queryKey: ['activity', 'logs', today()],
      queryFn: () => getActivities(today()),
    }),

  recentFeed: () =>
    queryOptions({
      queryKey: ['feed', { page: 0, size: 4 }],
      queryFn: () => getFeed(0, 4),
    }),

  flashMission: () =>
    queryOptions({
      queryKey: ['missions', 'flash'],
      queryFn: getFlashMission,
    }),
}
