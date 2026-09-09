import { queryOptions } from '@tanstack/react-query'

import { getWorkoutToday } from '@/api/aiplan'

/** What the workout screen reads. */
export const workoutPlanQueries = {
  /**
   * Today's workout, or null when the person has no plan yet.
   *
   * Null is the normal state of a new account, not a failure, so the screen shows the
   * "generate one" call to action rather than an error.
   */
  today: () =>
    queryOptions({
      queryKey: ['workout-plan', 'today'],
      queryFn: getWorkoutToday,
    }),
}
