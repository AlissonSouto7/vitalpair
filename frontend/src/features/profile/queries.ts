import { queryOptions } from '@tanstack/react-query'

import { getProfile, getTdee } from '@/api/profile'
import { getProgress } from '@/api/progress'
import { getSeason } from '@/api/season'

/**
 * What the profile screen reads.
 *
 * Four calls that used to be one effect with a Promise.all and three separate catch
 * clauses, one of them nested. The nesting was doing real work: the profile is required and
 * the other three are not, so a failure in any of them had to be swallowed without taking
 * the page down. As separate queries that distinction is a property of each one rather than
 * a shape the caller has to remember.
 */
export const profileQueries = {
  profile: () =>
    queryOptions({
      queryKey: ['profile'],
      queryFn: getProfile,
    }),

  /**
   * The calorie and macro targets, recomputed by the server.
   *
   * Refused with a 422 when the profile is incomplete, which is the normal state of a new
   * account rather than an error. The caller falls back to whatever the profile already
   * carries.
   */
  tdee: () =>
    queryOptions({
      queryKey: ['profile', 'tdee'],
      queryFn: getTdee,
      retry: false,
    }),

  /** Only the weight history is read here; the chart itself lives on the progress screen. */
  progress: () =>
    queryOptions({
      queryKey: ['progress'],
      queryFn: getProgress,
    }),

  /** Read for the lifetime points behind the creature's level, not for the scoreboard. */
  season: () =>
    queryOptions({
      queryKey: ['season'],
      queryFn: getSeason,
    }),
}
