import { queryOptions } from '@tanstack/react-query'

import { getActivities, getActivitySummary } from '@/api/activity'

/** Today, as the API expects it. Also part of the key, so a day rolling over is a new one. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * The day's activities and their totals.
 *
 * Two independent reads rather than the one Promise.all they replace: the list and the
 * summary come from different endpoints, and pairing them meant the slower one decided when
 * either appeared and a failure in one blanked both.
 */
export const activityQueries = {
  logs: () =>
    queryOptions({
      queryKey: ['activity', 'logs', today()],
      queryFn: () => getActivities(),
    }),

  summary: () =>
    queryOptions({
      queryKey: ['activity', 'summary', today()],
      queryFn: () => getActivitySummary(),
    }),
}
